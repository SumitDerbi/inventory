"""Core masters: TaxRule, Attachment serializers."""
from __future__ import annotations

import os

from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import serializers

from .masters import Attachment, TaxRule


ALLOWED_MIME_PREFIXES = (
    "image/",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-excel",
    "text/plain",
    "text/csv",
)
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB
ATTACHMENT_ENTITY_WHITELIST = {
    "inquiry",
    "quotation",
    "order",
    "sales_order",
    "purchase_order",
    "dispatch",
    "challan",
    "job",
    "installation_job",
    "document",
    "invoice",
    "customer",
    "product",
    "user",
}


class TaxRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxRule
        fields = (
            "id",
            "name",
            "tax_type",
            "rate_percent",
            "applicable_to",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class AttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = (
            "id",
            "entity_type",
            "entity_id",
            "file_name",
            "file_path",
            "file_url",
            "file_size_kb",
            "mime_type",
            "version",
            "is_latest",
            "uploaded_by",
            "notes",
            "created_at",
        )
        read_only_fields = (
            "file_path",
            "file_url",
            "file_size_kb",
            "mime_type",
            "version",
            "is_latest",
            "uploaded_by",
            "created_at",
        )

    def get_file_url(self, obj: Attachment) -> str:
        if not obj.file_path:
            return ""
        media_url = settings.MEDIA_URL.rstrip("/")
        return f"{media_url}/{obj.file_path.lstrip('/')}"


class AttachmentUploadSerializer(serializers.Serializer):
    entity_type = serializers.CharField(max_length=50)
    entity_id = serializers.IntegerField()
    file = serializers.FileField()
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_entity_type(self, value: str) -> str:
        if value not in ATTACHMENT_ENTITY_WHITELIST:
            raise serializers.ValidationError("Unsupported entity_type.")
        return value

    def validate_file(self, value):
        size = getattr(value, "size", 0)
        if size > MAX_UPLOAD_BYTES:
            raise serializers.ValidationError("File exceeds 25 MB limit.")
        mime = getattr(value, "content_type", "") or ""
        if not any(mime.startswith(p) for p in ALLOWED_MIME_PREFIXES):
            raise serializers.ValidationError(f"Mime type '{mime}' is not allowed.")
        return value
