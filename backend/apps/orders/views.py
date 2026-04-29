"""Sales order API views (Step 07a — list/detail)."""
from __future__ import annotations

from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.views import AuditModelViewSet
from apps.quotations.services import next_order_number

from .models import SalesOrder
from .serializers import (
    SalesOrderItemSerializer,
    SalesOrderListSerializer,
    SalesOrderSerializer,
)


class SalesOrderViewSet(AuditModelViewSet):
    queryset = SalesOrder.objects.select_related(
        "quotation",
        "customer",
        "contact",
        "billing_address",
        "shipping_address",
        "confirmed_by",
        "assigned_sales_exec",
    ).prefetch_related("items")
    filterset_fields = (
        "status",
        "customer",
        "quotation",
        "assigned_sales_exec",
        "order_number",
    )
    search_fields = (
        "order_number",
        "project_name",
        "customer__company_name",
        "customer__contact_person_name",
    )
    ordering_fields = ("order_date", "grand_total", "status", "created_at")
    ordering = ("-order_date", "-created_at")

    def get_serializer_class(self):
        if self.action == "list":
            return SalesOrderListSerializer
        return SalesOrderSerializer

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        kwargs = {"order_number": next_order_number()}
        if hasattr(serializer.Meta.model, "created_by_id"):
            kwargs.update({"created_by": user, "updated_by": user})
        serializer.save(**kwargs)

    @action(detail=True, methods=["get"], url_path="items")
    def items(self, request, pk=None):
        order = self.get_object()
        ser = SalesOrderItemSerializer(order.items.all(), many=True)
        return Response(ser.data)
