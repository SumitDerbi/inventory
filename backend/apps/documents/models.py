"""Invoices, document categories & catalog, serial registry, certificate templates."""
from django.db import models

from apps.core.models import AuditModel


class Invoice(AuditModel):
    class InvoiceType(models.TextChoices):
        TAX = "tax_invoice", "Tax Invoice"
        PROFORMA = "proforma", "Proforma"
        CREDIT_NOTE = "credit_note", "Credit Note"
        DEBIT_NOTE = "debit_note", "Debit Note"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ISSUED = "issued", "Issued"
        CANCELLED = "cancelled", "Cancelled"

    invoice_number = models.CharField(max_length=100, unique=True)
    order = models.ForeignKey(
        "orders.SalesOrder", on_delete=models.PROTECT, related_name="invoices"
    )
    challan = models.ForeignKey(
        "dispatch.DispatchChallan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )
    customer = models.ForeignKey(
        "customers.Customer", on_delete=models.PROTECT, related_name="invoices"
    )
    invoice_date = models.DateField(db_index=True)
    invoice_type = models.CharField(max_length=20, choices=InvoiceType.choices, db_index=True)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_gst_invoice = models.BooleanField(default=True)
    place_of_supply = models.CharField(max_length=100, blank=True)
    file_path = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "invoices"
        ordering = ["-invoice_date"]


class InvoiceItem(AuditModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoice_items",
    )
    description = models.TextField()
    hsn_code = models.CharField(max_length=20, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        db_table = "invoice_items"
        ordering = ["id"]


class DocumentCategory(AuditModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    requires_serial_number = models.BooleanField(default=False)
    is_customer_visible = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "document_categories"
        ordering = ["name"]
        verbose_name_plural = "Document categories"


class Document(AuditModel):
    class Sensitivity(models.TextChoices):
        PUBLIC = "public", "Public"
        INTERNAL = "internal", "Internal"
        CONFIDENTIAL = "confidential", "Confidential"

    document_number = models.CharField(max_length=100, blank=True, db_index=True)
    category = models.ForeignKey(
        DocumentCategory, on_delete=models.PROTECT, related_name="documents"
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    order = models.ForeignKey(
        "orders.SalesOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    job = models.ForeignKey(
        "jobs.InstallationJob",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    serial_number = models.ForeignKey(
        "documents.SerialNumberRegistry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    document_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    file_path = models.CharField(max_length=500)
    file_name = models.CharField(max_length=255)
    version = models.PositiveIntegerField(default=1)
    is_latest = models.BooleanField(default=True, db_index=True)
    is_customer_visible = models.BooleanField(default=False, db_index=True)
    sensitivity = models.CharField(
        max_length=20,
        choices=Sensitivity.choices,
        default=Sensitivity.INTERNAL,
        db_index=True,
    )
    generated_by_system = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "documents"
        ordering = ["-created_at"]


class SerialNumberRegistry(AuditModel):
    class Status(models.TextChoices):
        IN_STOCK = "in_stock", "In Stock"
        RESERVED = "reserved", "Reserved"
        DISPATCHED = "dispatched", "Dispatched"
        INSTALLED = "installed", "Installed"
        RETURNED = "returned", "Returned"
        SCRAPPED = "scrapped", "Scrapped"

    serial_number = models.CharField(max_length=100, unique=True)
    product = models.ForeignKey(
        "inventory.Product", on_delete=models.PROTECT, related_name="serial_numbers"
    )
    batch_number = models.CharField(max_length=100, blank=True, db_index=True)
    inward_date = models.DateField(null=True, blank=True)
    order = models.ForeignKey(
        "orders.SalesOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="serial_numbers",
    )
    challan = models.ForeignKey(
        "dispatch.DispatchChallan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="serial_numbers",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="serial_numbers",
    )
    installation_job = models.ForeignKey(
        "jobs.InstallationJob",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="serial_numbers",
    )
    warranty_start_date = models.DateField(null=True, blank=True)
    warranty_end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_STOCK, db_index=True)

    class Meta:
        db_table = "serial_number_registry"
        ordering = ["serial_number"]
        verbose_name_plural = "Serial number registry"


class CertificateTemplate(AuditModel):
    name = models.CharField(max_length=255)
    category = models.ForeignKey(
        DocumentCategory, on_delete=models.PROTECT, related_name="certificate_templates"
    )
    template_html = models.TextField()
    variables = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "certificate_templates"
        ordering = ["name"]
