"""Custom permission classes."""
from __future__ import annotations

from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """User must be superuser/staff or hold a role with code `admin`."""

    def has_permission(self, request, view):  # noqa: D401
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if u.is_superuser or u.is_staff:
            return True
        return u.role_mappings.filter(role__code="admin", role__is_active=True).exists()


class HasRolePermission(BasePermission):
    """Check `view.required_permission` (e.g. `quotation.approve`) against the
    user's resolved permission set via UserRoleMapping → RolePermission."""

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if u.is_superuser:
            return True
        code = getattr(view, "required_permission", None)
        if not code:
            return True
        return u.role_mappings.filter(
            role__is_active=True,
            role__role_permissions__permission__code=code,
        ).exists()
