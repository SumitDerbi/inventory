"""Shared base viewset + core masters API (TaxRule, Attachment)."""
from __future__ import annotations

import os

from django.conf import settings
from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .exporters import ListExportMixin
from .masters import Attachment, TaxRule
from .serializers import (
    AttachmentSerializer,
    AttachmentUploadSerializer,
    TaxRuleSerializer,
)


class AuditModelViewSet(ListExportMixin, viewsets.ModelViewSet):
    """ModelViewSet with audit + soft-delete + export defaults.

    Adds `?include_deleted=true` (admin only) to surface soft-deleted rows.
    """

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if hasattr(serializer.Meta.model, "created_by_id"):
            serializer.save(created_by=user, updated_by=user)
        else:
            serializer.save()

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if hasattr(serializer.Meta.model, "updated_by_id"):
            serializer.save(updated_by=user)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        if hasattr(instance, "soft_delete"):
            instance.soft_delete()
        else:
            if hasattr(instance, "is_deleted"):
                instance.is_deleted = True
                if hasattr(instance, "deleted_at"):
                    instance.deleted_at = timezone.now()
                update_fields = ["is_deleted"]
                if hasattr(instance, "deleted_at"):
                    update_fields.append("deleted_at")
                instance.save(update_fields=update_fields)
            else:
                instance.delete()

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("include_deleted") == "true":
            user = self.request.user
            is_admin = bool(
                user.is_authenticated and (user.is_superuser or user.is_staff)
            )
            if is_admin and hasattr(qs.model, "all_objects"):
                qs = qs.model.all_objects.all()
        return qs


class TaxRuleViewSet(AuditModelViewSet):
    queryset = TaxRule.objects.all()
    serializer_class = TaxRuleSerializer
    filterset_fields = ("tax_type", "applicable_to", "is_active")
    search_fields = ("name",)
    ordering_fields = ("name", "rate_percent", "created_at")


class AttachmentViewSet(AuditModelViewSet):
    queryset = Attachment.objects.all().order_by("-created_at")
    serializer_class = AttachmentSerializer
    parser_classes = (MultiPartParser, FormParser)
    filterset_fields = ("entity_type", "entity_id", "is_latest")
    search_fields = ("file_name", "notes")
    http_method_names = ("get", "post", "delete", "head", "options")

    def create(self, request, *args, **kwargs):
        ser = AttachmentUploadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        entity_type = ser.validated_data["entity_type"]
        entity_id = ser.validated_data["entity_id"]
        upload = ser.validated_data["file"]
        notes = ser.validated_data.get("notes", "")

        rel_dir = f"attachments/{entity_type}/{entity_id}/"
        rel_path = default_storage.save(os.path.join(rel_dir, upload.name), upload)

        with transaction.atomic():
            Attachment.objects.filter(
                entity_type=entity_type, entity_id=entity_id, is_latest=True
            ).update(is_latest=False)
            current_max = (
                Attachment.objects.filter(entity_type=entity_type, entity_id=entity_id)
                .order_by("-version")
                .values_list("version", flat=True)
                .first()
                or 0
            )
            user = request.user if request.user.is_authenticated else None
            attachment = Attachment.objects.create(
                entity_type=entity_type,
                entity_id=entity_id,
                file_name=upload.name,
                file_path=rel_path,
                file_size_kb=int(getattr(upload, "size", 0) // 1024) or None,
                mime_type=getattr(upload, "content_type", "") or "",
                uploaded_by=user,
                version=current_max + 1,
                is_latest=True,
                notes=notes,
                created_by=user,
                updated_by=user,
            )
        return Response(
            AttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED
        )
