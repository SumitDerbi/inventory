"""Customer invoice serializers (Module 7 slice)."""
from __future__ import annotations

from rest_framework import serializers

from .models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = (
            "id",
            "invoice",
            "product",
            "description",
            "hsn_code",
            "quantity",
            "unit",
            "unit_price",
            "discount_amount",
            "tax_percent",
            "tax_amount",
            "line_total",
        )
        read_only_fields = ("invoice", "tax_amount", "line_total")


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "invoice_number",
            "order",
            "challan",
            "customer",
            "invoice_date",
            "invoice_type",
            "subtotal",
            "tax_amount",
            "grand_total",
            "is_gst_invoice",
            "place_of_supply",
            "file_path",
            "status",
            "notes",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "invoice_number",
            "subtotal",
            "tax_amount",
            "grand_total",
            "status",
            "created_at",
            "updated_at",
        )


class InvoiceListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.company_name", read_only=True
    )
    order_number = serializers.CharField(
        source="order.order_number", read_only=True
    )

    class Meta:
        model = Invoice
        fields = (
            "id",
            "invoice_number",
            "order",
            "order_number",
            "customer",
            "customer_name",
            "invoice_date",
            "invoice_type",
            "subtotal",
            "tax_amount",
            "grand_total",
            "status",
        )


class InvoiceStatusTransitionSerializer(serializers.Serializer):
    next_status = serializers.ChoiceField(choices=Invoice.Status.choices)
    reason = serializers.CharField(allow_blank=True, required=False, default="")
