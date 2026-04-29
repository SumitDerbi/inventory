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
    separator = models.CharField(max_length=5, default="/")
    pattern = models.CharField(
        max_length=100,
        default="{prefix}{sep}{fy}{sep}{seq}",
        help_text="Tokens: {prefix} {fy} {seq} {sep}",
    )
    fy_reset = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "number_series"
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code


# ---------------------------------------------------------------------------
# Settings (Step 04b)
# ---------------------------------------------------------------------------
class CompanyProfile(TimeStampedModel):
    """Singleton — `CompanyProfile.get_solo()` returns or creates the row."""

    name = models.CharField(max_length=255)
    legal_name = models.CharField(max_length=255, blank=True)
    gst_number = models.CharField(max_length=20, blank=True)
    pan = models.CharField(max_length=20, blank=True)
    cin = models.CharField(max_length=30, blank=True)
    address_line1 = models.TextField(blank=True)
    address_line2 = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    country = models.CharField(max_length=100, default="India")
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    website = models.CharField(max_length=255, blank=True)
    logo = models.FileField(upload_to="company/", blank=True, null=True)
    invoice_footer = models.TextField(blank=True)
    bank_details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "company_profile"

    @classmethod
    def get_solo(cls) -> "CompanyProfile":
        obj = cls.objects.first()
        if obj is None:
            obj = cls.objects.create(name="Acme Co.")
        return obj


class PaymentTerm(AuditModel):
    name = models.CharField(max_length=100, unique=True)
    days = models.PositiveIntegerField(default=0)
    milestone_split = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "payment_terms"
        ordering = ["name"]


class Integration(AuditModel):
    class Kind(models.TextChoices):
        SMTP = "smtp", "SMTP"
        WHATSAPP = "whatsapp", "WhatsApp"
        SMS = "sms", "SMS"
        S3 = "s3", "S3"
        PAYMENT_GATEWAY = "payment_gateway", "Payment Gateway"

    kind = models.CharField(max_length=30, choices=Kind.choices, db_index=True)
    name = models.CharField(max_length=100)
    config = models.JSONField(default=dict, blank=True)  # secrets stored opaquely
    is_active = models.BooleanField(default=True)
    last_tested_at = models.DateTimeField(null=True, blank=True)
    last_test_status = models.CharField(max_length=20, blank=True)
    last_test_message = models.TextField(blank=True)

    class Meta:
        db_table = "integrations"
        ordering = ["kind", "name"]


class NotificationChannelDefault(AuditModel):
    kind = models.CharField(max_length=100, unique=True, db_index=True)
    in_app = models.BooleanField(default=True)
    email = models.BooleanField(default=False)
    whatsapp = models.BooleanField(default=False)
    sms = models.BooleanField(default=False)

    class Meta:
        db_table = "notification_channel_defaults"
        ordering = ["kind"]


class EmailTemplate(AuditModel):
    slug = models.CharField(max_length=100, unique=True, db_index=True)
    subject = models.CharField(max_length=255)
    body_html = models.TextField(blank=True)
    body_text = models.TextField(blank=True)
    variables = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "email_templates"
        ordering = ["slug"]
