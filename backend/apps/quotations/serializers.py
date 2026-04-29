"""Quotation serializers (Step 06a)."""
from __future__ import annotations

from rest_framework import serializers

from .models import (
    Quotation,
    QuotationActivityLog,
    QuotationApprovalStep,
    QuotationCommunicationLog,
    QuotationItem,
)


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = (
            "id",
            "quotation",
            "product",
            "product_code",
            "product_description",
            "brand",
            "model_number",
            "specifications",
            "quantity",
            "unit",
            "unit_cost",
            "unit_price",
            "discount_percent",
            "discount_amount",
            "tax_rule",
            "tax_amount",
            "line_total",
            "sort_order",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "quotation",
            "tax_amount",
            "line_total",
            "discount_amount",
            "created_at",
            "updated_at",
        )


class QuotationActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationActivityLog
        fields = (
            "id",
            "quotation",
            "action_type",
            "old_value",
            "new_value",
            "remarks",
            "performed_by",
            "performed_at",
            "created_at",
        )
        read_only_fields = fields


class QuotationCommunicationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationCommunicationLog
        fields = (
            "id",
            "quotation",
            "channel",
            "to_address",
            "subject",
            "body",
            "sent_at",
            "sent_by",
            "created_at",
        )
        read_only_fields = fields


class QuotationApprovalStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationApprovalStep
        fields = (
            "id",
            "quotation",
            "step_order",
            "approver",
            "status",
            "action_at",
            "comments",
            "condition_type",
            "created_at",
        )
        read_only_fields = fields


class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True, read_only=True)

    class Meta:
        model = Quotation
        fields = (
            "id",
            "quotation_number",
            "version_number",
            "inquiry",
            "customer",
            "contact",
            "billing_address",
            "shipping_address",
            "site_address",
            "project_name",
            "quotation_date",
            "valid_until",
            "status",
            "prepared_by",
            "approved_by",
            "approved_at",
            "currency",
            "subtotal",
            "total_discount",
            "total_tax",
            "freight_amount",
            "other_charges",
            "grand_total",
            "gross_margin_percent",
            "payment_terms",
            "delivery_terms",
            "warranty_terms",
            "scope_of_supply",
            "exclusions",
            "notes",
            "pdf_path",
            "sent_at",
            "parent_quotation",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "quotation_number",
            "version_number",
            "status",
            "prepared_by",
            "approved_by",
            "approved_at",
            "subtotal",
            "total_discount",
            "total_tax",
            "grand_total",
            "gross_margin_percent",
            "pdf_path",
            "sent_at",
            "parent_quotation",
            "items",
            "created_at",
            "updated_at",
        )


class QuotationListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.contact_person_name", read_only=True, default="")
    company_name = serializers.CharField(source="customer.company_name", read_only=True, default="")

    class Meta:
        model = Quotation
        fields = (
            "id",
            "quotation_number",
            "version_number",
            "customer",
            "customer_name",
            "company_name",
            "project_name",
            "status",
            "quotation_date",
            "valid_until",
            "grand_total",
            "currency",
            "prepared_by",
            "created_at",
        )


# ----- request payloads -----------------------------------------------------
class SubmitApprovalSerializer(serializers.Serializer):
    pass


class ApproveSerializer(serializers.Serializer):
    comments = serializers.CharField(required=False, allow_blank=True)


class RejectSerializer(serializers.Serializer):
    comments = serializers.CharField()


class SendSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=("email", "whatsapp", "sms"), default="email")
    to_address = serializers.CharField()
    subject = serializers.CharField(required=False, allow_blank=True)
    body = serializers.CharField(required=False, allow_blank=True)


__all__ = [
    "QuotationSerializer",
    "QuotationListSerializer",
    "QuotationItemSerializer",
    "QuotationActivityLogSerializer",
    "QuotationCommunicationLogSerializer",
    "QuotationApprovalStepSerializer",
    "SubmitApprovalSerializer",
    "ApproveSerializer",
    "RejectSerializer",
    "SendSerializer",
]
