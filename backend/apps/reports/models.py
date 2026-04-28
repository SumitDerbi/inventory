"""Reports — KPI definitions, saved filters, scheduled emails."""
from django.db import models

from apps.core.models import AuditModel


class KpiDefinition(AuditModel):
    name = models.CharField(max_length=255)
    module = models.CharField(max_length=100, db_index=True)
    formula = models.TextField()
    target_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "kpi_definitions"
        ordering = ["module", "name"]


class SavedReport(AuditModel):
    name = models.CharField(max_length=255)
    module = models.CharField(max_length=100, db_index=True)
    filter_config = models.JSONField(default=dict)
    column_config = models.JSONField(null=True, blank=True)
    is_shared = models.BooleanField(default=False)

    class Meta:
        db_table = "saved_reports"
        ordering = ["module", "name"]


class ScheduledReport(AuditModel):
    class Frequency(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"

    report = models.ForeignKey(SavedReport, on_delete=models.CASCADE, related_name="schedules")
    frequency = models.CharField(max_length=10, choices=Frequency.choices)
    send_time = models.TimeField()
    recipients = models.TextField()
    last_sent_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "scheduled_reports"
        ordering = ["report", "send_time"]
