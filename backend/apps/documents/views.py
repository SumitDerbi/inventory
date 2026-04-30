"""Customer invoice API views (Module 7 slice)."""
from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.views import AuditModelViewSet
from apps.orders.models import SalesOrder

from . import services
from .models import Invoice, InvoiceItem
from .serializers import (
    InvoiceItemSerializer,
    InvoiceListSerializer,
    InvoiceSerializer,
    InvoiceStatusTransitionSerializer,
)


def _bulk_status(results: list[dict]) -> int:
    if not results:
        return status.HTTP_200_OK
    has_err = any(r.get("status") == "error" for r in results)
    has_ok = any(r.get("status") == "ok" for r in results)
    if has_err and has_ok:
        return status.HTTP_207_MULTI_STATUS
    if has_err:
        return status.HTTP_400_BAD_REQUEST
    return status.HTTP_200_OK


class InvoiceViewSet(AuditModelViewSet):
    queryset = Invoice.objects.select_related(
        "order", "customer", "challan"
    ).prefetch_related("items")
    filterset_fields = ("status", "customer", "order", "invoice_type", "is_gst_invoice")
    search_fields = ("invoice_number", "customer__company_name", "notes")
    ordering_fields = ("invoice_date", "grand_total", "status", "created_at")
    ordering = ("-invoice_date", "-created_at")

    def get_serializer_class(self):
        if self.action == "list":
            return InvoiceListSerializer
        return InvoiceSerializer

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        kwargs = {"invoice_number": services.next_invoice_number()}
        if hasattr(serializer.Meta.model, "created_by_id"):
            kwargs.update({"created_by": user, "updated_by": user})
        serializer.save(**kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != Invoice.Status.DRAFT:
            return Response(
                {"status": f"Cannot edit invoice in '{instance.status}' state."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def perform_destroy(self, instance):
        if instance.status != Invoice.Status.DRAFT:
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {"status": f"Cannot delete invoice in '{instance.status}' state."}
            )
        super().perform_destroy(instance)

    # ------------------------------------------------------------------
    # Items sub-collection
    # ------------------------------------------------------------------
    @action(detail=True, methods=["get", "post"], url_path="items")
    def items(self, request, pk=None):
        invoice = self.get_object()
        if request.method == "GET":
            return Response(
                InvoiceItemSerializer(invoice.items.all(), many=True).data
            )
        if invoice.status != Invoice.Status.DRAFT:
            return Response(
                {"status": "Cannot edit items on a non-draft invoice."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ser = InvoiceItemSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        item = InvoiceItem(invoice=invoice, **ser.validated_data)
        _, item.tax_amount, item.line_total = services.compute_item_totals(item)
        if hasattr(InvoiceItem, "created_by_id"):
            item.created_by = user
            item.updated_by = user
        item.save()
        services.recompute_totals(invoice, user=user)
        item.refresh_from_db()
        return Response(
            InvoiceItemSerializer(item).data, status=status.HTTP_201_CREATED
        )

    # ------------------------------------------------------------------
    # Status transitions
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="finalise")
    def finalise(self, request, pk=None):
        invoice = self.get_object()
        user = request.user if request.user.is_authenticated else None
        services.transition_status(
            invoice, next_status=Invoice.Status.ISSUED, user=user
        )
        return Response(InvoiceSerializer(invoice).data)

    # Alias matching orders-plan §"customer invoices" /send endpoint.
    @action(detail=True, methods=["post"], url_path="send")
    def send_invoice(self, request, pk=None):
        return self.finalise(request, pk=pk)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        reason = (request.data.get("reason") or "").strip()
        user = request.user if request.user.is_authenticated else None
        services.transition_status(
            invoice,
            next_status=Invoice.Status.CANCELLED,
            reason=reason,
            user=user,
        )
        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=["post"], url_path="status")
    def status_transition(self, request, pk=None):
        invoice = self.get_object()
        ser = InvoiceStatusTransitionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        services.transition_status(
            invoice,
            next_status=ser.validated_data["next_status"],
            reason=ser.validated_data.get("reason", ""),
            user=user,
        )
        return Response(InvoiceSerializer(invoice).data)

    # ------------------------------------------------------------------
    # Aging report
    # ------------------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="aging")
    def aging(self, request):
        return Response(services.aging_buckets())

    # ------------------------------------------------------------------
    # Bulk operations
    # ------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="bulk-export")
    def bulk_export(self, request):
        ids = request.data.get("ids") or []
        results = services.bulk_export(ids)
        return Response({"results": results}, status=_bulk_status(results))

    @action(detail=False, methods=["post"], url_path="bulk-send")
    def bulk_send(self, request):
        ids = request.data.get("ids") or []
        user = request.user if request.user.is_authenticated else None
        results = services.bulk_send(ids, user=user)
        return Response({"results": results}, status=_bulk_status(results))


class InvoiceItemViewSet(AuditModelViewSet):
    """PATCH/DELETE /api/v1/customer-invoices/items/:id/."""

    queryset = InvoiceItem.objects.select_related("invoice").all()
    serializer_class = InvoiceItemSerializer
    http_method_names = ("get", "patch", "delete", "head", "options")

    def _guard_draft(self, item: InvoiceItem):
        if item.invoice.status != Invoice.Status.DRAFT:
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {"status": "Cannot edit items on a non-draft invoice."}
            )

    def perform_update(self, serializer):
        self._guard_draft(serializer.instance)
        super().perform_update(serializer)
        item = serializer.instance
        item.refresh_from_db()
        taxable, tax_amount, line_total = services.compute_item_totals(item)
        item.tax_amount = tax_amount
        item.line_total = line_total
        item.save(update_fields=["tax_amount", "line_total", "updated_at"])
        user = self.request.user if self.request.user.is_authenticated else None
        services.recompute_totals(item.invoice, user=user)

    def perform_destroy(self, instance):
        self._guard_draft(instance)
        invoice = instance.invoice
        user = self.request.user if self.request.user.is_authenticated else None
        super().perform_destroy(instance)
        services.recompute_totals(invoice, user=user)


class OrderInvoicesViewSet(AuditModelViewSet):
    """Nested helper: /api/v1/orders/:order_pk/customer-invoices/.

    GET → list invoices for the order.
    POST → create a draft invoice from the order's items (inherited).
    """

    serializer_class = InvoiceSerializer
    http_method_names = ("get", "post", "head", "options")

    def get_queryset(self):
        order_pk = self.kwargs.get("order_pk")
        return (
            Invoice.objects.filter(order_id=order_pk)
            .select_related("customer", "order")
            .prefetch_related("items")
            .order_by("-invoice_date", "-created_at")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return InvoiceListSerializer
        return InvoiceSerializer

    def create(self, request, *args, **kwargs):
        order_pk = self.kwargs.get("order_pk")
        try:
            order = SalesOrder.objects.get(pk=order_pk)
        except SalesOrder.DoesNotExist:
            return Response(
                {"order": "Not found."}, status=status.HTTP_404_NOT_FOUND
            )
        invoice_type = (
            request.data.get("invoice_type") or Invoice.InvoiceType.TAX
        )
        user = request.user if request.user.is_authenticated else None
        invoice = services.create_from_order(
            order, invoice_type=invoice_type, user=user
        )
        return Response(
            InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED
        )
