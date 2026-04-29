"""Inquiries lookup masters API (full Inquiry slice lands in step 05)."""
from rest_framework import serializers

from apps.core.views import AuditModelViewSet

from .models import InquirySource


class InquirySourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = InquirySource
        fields = ("id", "name", "is_active", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")


class InquirySourceViewSet(AuditModelViewSet):
    queryset = InquirySource.objects.all()
    serializer_class = InquirySourceSerializer
    filterset_fields = ("is_active",)
    search_fields = ("name",)
    ordering_fields = ("name",)
