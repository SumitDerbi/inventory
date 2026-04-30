"""Sales order API views (Step 07a)."""
from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.views import AuditModelViewSet
from apps.quotations.services import next_order_number

from . import services
from .models import (
    InstallationRequirement,
    MaterialChecklist,
    OrderMilestone,
    SalesOrder,
    SalesOrderItem,
)
from .serializers import (
    InstallationRequirementSerializer,
    MaterialChecklistSerializer,
    OrderMilestoneSerializer,
    SalesOrderItemSerializer,
    SalesOrderListSerializer,
    SalesOrderSerializer,
    StageTransitionSerializer,
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

    # ------------------------------------------------------------------
    # Items sub-collection
    # ------------------------------------------------------------------
    @action(detail=True, methods=["get", "post"], url_path="items")
    def items(self, request, pk=None):
        order = self.get_object()
        if request.method == "GET":
            return Response(
                SalesOrderItemSerializer(order.items.all(), many=True).data
            )
        ser = SalesOrderItemSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        preview = SalesOrderItem(
            quantity_ordered=ser.validated_data.get("quantity_ordered", 0),
            unit_price=ser.validated_data.get("unit_price", 0),
            discount_percent=ser.validated_data.get("discount_percent", 0),
            tax_rule=ser.validated_data.get("tax_rule"),
        )
        line_total, *_ = services.compute_item_line_total(preview)
        save_kwargs = {"order": order, "line_total": line_total}
        if hasattr(SalesOrderItem, "created_by_id"):
            save_kwargs.update({"created_by": user, "updated_by": user})
        obj = ser.save(**save_kwargs)
        services.recompute_totals(order, user=user)
        obj.refresh_from_db()
        return Response(
            SalesOrderItemSerializer(obj).data, status=status.HTTP_201_CREATED
        )

    # ------------------------------------------------------------------
    # Stage transition
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="stage")
    def stage(self, request, pk=None):
        order = self.get_object()
        ser = StageTransitionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        services.transition_stage(
            order,
            next_stage=ser.validated_data["next_stage"],
            user=user,
            cancellation_reason=ser.validated_data.get("cancellation_reason", ""),
        )
        return Response(SalesOrderSerializer(order).data)


    # ------------------------------------------------------------------
    # Milestones
    # ------------------------------------------------------------------
    @action(detail=True, methods=["get", "post"], url_path="milestones")
    def milestones(self, request, pk=None):
        order = self.get_object()
        if request.method == "GET":
            return Response(
                OrderMilestoneSerializer(order.milestones.all(), many=True).data
            )
        ser = OrderMilestoneSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        save_kwargs = {"order": order}
        if hasattr(OrderMilestone, "created_by_id"):
            save_kwargs.update({"created_by": user, "updated_by": user})
        obj = ser.save(**save_kwargs)
        return Response(
            OrderMilestoneSerializer(obj).data, status=status.HTTP_201_CREATED
        )

    # ------------------------------------------------------------------
    # Material checklist
    # ------------------------------------------------------------------
    @action(detail=True, methods=["get", "post"], url_path="material-checklist")
    def material_checklist(self, request, pk=None):
        order = self.get_object()
        if request.method == "GET":
            return Response(
                MaterialChecklistSerializer(
                    order.material_checklists.all(), many=True
                ).data
            )
        ser = MaterialChecklistSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        save_kwargs = {"order": order}
        if hasattr(MaterialChecklist, "created_by_id"):
            save_kwargs.update({"created_by": user, "updated_by": user})
        obj = ser.save(**save_kwargs)
        return Response(
            MaterialChecklistSerializer(obj).data, status=status.HTTP_201_CREATED
        )

    # ------------------------------------------------------------------
    # Installation requirement (1:1)
    # ------------------------------------------------------------------
    @action(
        detail=True,
        methods=["get", "put", "patch"],
        url_path="installation-requirement",
    )
    def installation_requirement(self, request, pk=None):
        order = self.get_object()
        existing = getattr(order, "installation_requirement", None)
        if request.method == "GET":
            if existing is None:
                return Response(None)
            return Response(InstallationRequirementSerializer(existing).data)
        user = request.user if request.user.is_authenticated else None
        partial = request.method == "PATCH"
        ser = InstallationRequirementSerializer(
            existing, data=request.data, partial=partial
        )
        ser.is_valid(raise_exception=True)
        save_kwargs = {"order": order}
        if hasattr(InstallationRequirement, "created_by_id"):
            if existing is None:
                save_kwargs.update({"created_by": user, "updated_by": user})
            else:
                save_kwargs.update({"updated_by": user})
        obj = ser.save(**save_kwargs)
        out_status = (
            status.HTTP_201_CREATED if existing is None else status.HTTP_200_OK
        )
        return Response(InstallationRequirementSerializer(obj).data, status=out_status)


class SalesOrderItemViewSet(viewsets.ModelViewSet):
    """Standalone CRUD for `/orders/items/:id` with auto-recompute."""

    queryset = SalesOrderItem.objects.select_related("order", "tax_rule")
    serializer_class = SalesOrderItemSerializer
    http_method_names = ("get", "patch", "delete", "head", "options")

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if hasattr(SalesOrderItem, "updated_by_id"):
            instance = serializer.save(updated_by=user)
        else:
            instance = serializer.save()
        line_total, *_ = services.compute_item_line_total(instance)
        if instance.line_total != line_total:
            instance.line_total = line_total
            instance.save(update_fields=["line_total", "updated_at"])
        services.recompute_totals(instance.order, user=user)

    def perform_destroy(self, instance):
        user = self.request.user if self.request.user.is_authenticated else None
        order = instance.order
        super().perform_destroy(instance)
        services.recompute_totals(order, user=user)
