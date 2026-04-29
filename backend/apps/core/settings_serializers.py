"""Step 04b: Settings & Admin Config serializers (admin-only resources)."""
from __future__ import annotations

import re

from rest_framework import serializers

from .masters import (
    CompanyProfile,
    EmailTemplate,
    Integration,
    NotificationChannelDefault,
    NumberSeries,
    PaymentTerm,
)

SECRET_KEYS = {"password", "api_key", "secret", "token", "private_key", "passphrase"}


def _mask(value: str) -> str:
    s = str(value or "")
    if len(s) <= 4:
        return "••••"
    return "•" * (len(s) - 4) + s[-4:]


def mask_config(config: dict) -> dict:
    out = {}
    for k, v in (config or {}).items():
        if k.lower() in SECRET_KEYS:
            out[k] = _mask(v)
        else:
            out[k] = v
    return out


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")


class NumberSeriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = NumberSeries
        fields = (
            "id",
            "code",
            "prefix",
            "fiscal_year",
            "pad_width",
            "last_number",
            "separator",
            "pattern",
            "fy_reset",
            "is_active",
        )
        read_only_fields = ("last_number", "fiscal_year")


class PaymentTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTerm
        fields = ("id", "name", "days", "milestone_split", "is_active")


class IntegrationSerializer(serializers.ModelSerializer):
    config = serializers.JSONField()

    class Meta:
        model = Integration
        fields = (
            "id",
            "kind",
            "name",
            "config",
            "is_active",
            "last_tested_at",
            "last_test_status",
            "last_test_message",
        )
        read_only_fields = ("last_tested_at", "last_test_status", "last_test_message")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["config"] = mask_config(data.get("config") or {})
        return data


class NotificationChannelDefaultSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationChannelDefault
        fields = ("id", "kind", "in_app", "email", "whatsapp", "sms")


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = (
            "id",
            "slug",
            "subject",
            "body_html",
            "body_text",
            "variables",
            "is_active",
        )


# ---------------------------------------------------------------------------
# Action payloads
# ---------------------------------------------------------------------------
_VAR_RE = re.compile(r"\{\{\s*(\w+)\s*\}\}")


class EmailRenderRequestSerializer(serializers.Serializer):
    variables = serializers.DictField(child=serializers.CharField(allow_blank=True), required=False, default=dict)


def render_template(template: EmailTemplate, variables: dict) -> dict:
    declared = set(template.variables or [])
    found = set(_VAR_RE.findall(template.subject + template.body_html + template.body_text))
    needed = declared | found
    missing = sorted(v for v in needed if v not in variables)
    if missing:
        raise serializers.ValidationError({"missing_variables": missing})

    def sub(text: str) -> str:
        return _VAR_RE.sub(lambda m: str(variables.get(m.group(1), "")), text)

    return {
        "subject": sub(template.subject),
        "body_html": sub(template.body_html),
        "body_text": sub(template.body_text),
    }


class EmailSendTestSerializer(serializers.Serializer):
    to = serializers.EmailField()
    variables = serializers.DictField(child=serializers.CharField(allow_blank=True), required=False, default=dict)


class IntegrationTestSerializer(serializers.Serializer):
    pass  # uses stored config; no payload required
