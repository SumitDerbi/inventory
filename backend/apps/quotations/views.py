"""Quotation API views (Step 06a)."""
from __future__ import annotations

from datetime import timedelta

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.views import AuditModelViewSet

from . import services
from .models import (
    Quotation,
    QuotationCommunicationLog,
    QuotationItem,
)
from .serializers import (
    ApproveSerializer,
    QuotationActivityLogSerializer,
    QuotationApprovalStepSerializer,
    QuotationCommunicationLogSerializer,
    QuotationItemSerializer,
    QuotationListSerializer,
    QuotationSerializer,
    RejectSerializer,
    SendSerializer,
)


class QuotationViewSet(AuditModelViewSet):
    queryset = Quotation.objects.select_related(
        "inquiry", "customer", "contact", "prepared_by", "approved_by"
    ).prefetch_related("items")
    filterset_fields = ("status", "customer", "inquiry", "prepared_by", "approved_by")
    search_fields = ("quotation_number", "project_name", "customer__company_name", "customer__contact_person_name")
    ordering_fields = ("quotation_date", "grand_total", "status", "created_at")
    ordering = ("-quotation_date", "-version_number")

    def get_serializer_class(self):
        if self.action == "list":
            return QuotationListSerializer
        return QuotationSerializer

    # ---------------- create / update ---------------------------------
    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        today = timezone.now().date()
        quotation = ser.save(
            quotation_number=services.next_quotation_number(),
            version_number=1,
            status=Quotation.Status.DRAFT,
            prepared_by=user,
            quotation_date=ser.validated_data.get("quotation_date") or today,
            valid_until=ser.validated_data.get("valid_until") or (today + timedelta(days=30)),
            created_by=user,
            updated_by=user,
        )
        services.log_activity(quotation, action_type="created", user=user)
        out = self.get_serializer(quotation).data
        return Response(out, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status in services.LOCKED_STATUSES and instance.status != Quotation.Status.APPROVED:
            user = request.user
            is_admin = bool(user.is_authenticated and user.is_superuser)
            if not is_admin:
                # auto-spawn a new version
                new = services.new_version(instance, user=user)
                ser = self.get_serializer(new, data=request.data, partial=True)
                ser.is_valid(raise_exception=True)
                ser.save(updated_by=user if user.is_authenticated else None)
                services.recompute(new, user=user)
                services.log_activity(new, action_type="updated", user=user)
                return Response(self.get_serializer(new).data)
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        instance = serializer.save(updated_by=user)
        services.recompute(instance, user=user)
        services.log_activity(instance, action_type="updated", user=user)

    # ---------------- single-quotation actions ------------------------
    @action(detail=True, methods=["post"], url_path="submit-approval")
    def submit_approval(self, request, pk=None):
        q = self.get_object()
        try:
            services.submit_for_approval(q, user=request.user)
        except services.StatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        return Response(self.get_serializer(q).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        ser = ApproveSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        q = self.get_object()
        try:
            services.approve(q, user=request.user, comments=ser.validated_data.get("comments", ""))
        except services.StatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        return Response(self.get_serializer(q).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        ser = RejectSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        q = self.get_object()
        try:
            services.reject(q, user=request.user, comments=ser.validated_data["comments"])
        except services.StatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        return Response(self.get_serializer(q).data)

    @action(detail=True, methods=["post"], url_path="send")
    def send(self, request, pk=None):
        ser = SendSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        q = self.get_object()
        try:
            log = services.send_quotation(
                q,
                user=request.user,
                channel=ser.validated_data["channel"],
                to_address=ser.validated_data["to_address"],
                subject=ser.validated_data.get("subject", ""),
                body=ser.validated_data.get("body", ""),
            )
        except services.StatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        return Response(QuotationCommunicationLogSerializer(log).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="clone")
    def clone(self, request, pk=None):
        q = self.get_object()
        new = services.clone_quotation(q, user=request.user)
        return Response(self.get_serializer(new).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="convert-to-order")
    def convert_to_order(self, request, pk=None):
        q = self.get_object()
        try:
            order = services.convert_to_order(q, user=request.user)
        except services.ConversionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        return Response(
            {
                "order_id": order.id,
                "order_number": order.order_number,
                "quotation_id": q.id,
                "quotation_status": q.status,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="versions")
    def new_version(self, request, pk=None):
        q = self.get_object()
        new = services.new_version(q, user=request.user)
        return Response(self.get_serializer(new).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="activity")
    def activity(self, request, pk=None):
        q = self.get_object()
        rows = q.activity_logs.all()
        return Response(QuotationActivityLogSerializer(rows, many=True).data)

    @action(detail=True, methods=["get"], url_path="communications")
    def communications(self, request, pk=None):
        q = self.get_object()
        rows = q.communications.all()
        return Response(QuotationCommunicationLogSerializer(rows, many=True).data)

    @action(detail=True, methods=["get"], url_path="approval-steps")
    def approval_steps(self, request, pk=None):
        q = self.get_object()
        rows = q.approval_steps.all()
        return Response(QuotationApprovalStepSerializer(rows, many=True).data)

    @action(detail=True, methods=["get", "post"], url_path="items")
    def items(self, request, pk=None):
        q = self.get_object()
        if request.method == "GET":
            return Response(QuotationItemSerializer(q.items.all(), many=True).data)
        ser = QuotationItemSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        obj = ser.save(quotation=q, line_total=0, created_by=user, updated_by=user)
        services.recompute(q, user=user)
        services.log_activity(q, action_type="line_item_added", user=user, new_value=str(obj.id))
        obj.refresh_from_db()
        return Response(QuotationItemSerializer(obj).data, status=status.HTTP_201_CREATED)


class QuotationItemViewSet(viewsets.ModelViewSet):
    """Standalone CRUD for `/quotations/items/:id`."""

    queryset = QuotationItem.objects.all()
    serializer_class = QuotationItemSerializer
    http_method_names = ("get", "patch", "delete", "head", "options")

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        instance = serializer.save(updated_by=user)
        services.recompute(instance.quotation, user=user)
        services.log_activity(instance.quotation, action_type="line_item_updated", user=user, new_value=str(instance.id))

    def perform_destroy(self, instance):
        user = self.request.user if self.request.user.is_authenticated else None
        quotation = instance.quotation
        super().perform_destroy(instance)
        services.recompute(quotation, user=user)
        services.log_activity(quotation, action_type="line_item_deleted", user=user)
