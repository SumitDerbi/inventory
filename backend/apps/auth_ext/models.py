"""Auth & RBAC — custom User + roles/permissions/audit."""
from __future__ import annotations

from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.models import TimeStampedModel


class User(AbstractUser):
    """Staff user. Extends Django's AbstractUser with HR + profile fields.

    `username` retained from AbstractUser (used by admin); `email` is the
    primary login identifier and is unique. RBAC roles assigned via
    `UserRoleMapping`; `permissions` resolved on demand by services.
    """

    email = models.EmailField(unique=True)
    mobile = models.CharField(max_length=20, blank=True)
    employee_code = models.CharField(max_length=50, blank=True, db_index=True)
    department = models.CharField(max_length=100, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    profile_photo = models.CharField(max_length=500, blank=True)
    notes = models.TextField(blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        ordering = ["email"]

    def __str__(self) -> str:
        return self.email or self.username


class Role(TimeStampedModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_system_role = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "roles"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.code


class Permission(TimeStampedModel):
    """Custom RBAC permission — separate from Django's auth.Permission.

    `code` is `<module>.<action>` (e.g. `quotation.approve`).
    """

    module = models.CharField(max_length=100, db_index=True)
    action = models.CharField(max_length=100)
    code = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "permissions"
        ordering = ["module", "action"]
        constraints = [
            models.UniqueConstraint(fields=["module", "action"], name="uq_permission_module_action"),
        ]

    def __str__(self) -> str:
        return self.code


class RolePermission(TimeStampedModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="role_permissions")

    class Meta:
        db_table = "role_permissions"
        constraints = [
            models.UniqueConstraint(fields=["role", "permission"], name="uq_role_permission"),
        ]


class UserRoleMapping(TimeStampedModel):
    user = models.ForeignKey("auth_ext.User", on_delete=models.CASCADE, related_name="role_mappings")
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name="user_mappings")
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="role_assignments_made",
    )
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "user_role_mappings"
        ordering = ["-assigned_at"]


class AuditLog(models.Model):
    """Append-only audit trail. No mixin — the row itself is the timestamp record."""

    user = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_logs",
    )
    module = models.CharField(max_length=100, db_index=True)
    action = models.CharField(max_length=100, db_index=True)
    entity_type = models.CharField(max_length=50, db_index=True)
    entity_id = models.BigIntegerField(db_index=True)
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    ip_address = models.CharField(max_length=50, blank=True)
    performed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-performed_at"]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
        ]


class SessionLog(models.Model):
    user = models.ForeignKey("auth_ext.User", on_delete=models.CASCADE, related_name="session_logs")
    login_at = models.DateTimeField(auto_now_add=True, db_index=True)
    logout_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.CharField(max_length=50, blank=True)
    device_info = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "session_logs"
        ordering = ["-login_at"]


class AuthSession(models.Model):
    """Per-refresh-token session row. One row per active refresh."""

    user = models.ForeignKey(
        "auth_ext.User", on_delete=models.CASCADE, related_name="auth_sessions"
    )
    refresh_jti = models.CharField(max_length=255, unique=True)
    device = models.CharField(max_length=100, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    ip_address = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_seen_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "auth_sessions"
        ordering = ["-last_seen_at"]


class User2FA(models.Model):
    """TOTP secret + recovery codes (hashed)."""

    user = models.OneToOneField(
        "auth_ext.User", on_delete=models.CASCADE, related_name="two_factor"
    )
    secret = models.CharField(max_length=64)
    enrolled_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    recovery_codes = models.JSONField(default=list)  # list of hashed strings

    class Meta:
        db_table = "user_2fa"

    @property
    def is_enrolled(self) -> bool:
        return self.enrolled_at is not None


class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        "auth_ext.User", on_delete=models.CASCADE, related_name="password_reset_tokens"
    )
    token_hash = models.CharField(max_length=128, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "password_reset_tokens"
        ordering = ["-created_at"]
