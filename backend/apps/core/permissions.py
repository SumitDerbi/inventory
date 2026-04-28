"""Reusable DRF permission classes."""
from rest_framework.permissions import BasePermission


class IsAuthenticatedActive(BasePermission):
    """Authenticated user whose `is_active=True`."""

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_active)


class HasRole(BasePermission):
    """`HasRole('admin', 'sales_manager')` — pass if any role matches.

    Role lookup defers to `user.profile.role` populated by `apps.auth_ext`
    in step 03. Until then, we fall back to staff/superuser.
    """

    required_roles: tuple[str, ...] = ()

    def __init__(self, *roles):
        self.required_roles = tuple(roles)

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if u.is_superuser:
            return True
        role = getattr(getattr(u, "profile", None), "role", None)
        return role in self.required_roles


class HasModulePermission(BasePermission):
    """Per-module action gate.

    Usage on a viewset::

        permission_classes = [HasModulePermission]
        module = "inquiries"

    Resolves `user.profile.permissions[module][action]` once `apps.auth_ext`
    is wired. Until then it allows authenticated staff users.
    """

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if u.is_superuser:
            return True
        module = getattr(view, "module", None)
        if not module:
            return True
        action = _action_for(request.method)
        perms = getattr(getattr(u, "profile", None), "permissions", None) or {}
        return bool(perms.get(module, {}).get(action))


_METHOD_TO_ACTION = {
    "GET": "view",
    "HEAD": "view",
    "OPTIONS": "view",
    "POST": "create",
    "PUT": "update",
    "PATCH": "update",
    "DELETE": "delete",
}


def _action_for(method: str) -> str:
    return _METHOD_TO_ACTION.get(method.upper(), "view")
