"""Sales order serializers (Step 07a — list/detail only)."""
from __future__ import annotations

from rest_framework import serializers

from .models import (
    InstallationRequirement,
    MaterialChecklist,
    OrderMilestone,
    SalesOrder,
    SalesOrderItem,
)


class SalesOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesOrderItem
        fields = (
            "id",
            "order",
            "product",
            "product_description",
            "quantity_ordered",
            "quantity_dispatched",
            "quantity_pending",
            "unit",
            "unit_price",
            "discount_percent",
            "tax_rule",
            "line_total",
            "status",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "order")


class OrderMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderMilestone
        fields = (
            "id",
            "order",
            "milestone_name",
            "target_date",
            "completed_at",
            "status",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "order")


class MaterialChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialChecklist
        fields = (
            "id",
            "order",
            "order_item",
            "product",
            "description",
            "required_qty",
            "available_qty",
            "shortage_qty",
            "status",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "order")


class InstallationRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstallationRequirement
        fields = (
            "id",
            "order",
            "site_address",
            "site_contact_name",
            "site_contact_mobile",
            "civil_readiness",
            "electrical_readiness",
            "expected_install_date",
            "special_site_requirements",
            "access_instructions",
            "permissions_required",
            "permission_details",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "order")


class SalesOrderSerializer(serializers.ModelSerializer):
    """Full detail serializer (read + write).

    Items are read-only on the order payload; mutate via the dedicated
    items endpoint when those routes are added in 7b.
    """

    items = SalesOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = SalesOrder
        fields = (
            "id",
            "order_number",
            "quotation",
            "customer",
            "contact",
            "billing_address",
            "shipping_address",
            "project_name",
            "status",
            "order_date",
            "expected_delivery_date",
            "confirmed_at",
            "confirmed_by",
            "assigned_sales_exec",
            "payment_terms",
            "delivery_terms",
            "special_instructions",
            "subtotal",
            "total_discount",
            "total_tax",
            "freight_amount",
            "grand_total",
            "cancellation_reason",
            "notes",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "order_number",
            "confirmed_at",
            "confirmed_by",
            "subtotal",
            "total_discount",
            "total_tax",
            "grand_total",
            "created_at",
            "updated_at",
        )


class SalesOrderListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer with denormalised customer fields."""

    customer_name = serializers.CharField(
        source="customer.contact_person_name", read_only=True, default=""
    )
    company_name = serializers.CharField(
        source="customer.company_name", read_only=True, default=""
    )

    class Meta:
        model = SalesOrder
        fields = (
            "id",
            "order_number",
            "quotation",
            "customer",
            "customer_name",
            "company_name",
            "project_name",
            "status",
            "order_date",
            "expected_delivery_date",
            "grand_total",
            "assigned_sales_exec",
            "created_at",
        )
