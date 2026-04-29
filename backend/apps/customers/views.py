"""Customer + Contact + Address API."""
from __future__ import annotations

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.views import AuditModelViewSet

from . import services
from .models import Address, Contact, Customer
from .serializers import (
    AddressSerializer,
    ContactSerializer,
    CustomerListSerializer,
    CustomerSearchResultSerializer,
    CustomerSerializer,
    MergePreviewRequestSerializer,
    MergeRequestSerializer,
)


class CustomerViewSet(AuditModelViewSet):
    queryset = Customer.objects.select_related("assigned_sales_exec").all()
    filterset_fields = (
        "customer_type",
        "status",
        "city",
        "state",
        "territory",
        "assigned_sales_exec",
    )
    search_fields = (
        "company_name",
        "contact_person_name",
        "mobile",
        "alternate_mobile",
        "email",
        "gst_number",
        "pan_number",
        "city",
    )
    ordering_fields = ("company_name", "created_at", "updated_at")
    ordering = ("-created_at",)

    def get_serializer_class(self):
        if self.action == "list":
            return CustomerListSerializer
        return CustomerSerializer

    # ------------------------------------------------------------------
    # Dedupe / search
    # ------------------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="search")
    def search_lookup(self, request):
        q = (request.query_params.get("q") or "").strip()
        if not q:
            return Response({"results": []})
        # Combined search across mobile / email / GST / company name.
        qs = (
            Customer.objects.filter(company_name__icontains=q)
            | Customer.objects.filter(mobile__iexact=q)
            | Customer.objects.filter(alternate_mobile__iexact=q)
            | Customer.objects.filter(email__iexact=q)
            | Customer.objects.filter(gst_number__iexact=q)
        ).distinct()[:25]
        return Response(
            {"results": CustomerListSerializer(qs, many=True).data}
        )

    @action(detail=False, methods=["get"], url_path="find-duplicates")
    def find_duplicates(self, request):
        mobile = (request.query_params.get("mobile") or "").strip()
        email = (request.query_params.get("email") or "").strip()
        gst = (request.query_params.get("gst") or "").strip()
        exclude_id_raw = request.query_params.get("exclude_id")
        exclude_id = int(exclude_id_raw) if exclude_id_raw else None
        matches = services.find_matches(
            mobile=mobile, email=email, gst=gst, exclude_id=exclude_id
        )
        return Response({"matches": matches})

    # ------------------------------------------------------------------
    # Create with dedupe hint
    # ------------------------------------------------------------------
    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        self.perform_create(ser)
        instance = ser.instance
        matches = services.find_matches(
            mobile=instance.mobile,
            email=instance.email,
            gst=instance.gst_number,
            exclude_id=instance.id,
        )
        data = ser.data
        if matches:
            data = {**data, "matches": matches}
        return Response(data, status=status.HTTP_201_CREATED)

    # ------------------------------------------------------------------
    # Nested customer tabs
    # ------------------------------------------------------------------
    @action(detail=True, methods=["get"], url_path="contacts")
    def list_contacts(self, request, pk=None):
        qs = Contact.objects.filter(customer_id=pk)
        return Response(ContactSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"], url_path="addresses")
    def list_addresses(self, request, pk=None):
        qs = Address.objects.filter(customer_id=pk)
        return Response(AddressSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"], url_path="quotations")
    def list_quotations(self, request, pk=None):
        from apps.quotations.models import Quotation  # local import to avoid cycles

        rows = Quotation.objects.filter(customer_id=pk).values(
            "id", "quotation_number", "status", "total_amount", "created_at"
        )
        return Response(list(rows))

    @action(detail=True, methods=["get"], url_path="orders")
    def list_orders(self, request, pk=None):
        from apps.orders.models import SalesOrder

        rows = SalesOrder.objects.filter(customer_id=pk).values(
            "id", "order_number", "status", "total_amount", "created_at"
        )
        return Response(list(rows))

    @action(detail=True, methods=["get"], url_path="documents")
    def list_documents(self, request, pk=None):
        from apps.documents.models import Document

        rows = Document.objects.filter(customer_id=pk).values(
            "id", "title", "category_id", "created_at"
        )
        return Response(list(rows))

    @action(detail=True, methods=["get"], url_path="activity")
    def activity(self, request, pk=None):
        """Cross-module timeline — newest first, capped to 100 entries."""
        from apps.inquiries.models import Inquiry
        from apps.orders.models import SalesOrder
        from apps.quotations.models import Quotation

        events: list[dict] = []
        for q in Quotation.objects.filter(customer_id=pk).only(
            "id", "quotation_number", "created_at"
        )[:50]:
            events.append(
                {
                    "kind": "quotation",
                    "entity_id": q.id,
                    "label": f"Quotation {q.quotation_number}",
                    "occurred_at": q.created_at,
                }
            )
        for o in SalesOrder.objects.filter(customer_id=pk).only(
            "id", "order_number", "created_at"
        )[:50]:
            events.append(
                {
                    "kind": "order",
                    "entity_id": o.id,
                    "label": f"Order {o.order_number}",
                    "occurred_at": o.created_at,
                }
            )
        for i in Inquiry.objects.filter(customer_id=pk).only(
            "id", "inquiry_number", "created_at"
        )[:50]:
            events.append(
                {
                    "kind": "inquiry",
                    "entity_id": i.id,
                    "label": f"Inquiry {i.inquiry_number}",
                    "occurred_at": i.created_at,
                }
            )
        events.sort(key=lambda e: e["occurred_at"], reverse=True)
        return Response(events[:100])

    # ------------------------------------------------------------------
    # Merge
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="merge-preview")
    def merge_preview(self, request, pk=None):
        ser = MergePreviewRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            preview = services.merge_preview(int(pk), ser.validated_data["target_id"])
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found."}, status=404)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        return Response(
            {
                "source_id": preview.source_id,
                "target_id": preview.target_id,
                "conflicts": preview.conflicts,
                "impact_counts": preview.impact_counts,
                "preview_hash": preview.preview_hash,
            }
        )

    @action(detail=True, methods=["post"], url_path="merge")
    def merge(self, request, pk=None):
        ser = MergeRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                result = services.perform_merge(
                    source_id=int(pk),
                    target_id=ser.validated_data["target_id"],
                    preview_hash=ser.validated_data["preview_hash"],
                    field_choices=ser.validated_data.get("field_choices") or {},
                    actor=request.user,
                )
        except Customer.DoesNotExist:
            return Response({"detail": "Customer not found."}, status=404)
        except ValueError as e:
            msg = str(e)
            if msg in ("HASH_MISMATCH", "CHAINED_MERGE"):
                return Response({"detail": msg}, status=409)
            return Response({"detail": msg}, status=400)
        return Response(result)


class ContactViewSet(AuditModelViewSet):
    queryset = Contact.objects.select_related("customer").all()
    serializer_class = ContactSerializer
    filterset_fields = ("customer", "is_primary")
    search_fields = ("name", "mobile", "email")


class AddressViewSet(AuditModelViewSet):
    queryset = Address.objects.select_related("customer").all()
    serializer_class = AddressSerializer
    filterset_fields = ("customer", "address_type", "is_default")
    search_fields = ("city", "state", "pincode", "label")
