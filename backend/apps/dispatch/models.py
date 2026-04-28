"""Dispatch & logistics — plans, challans, vehicles, transporters, POD."""
from django.db import models

from apps.core.models import AuditModel


class Transporter(AuditModel):
    name = models.CharField(max_length=255, db_index=True)
    contact_person = models.CharField(max_length=100, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    gst_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    service_areas = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "transporters"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Vehicle(AuditModel):
    vehicle_number = models.CharField(max_length=50, unique=True)
    vehicle_type = models.CharField(max_length=100, blank=True)
    capacity_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    transporter = models.ForeignKey(
        Transporter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vehicles",
    )
    is_own = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "vehicles"
        ordering = ["vehicle_number"]


class DispatchPlan(AuditModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        APPROVED = "approved", "Approved"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    plan_number = models.CharField(max_length=50, unique=True)
    planned_date = models.DateField(db_index=True)
    warehouse = models.ForeignKey(
        "inventory.Warehouse", on_delete=models.PROTECT, related_name="dispatch_plans"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "dispatch_plans"
        ordering = ["-planned_date"]


class DispatchChallan(AuditModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        PACKED = "packed", "Packed"
        LOADED = "loaded", "Loaded"
        IN_TRANSIT = "in_transit", "In Transit"
        DELIVERED = "delivered", "Delivered"
        POD_PENDING = "pod_pending", "POD Pending"
        CLOSED = "closed", "Closed"
        FAILED = "failed", "Failed"

    class FreightPaidBy(models.TextChoices):
        COMPANY = "company", "Company"
        CUSTOMER = "customer", "Customer"

    challan_number = models.CharField(max_length=50, unique=True)
    dispatch_plan = models.ForeignKey(
        DispatchPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="challans",
    )
    order = models.ForeignKey(
        "orders.SalesOrder", on_delete=models.PROTECT, related_name="dispatch_challans"
    )
    customer = models.ForeignKey(
        "customers.Customer", on_delete=models.PROTECT, related_name="dispatch_challans"
    )
    delivery_address = models.ForeignKey(
        "customers.Address",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="delivery_challans",
    )
    delivery_address_text = models.TextField(blank=True)
    transporter = models.ForeignKey(
        Transporter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dispatch_challans",
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dispatch_challans",
    )
    driver_name = models.CharField(max_length=100, blank=True)
    driver_mobile = models.CharField(max_length=20, blank=True)
    lr_number = models.CharField(max_length=100, blank=True)
    dispatch_date = models.DateField(db_index=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED, db_index=True)
    freight_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    freight_paid_by = models.CharField(max_length=20, choices=FreightPaidBy.choices, blank=True)
    notes = models.TextField(blank=True)
    pdf_path = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "dispatch_challans"
        ordering = ["-dispatch_date"]

    def __str__(self) -> str:
        return self.challan_number


class DispatchChallanItem(AuditModel):
    challan = models.ForeignKey(DispatchChallan, on_delete=models.CASCADE, related_name="items")
    order_item = models.ForeignKey(
        "orders.SalesOrderItem",
        on_delete=models.PROTECT,
        related_name="challan_items",
    )
    product = models.ForeignKey(
        "inventory.Product", on_delete=models.PROTECT, related_name="challan_items"
    )
    product_description = models.TextField()
    dispatched_qty = models.DecimalField(max_digits=10, decimal_places=3)
    unit = models.CharField(max_length=50)
    serial_numbers = models.TextField(blank=True)
    batch_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "dispatch_challan_items"
        ordering = ["id"]


class PodRecord(AuditModel):
    class Condition(models.TextChoices):
        GOOD = "good", "Good"
        DAMAGED = "damaged", "Damaged"
        PARTIAL = "partial", "Partial"

    challan = models.ForeignKey(
        DispatchChallan, on_delete=models.CASCADE, related_name="pod_records"
    )
    received_by = models.CharField(max_length=100, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    signature_path = models.CharField(max_length=500, blank=True)
    pod_photo_path = models.CharField(max_length=500, blank=True)
    condition = models.CharField(max_length=20, choices=Condition.choices, blank=True)
    remarks = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        "auth_ext.User", on_delete=models.PROTECT, related_name="pod_uploads"
    )

    class Meta:
        db_table = "pod_records"
        ordering = ["-created_at"]
