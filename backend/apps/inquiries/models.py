"""Inquiry intake — sources, line items, follow-ups, activity log."""
from django.db import models

from apps.core.models import AuditModel, TimeStampedModel


class InquirySource(AuditModel):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "inquiry_sources"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Inquiry(AuditModel):
    class InquiryType(models.TextChoices):
        NEW_PROJECT = "new_project", "New Project"
        SPARE_PARTS = "spare_parts", "Spare Parts"
        AMC = "amc", "AMC"
        SERVICE = "service", "Service"
        OTHER = "other", "Other"

    class Priority(models.TextChoices):
        HIGH = "high", "High"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"

    class Status(models.TextChoices):
        NEW = "new", "New"
        IN_PROGRESS = "in_progress", "In Progress"
        QUOTED = "quoted", "Quoted"
        CONVERTED = "converted", "Converted"
        LOST = "lost", "Lost"
        ON_HOLD = "on_hold", "On Hold"

    inquiry_number = models.CharField(max_length=50, unique=True)
    source = models.ForeignKey(InquirySource, on_delete=models.PROTECT, related_name="inquiries")
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inquiries",
    )
    customer_name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True)
    mobile = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(max_length=150, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    project_name = models.CharField(max_length=255, blank=True)
    project_description = models.TextField(blank=True)
    product_category = models.ForeignKey(
        "inventory.ProductCategory",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inquiries",
    )
    inquiry_type = models.CharField(max_length=20, choices=InquiryType.choices, db_index=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW, db_index=True)
    assigned_to = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inquiries_assigned",
    )
    expected_order_date = models.DateField(null=True, blank=True)
    site_location = models.TextField(blank=True)
    budget_range = models.CharField(max_length=100, blank=True)
    source_reference = models.CharField(max_length=255, blank=True)
    lost_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "inquiries"
        ordering = ["-created_at"]
        verbose_name_plural = "Inquiries"

    def __str__(self) -> str:
        return self.inquiry_number


class InquiryLineItem(AuditModel):
    inquiry = models.ForeignKey(Inquiry, on_delete=models.CASCADE, related_name="line_items")
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inquiry_line_items",
    )
    product_description = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True)
    specification_notes = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, blank=True)
    estimated_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "inquiry_line_items"
        ordering = ["id"]


class InquiryFollowUp(AuditModel):
    class FollowUpType(models.TextChoices):
        CALL = "call", "Call"
        EMAIL = "email", "Email"
        VISIT = "visit", "Visit"
        WHATSAPP = "whatsapp", "WhatsApp"
        MEETING = "meeting", "Meeting"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        MISSED = "missed", "Missed"
        RESCHEDULED = "rescheduled", "Rescheduled"

    inquiry = models.ForeignKey(Inquiry, on_delete=models.CASCADE, related_name="follow_ups")
    follow_up_type = models.CharField(max_length=20, choices=FollowUpType.choices)
    scheduled_at = models.DateTimeField(db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    outcome = models.TextField(blank=True)
    next_follow_up_date = models.DateField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.PROTECT,
        related_name="follow_ups_assigned",
    )

    class Meta:
        db_table = "inquiry_follow_ups"
        ordering = ["-scheduled_at"]


class InquiryActivityLog(TimeStampedModel):
    inquiry = models.ForeignKey(Inquiry, on_delete=models.CASCADE, related_name="activity_logs")
    action_type = models.CharField(max_length=100, db_index=True)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.PROTECT,
        related_name="inquiry_activities",
    )
    performed_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = "inquiry_activity_logs"
        ordering = ["-performed_at"]
