"""Customer + Contact + Address serializers."""
from __future__ import annotations

import re

from rest_framework import serializers

from .models import Address, Contact, Customer


# Indian formats — relaxed but reasonable.
MOBILE_RE = re.compile(r"^[6-9]\d{9}$")
GST_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
PINCODE_RE = re.compile(r"^[1-9][0-9]{5}$")


def _validate_mobile(value: str) -> str:
    if value and not MOBILE_RE.match(value):
        raise serializers.ValidationError("Enter a valid 10-digit Indian mobile number.")
    return value


def _validate_gst(value: str) -> str:
    if value and not GST_RE.match(value):
        raise serializers.ValidationError("Enter a valid GSTIN.")
    return value


def _validate_pan(value: str) -> str:
    if value and not PAN_RE.match(value):
        raise serializers.ValidationError("Enter a valid PAN.")
    return value


def _validate_pincode(value: str) -> str:
    if value and not PINCODE_RE.match(value):
        raise serializers.ValidationError("Enter a valid 6-digit pincode.")
    return value


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = (
            "id",
            "customer",
            "name",
            "designation",
            "mobile",
            "email",
            "is_primary",
            "department",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def validate_mobile(self, value: str) -> str:
        return _validate_mobile(value)


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            "id",
            "customer",
            "address_type",
            "label",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "pincode",
            "contact_person",
            "contact_mobile",
            "is_default",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def validate_pincode(self, value: str) -> str:
        return _validate_pincode(value)

    def validate_contact_mobile(self, value: str) -> str:
        return _validate_mobile(value)


class CustomerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = (
            "id",
            "customer_type",
            "company_name",
            "contact_person_name",
            "mobile",
            "email",
            "city",
            "state",
            "status",
            "assigned_sales_exec",
            "created_at",
        )


class CustomerSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = (
            "id",
            "customer_type",
            "company_name",
            "contact_person_name",
            "mobile",
            "alternate_mobile",
            "email",
            "gst_number",
            "pan_number",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "pincode",
            "assigned_sales_exec",
            "territory",
            "credit_limit",
            "credit_days",
            "status",
            "notes",
            "contacts",
            "addresses",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def validate_mobile(self, value: str) -> str:
        return _validate_mobile(value)

    def validate_alternate_mobile(self, value: str) -> str:
        return _validate_mobile(value) if value else value

    def validate_gst_number(self, value: str) -> str:
        return _validate_gst(value)

    def validate_pan_number(self, value: str) -> str:
        return _validate_pan(value)

    def validate_pincode(self, value: str) -> str:
        return _validate_pincode(value)


class CustomerSearchResultSerializer(serializers.ModelSerializer):
    """Compact dedupe result with reasons[] populated by the view."""

    match_reasons = serializers.ListField(child=serializers.CharField(), read_only=True)

    class Meta:
        model = Customer
        fields = (
            "id",
            "company_name",
            "mobile",
            "email",
            "gst_number",
            "city",
            "status",
            "match_reasons",
        )


class FieldChoiceMapSerializer(serializers.Serializer):
    """Free-form mapping `field -> "source"|"target"|"both"`."""


class MergePreviewRequestSerializer(serializers.Serializer):
    target_id = serializers.IntegerField()


class MergeRequestSerializer(serializers.Serializer):
    target_id = serializers.IntegerField()
    field_choices = serializers.DictField(child=serializers.CharField(), required=False)
    preview_hash = serializers.CharField(required=True)


# Light "summary" serializers for nested customer tabs (avoid circular imports;
# the full per-module serializers ship with each module slice).
class _SimpleSummary(serializers.Serializer):
    id = serializers.IntegerField()
    number = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, allow_blank=True)
    total = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    created_at = serializers.DateTimeField()


class CustomerActivityEntrySerializer(serializers.Serializer):
    kind = serializers.CharField()
    entity_id = serializers.IntegerField()
    label = serializers.CharField()
    occurred_at = serializers.DateTimeField()
