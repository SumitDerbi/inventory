"""System-wide masters that don't fit a single domain.

`TaxRule` is referenced by quotations / orders / invoices.
`Attachment` is the polymorphic file pointer used everywhere.
`NumberSeries` powers atomic per-series counters (inquiry_number,
quotation_number, order_number, etc.) consumed in step 03+.
"""
from django.db import models

from .models import AuditModel, TimeStampedModel


class TaxRule(AuditModel):
    class TaxType(models.TextChoices):
        GST = "GST", "GST"
        IGST = "IGST", "IGST"
        VAT = "VAT", "VAT"
        EXEMPT = "EXEMPT", "Exempt"

    class ApplicableTo(models.TextChoices):
        PRODUCT = "product", "Product"
        FREIGHT = "freight", "Freight"
        SERVICE = "service", "Service"
        ALL = "all", "All"

    name = models.CharField(max_length=100)
    tax_type = models.CharField(max_length=10, choices=TaxType.choices)
    rate_percent = models.DecimalField(max_digits=5, decimal_places=2)
    applicable_to = models.CharField(max_length=20, choices=ApplicableTo.choices, default=ApplicableTo.PRODUCT)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "tax_rules"
        ordering = ["tax_type", "rate_percent"]

    def __str__(self) -> str:
        return f"{self.name} ({self.rate_percent}%)"


class Attachment(AuditModel):
    """Polymorphic file pointer. `entity_type` + `entity_id` form a generic FK
    without using contenttypes (kept simple for AI-readable migrations)."""

    entity_type = models.CharField(max_length=50, db_index=True)
    entity_id = models.BigIntegerField(db_index=True)
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size_kb = models.IntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)
    uploaded_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_attachments",
    )
    version = models.PositiveIntegerField(default=1)
    is_latest = models.BooleanField(default=True, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "attachments"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
        ]


class NumberSeries(TimeStampedModel):
    """Atomic counter for document numbering (inquiry, quotation, order, etc.).

    Generators in `apps/core/numbering.py` (step 03) use SELECT ... FOR UPDATE
    to bump `last_number` safely under concurrency.
    """

    code = models.CharField(max_length=50, unique=True)  # e.g. "INQ", "QUO"
    prefix = models.CharField(max_length=20, blank=True)
    fiscal_year = models.CharField(max_length=10, blank=True)  # e.g. "2526"
    pad_width = models.PositiveIntegerField(default=4)
    last_number = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "number_series"
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code
