"""Sales orders + items + milestones + material checklist + install requirements."""
from django.db import models

from apps.core.models import AuditModel


class SalesOrder(AuditModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        CONFIRMED = "confirmed", "Confirmed"
        PROCESSING = "processing", "Processing"
        READY_TO_DISPATCH = "ready_to_dispatch", "Ready to Dispatch"
        PARTIALLY_DISPATCHED = "partially_dispatched", "Partially Dispatched"
        FULLY_DISPATCHED = "fully_dispatched", "Fully Dispatched"
        INSTALLED = "installed", "Installed"
        CLOSED = "closed", "Closed"
        CANCELLED = "cancelled", "Cancelled"

    order_number = models.CharField(max_length=50, unique=True)
    quotation = models.ForeignKey(
        "quotations.Quotation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_orders",
    )
    customer = models.ForeignKey("customers.Customer", on_delete=models.PROTECT, related_name="sales_orders")
    contact = models.ForeignKey(
        "customers.Contact",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_orders",
    )
    billing_address = models.ForeignKey(
        "customers.Address",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="billing_orders",
    )
    shipping_address = models.ForeignKey(
        "customers.Address",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shipping_orders",
    )
    project_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True)
    order_date = models.DateField(db_index=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    confirmed_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders_confirmed",
    )
    assigned_sales_exec = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders_owned",
    )
    payment_terms = models.TextField(blank=True)
    delivery_terms = models.TextField(blank=True)
    special_instructions = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_discount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    freight_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    cancellation_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "sales_orders"
        ordering = ["-order_date"]

    def __str__(self) -> str:
        return self.order_number


class SalesOrderItem(AuditModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RESERVED = "reserved", "Reserved"
        READY = "ready", "Ready"
        DISPATCHED = "dispatched", "Dispatched"
        CANCELLED = "cancelled", "Cancelled"

    order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    product_description = models.TextField()
    quantity_ordered = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_dispatched = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_pending = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=50)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_rule = models.ForeignKey(
        "core.TaxRule",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    line_total = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "sales_order_items"
        ordering = ["id"]


class OrderMilestone(AuditModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        OVERDUE = "overdue", "Overdue"

    order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name="milestones")
    milestone_name = models.CharField(max_length=255)
    target_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "order_milestones"
        ordering = ["target_date"]


class MaterialChecklist(AuditModel):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        PARTIAL = "partial", "Partial"
        SHORTAGE = "shortage", "Shortage"
        PROCURING = "procuring", "Procuring"
        READY = "ready", "Ready"

    order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name="material_checklists")
    order_item = models.ForeignKey(
        SalesOrderItem,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="material_checklists",
    )
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="material_checklists",
    )
    description = models.CharField(max_length=255)
    required_qty = models.DecimalField(max_digits=10, decimal_places=2)
    available_qty = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    shortage_qty = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "material_checklists"
        ordering = ["id"]


class InstallationRequirement(AuditModel):
    class Readiness(models.TextChoices):
        READY = "ready", "Ready"
        NOT_READY = "not_ready", "Not Ready"
        PARTIAL = "partial", "Partial"
        UNKNOWN = "unknown", "Unknown"

    order = models.OneToOneField(
        SalesOrder, on_delete=models.CASCADE, related_name="installation_requirement"
    )
    site_address = models.TextField()
    site_contact_name = models.CharField(max_length=100, blank=True)
    site_contact_mobile = models.CharField(max_length=20, blank=True)
    civil_readiness = models.CharField(
        max_length=20, choices=Readiness.choices, default=Readiness.UNKNOWN
    )
    electrical_readiness = models.CharField(
        max_length=20, choices=Readiness.choices, default=Readiness.UNKNOWN
    )
    expected_install_date = models.DateField(null=True, blank=True)
    special_site_requirements = models.TextField(blank=True)
    access_instructions = models.TextField(blank=True)
    permissions_required = models.BooleanField(default=False)
    permission_details = models.TextField(blank=True)

    class Meta:
        db_table = "installation_requirements"
