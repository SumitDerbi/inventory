"""Inquiry API views (Step 05a)."""
from __future__ import annotations

import csv
from io import StringIO

from django.db.models import Count
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.views import AuditModelViewSet

from . import services
from .models import Inquiry, InquiryFollowUp, InquiryLineItem
from .serializers import (
    AssignSerializer,
    BulkAssignSerializer,
    BulkExportSerializer,
    BulkStatusSerializer,
    InquiryActivityLogSerializer,
    InquiryFollowUpSerializer,
    InquiryLineItemSerializer,
    InquiryListSerializer,
    InquirySerializer,
    StatusChangeSerializer,
)


class InquiryViewSet(AuditModelViewSet):
    queryset = Inquiry.objects.select_related(
        "source", "customer", "assigned_to", "product_category"
    ).prefetch_related("line_items")
    filterset_fields = (
        "status",
        "priority",
        "inquiry_type",
        "source",
        "assigned_to",
        "customer",
    )
    search_fields = (
        "inquiry_number",
        "customer_name",
        "company_name",
        "mobile",
        "email",
        "project_name",
    )
    ordering_fields = ("created_at", "expected_order_date", "priority", "status")
    ordering = ("-created_at",)

    def get_serializer_class(self):
        if self.action == "list":
            return InquiryListSerializer
        return InquirySerializer

    # ---------------- create / update ---------------------------------
    def create(self, request, *args, **kwargs):
        force = request.query_params.get("force", "").lower() == "true"
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if not force:
            matches = services.find_duplicate_inquiries(
                mobile=ser.validated_data.get("mobile", ""),
                email=ser.validated_data.get("email", ""),
                project_name=ser.validated_data.get("project_name", ""),
            )
            if matches:
                return Response(
                    {"detail": "possible duplicates", "matches": matches},
                    status=status.HTTP_409_CONFLICT,
                )

        user = request.user if request.user.is_authenticated else None
        inquiry = ser.save(
            inquiry_number=services.next_inquiry_number(),
            created_by=user,
            updated_by=user,
            status=Inquiry.Status.NEW,
        )
        services.log_activity(inquiry, action_type="created", user=user)
        return Response(self.get_serializer(inquiry).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status in (Inquiry.Status.CONVERTED, Inquiry.Status.LOST):
            user = request.user
            is_admin = bool(user.is_authenticated and (user.is_superuser or user.is_staff))
            if not is_admin:
                return Response(
                    {"detail": f"locked: status={instance.status}"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        instance = serializer.save(
            updated_by=self.request.user if self.request.user.is_authenticated else None
        )
        services.log_activity(
            instance,
            action_type="updated",
            user=self.request.user,
            remarks=",".join(sorted(serializer.validated_data.keys())),
        )

    # ---------------- single-inquiry actions --------------------------
    @action(detail=True, methods=["post"], url_path="assign")
    def assign(self, request, pk=None):
        ser = AssignSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        from apps.auth_ext.models import User

        target = User.objects.filter(id=ser.validated_data["user_id"]).first()
        if target is None:
            return Response({"detail": "user not found"}, status=400)
        inquiry = self.get_object()
        old = inquiry.assigned_to_id
        inquiry.assigned_to = target
        inquiry.updated_by = request.user if request.user.is_authenticated else None
        inquiry.save(update_fields=["assigned_to", "updated_by", "updated_at"])
        services.log_activity(
            inquiry,
            action_type="assigned",
            user=request.user,
            old_value=str(old or ""),
            new_value=str(target.id),
        )
        return Response(self.get_serializer(inquiry).data)

    @action(detail=True, methods=["post"], url_path="status")
    def change_status(self, request, pk=None):
        ser = StatusChangeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        inquiry = self.get_object()
        try:
            services.apply_status(
                inquiry,
                new_status=ser.validated_data["status"],
                user=request.user,
                lost_reason=ser.validated_data.get("lost_reason", ""),
            )
        except services.StatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        return Response(self.get_serializer(inquiry).data)

    @action(detail=True, methods=["post"], url_path="convert-to-quotation")
    def convert_to_quotation(self, request, pk=None):
        inquiry = self.get_object()
        try:
            quotation = services.convert_to_quotation(inquiry, user=request.user)
        except services.ConversionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        return Response(
            {
                "quotation_id": quotation.id,
                "quotation_number": quotation.quotation_number,
                "inquiry_id": inquiry.id,
                "inquiry_status": inquiry.status,
            },
            status=status.HTTP_201_CREATED,
        )

    # ---------------- nested collections ------------------------------
    @action(detail=True, methods=["get", "post"], url_path="follow-ups")
    def follow_ups(self, request, pk=None):
        inquiry = self.get_object()
        if request.method == "GET":
            qs = inquiry.follow_ups.all()
            return Response(InquiryFollowUpSerializer(qs, many=True).data)
        ser = InquiryFollowUpSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        obj = ser.save(inquiry=inquiry, created_by=user, updated_by=user)
        services.log_activity(
            inquiry,
            action_type="follow_up_scheduled",
            user=request.user,
            new_value=obj.follow_up_type,
        )
        return Response(InquiryFollowUpSerializer(obj).data, status=201)

    @action(detail=True, methods=["get"], url_path="activity")
    def activity(self, request, pk=None):
        inquiry = self.get_object()
        qs = inquiry.activity_logs.all()
        return Response(InquiryActivityLogSerializer(qs, many=True).data)

    @action(detail=True, methods=["get", "post"], url_path="items")
    def items(self, request, pk=None):
        inquiry = self.get_object()
        if request.method == "GET":
            return Response(
                InquiryLineItemSerializer(inquiry.line_items.all(), many=True).data
            )
        ser = InquiryLineItemSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        obj = ser.save(inquiry=inquiry, created_by=user, updated_by=user)
        services.log_activity(
            inquiry, action_type="line_item_added", user=request.user, new_value=str(obj.id)
        )
        return Response(InquiryLineItemSerializer(obj).data, status=201)

    # ---------------- bulk -------------------------------------------
    @action(detail=False, methods=["post"], url_path="bulk-assign")
    def bulk_assign(self, request):
        ser = BulkAssignSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = services.bulk_assign(
            ser.validated_data["inquiry_ids"],
            ser.validated_data["user_id"],
            actor=request.user,
        )
        code = (
            status.HTTP_207_MULTI_STATUS if result["failed"] else status.HTTP_200_OK
        )
        return Response(result, status=code)

    @action(detail=False, methods=["post"], url_path="bulk-status")
    def bulk_status(self, request):
        ser = BulkStatusSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = services.bulk_change_status(
            ser.validated_data["inquiry_ids"],
            ser.validated_data["status"],
            actor=request.user,
            lost_reason=ser.validated_data.get("lost_reason", ""),
        )
        code = (
            status.HTTP_207_MULTI_STATUS if result["failed"] else status.HTTP_200_OK
        )
        return Response(result, status=code)

    @action(detail=False, methods=["post"], url_path="bulk-export")
    def bulk_export(self, request):
        ser = BulkExportSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ids = ser.validated_data["inquiry_ids"]
        rows = Inquiry.objects.filter(id__in=ids).values(
            "id",
            "inquiry_number",
            "customer_name",
            "company_name",
            "mobile",
            "email",
            "status",
            "priority",
            "inquiry_type",
            "created_at",
        )
        buf = StringIO()
        writer = csv.writer(buf)
        header = [
            "id",
            "inquiry_number",
            "customer_name",
            "company_name",
            "mobile",
            "email",
            "status",
            "priority",
            "inquiry_type",
            "created_at",
        ]
        writer.writerow(header)
        for r in rows:
            writer.writerow(
                [
                    r["id"],
                    r["inquiry_number"],
                    r["customer_name"],
                    r["company_name"],
                    r["mobile"],
                    r["email"],
                    r["status"],
                    r["priority"],
                    r["inquiry_type"],
                    r["created_at"].isoformat() if r["created_at"] else "",
                ]
            )
        resp = HttpResponse(buf.getvalue(), content_type="text/csv")
        resp["Content-Disposition"] = 'attachment; filename="inquiries.csv"'
        return resp

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        by_status = list(
            Inquiry.objects.values("status").annotate(count=Count("id")).order_by("status")
        )
        by_source = list(
            Inquiry.objects.values("source__name")
            .annotate(count=Count("id"))
            .order_by("source__name")
        )
        return Response({"by_status": by_status, "by_source": by_source})

    @action(detail=False, methods=["get"], url_path="find-duplicates")
    def find_duplicates(self, request):
        return Response(
            {
                "matches": services.find_duplicate_inquiries(
                    mobile=request.query_params.get("mobile", ""),
                    email=request.query_params.get("email", ""),
                    project_name=request.query_params.get("project_name", ""),
                )
            }
        )


class InquiryFollowUpViewSet(viewsets.ModelViewSet):
    """Standalone CRUD for `/inquiries/follow-ups/:id`."""

    queryset = InquiryFollowUp.objects.all()
    serializer_class = InquiryFollowUpSerializer
    http_method_names = ("get", "patch", "delete", "head", "options")

    def perform_update(self, serializer):
        serializer.save(
            updated_by=self.request.user if self.request.user.is_authenticated else None
        )
        services.log_activity(
            serializer.instance.inquiry,
            action_type="follow_up_updated",
            user=self.request.user,
            new_value=serializer.instance.status,
        )


class InquiryItemViewSet(viewsets.ModelViewSet):
    """Standalone CRUD for `/inquiries/items/:id`."""

    queryset = InquiryLineItem.objects.all()
    serializer_class = InquiryLineItemSerializer
    http_method_names = ("get", "patch", "delete", "head", "options")

    def perform_update(self, serializer):
        serializer.save(
            updated_by=self.request.user if self.request.user.is_authenticated else None
        )
        services.log_activity(
            serializer.instance.inquiry,
            action_type="line_item_updated",
            user=self.request.user,
            new_value=str(serializer.instance.id),
        )

    def perform_destroy(self, instance):
        inquiry = instance.inquiry
        super().perform_destroy(instance)
        services.log_activity(
            inquiry, action_type="line_item_deleted", user=self.request.user
        )
