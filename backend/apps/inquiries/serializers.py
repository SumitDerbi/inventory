"""Inquiry serializers (Step 05a)."""
from __future__ import annotations

from rest_framework import serializers

from .models import (
    Inquiry,
    InquiryActivityLog,
    InquiryFollowUp,
    InquiryLineItem,
    InquirySource,
)


class InquiryLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InquiryLineItem
        fields = (
            "id",
            "inquiry",
            "product",
            "product_description",
            "category",
            "specification_notes",
            "quantity",
            "unit",
            "estimated_value",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("inquiry", "created_at", "updated_at")


class InquiryFollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = InquiryFollowUp
        fields = (
            "id",
            "inquiry",
            "follow_up_type",
            "scheduled_at",
            "completed_at",
            "status",
            "outcome",
            "next_follow_up_date",
            "assigned_to",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("inquiry", "created_at", "updated_at")


class InquiryActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = InquiryActivityLog
        fields = (
            "id",
            "inquiry",
            "action_type",
            "old_value",
            "new_value",
            "remarks",
            "performed_by",
            "performed_at",
            "created_at",
        )
        read_only_fields = fields


class InquirySerializer(serializers.ModelSerializer):
    line_items = InquiryLineItemSerializer(many=True, read_only=True)

    class Meta:
        model = Inquiry
        fields = (
            "id",
            "inquiry_number",
            "source",
            "customer",
            "customer_name",
            "company_name",
            "mobile",
            "email",
            "city",
            "state",
            "project_name",
            "project_description",
            "product_category",
            "inquiry_type",
            "priority",
            "status",
            "assigned_to",
            "expected_order_date",
            "site_location",
            "budget_range",
            "source_reference",
            "lost_reason",
            "notes",
            "line_items",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "inquiry_number",
            "status",  # mutated through /status action only
            "created_at",
            "updated_at",
        )


class InquiryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = (
            "id",
            "inquiry_number",
            "source",
            "customer",
            "customer_name",
            "company_name",
            "mobile",
            "email",
            "project_name",
            "inquiry_type",
            "priority",
            "status",
            "assigned_to",
            "expected_order_date",
            "created_at",
        )


class AssignSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()


class StatusChangeSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Inquiry.Status.choices)
    lost_reason = serializers.CharField(required=False, allow_blank=True)


class BulkAssignSerializer(serializers.Serializer):
    inquiry_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1, max_length=200
    )
    user_id = serializers.IntegerField()


class BulkStatusSerializer(serializers.Serializer):
    inquiry_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1, max_length=200
    )
    status = serializers.ChoiceField(choices=Inquiry.Status.choices)
    lost_reason = serializers.CharField(required=False, allow_blank=True)


class BulkExportSerializer(serializers.Serializer):
    inquiry_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1, max_length=200
    )
    format = serializers.ChoiceField(choices=("csv", "xlsx", "pdf"), default="csv")


__all__ = [
    "InquirySerializer",
    "InquiryListSerializer",
    "InquiryLineItemSerializer",
    "InquiryFollowUpSerializer",
    "InquiryActivityLogSerializer",
    "AssignSerializer",
    "StatusChangeSerializer",
    "BulkAssignSerializer",
    "BulkStatusSerializer",
    "BulkExportSerializer",
]
