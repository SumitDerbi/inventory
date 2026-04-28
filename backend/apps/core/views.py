"""Shared base viewset.

`AuditModelViewSet` adds:

* soft-delete on DELETE (sets `is_deleted=True` instead of removing rows)
* user-stamping on create / update via `request.user`
* `ListExportMixin` for `?format=csv|xlsx|pdf`
* default filter / search / ordering backends inherited from settings

Concrete viewsets only need to set `queryset`, `serializer_class`,
`filterset_fields`, `search_fields`, `ordering_fields`, and (optionally)
`export_columns` + `module`.
"""
from __future__ import annotations

from rest_framework import viewsets

from .exporters import ListExportMixin


class AuditModelViewSet(ListExportMixin, viewsets.ModelViewSet):
    """ModelViewSet with audit + soft-delete + export defaults."""

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
            instance.delete()
