"""Client portal — organizations, users, access logs."""
from django.db import models

from apps.core.models import AuditModel, TimeStampedModel


class ClientOrganization(AuditModel):
    customer = models.OneToOneField(
        "customers.Customer", on_delete=models.PROTECT, related_name="portal_organization"
    )
    portal_enabled = models.BooleanField(default=False, db_index=True)
    allowed_project_ids = models.TextField(blank=True)
    allowed_doc_categories = models.TextField(blank=True)
    max_users = models.PositiveIntegerField(default=5)

    class Meta:
        db_table = "client_organizations"
        ordering = ["customer"]


class ClientUser(AuditModel):
    """Portal-facing user — separate auth principal from staff `User`."""

    class AccessLevel(models.TextChoices):
        FULL = "full", "Full"
        READ_ONLY = "read_only", "Read-only"
        DOCUMENTS_ONLY = "documents_only", "Documents-only"

    organization = models.ForeignKey(
        ClientOrganization, on_delete=models.CASCADE, related_name="users"
    )
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, unique=True)
    password_hash = models.CharField(max_length=255)
    mobile = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    last_login = models.DateTimeField(null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    access_level = models.CharField(
        max_length=20, choices=AccessLevel.choices, default=AccessLevel.READ_ONLY
    )

    class Meta:
        db_table = "client_users"
        ordering = ["email"]

    def __str__(self) -> str:
        return self.email


class PortalAccessLog(TimeStampedModel):
    client_user = models.ForeignKey(
        ClientUser, on_delete=models.CASCADE, related_name="access_logs"
    )
    action = models.CharField(max_length=100, db_index=True)
    entity_type = models.CharField(max_length=50, blank=True, db_index=True)
    entity_id = models.BigIntegerField(null=True, blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    ip_address = models.CharField(max_length=50, blank=True)
    performed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "portal_access_logs"
        ordering = ["-performed_at"]
