"""In-app notification queue (per-user, per-entity)."""
from django.db import models

from apps.core.models import TimeStampedModel


class Notification(TimeStampedModel):
    user = models.ForeignKey(
        "auth_ext.User", on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=100, db_index=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    entity_type = models.CharField(max_length=50, blank=True, db_index=True)
    entity_id = models.BigIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    sent_at = models.DateTimeField(auto_now_add=True, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-sent_at"]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
        ]
