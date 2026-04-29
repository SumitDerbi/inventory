"""Abstract base models reused by every app.

Every domain model should inherit `AuditModel` (or one of its components)
to get consistent timestamps, user stamps, and soft-delete semantics.
"""
from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    """Adds `created_at` / `updated_at` columns."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UserStampedModel(models.Model):
    """Adds nullable `created_by` / `updated_by` FKs.

    Set by the base viewset on create/update. Nullable so seed scripts
    and management commands can still write rows without a user context.
    """

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    class Meta:
        abstract = True


class SoftDeleteManager(models.Manager):
    """Default manager that hides soft-deleted rows."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Escape hatch — returns soft-deleted rows too."""

    def get_queryset(self):
        return super().get_queryset()


class SoftDeleteModel(models.Model):
    """Adds `is_deleted` flag + manager that hides them by default."""

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])


class AuditModel(TimeStampedModel, UserStampedModel, SoftDeleteModel):
    """Convenience: combines timestamps, user-stamps, soft-delete."""

    class Meta:
        abstract = True


# Re-export concrete masters so Django's app registry sees them as `core.<Model>`.
from apps.core.masters import (  # noqa: E402, F401
    Attachment,
    CompanyProfile,
    EmailTemplate,
    Integration,
    NotificationChannelDefault,
    NumberSeries,
    PaymentTerm,
    TaxRule,
)
