"""Quotation lifecycle — versions, items, approval steps, price/discount rules."""
from django.db import models

from apps.core.models import AuditModel, TimeStampedModel


class Quotation(AuditModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_APPROVAL = "pending_approval", "Pending Approval"
        APPROVED = "approved", "Approved"
        SENT = "sent", "Sent"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        EXPIRED = "expired", "Expired"
        CONVERTED = "converted", "Converted"

    quotation_number = models.CharField(max_length=50, db_index=True)
    version_number = models.PositiveIntegerField(default=1)
    inquiry = models.ForeignKey(
        "inquiries.Inquiry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotations",
    )
    customer = models.ForeignKey("customers.Customer", on_delete=models.PROTECT, related_name="quotations")
    contact = models.ForeignKey(
        "customers.Contact",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotations",
    )
    billing_address = models.ForeignKey(
        "customers.Address",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="billing_quotations",
    )
    shipping_address = models.ForeignKey(
        "customers.Address",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shipping_quotations",
    )
    site_address = models.TextField(blank=True)
    project_name = models.CharField(max_length=255, blank=True)
    quotation_date = models.DateField(db_index=True)
    valid_until = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    prepared_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.PROTECT,
        related_name="quotations_prepared",
    )
    approved_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotations_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    currency = models.CharField(max_length=10, default="INR")
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_discount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    freight_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    other_charges = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    gross_margin_percent = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    payment_terms = models.TextField(blank=True)
    delivery_terms = models.TextField(blank=True)
    warranty_terms = models.TextField(blank=True)
    scope_of_supply = models.TextField(blank=True)
    exclusions = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    pdf_path = models.CharField(max_length=500, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    parent_quotation = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revisions",
    )

    class Meta:
        db_table = "quotations"
        ordering = ["-quotation_date", "-version_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["quotation_number", "version_number"],
                name="uq_quotation_number_version",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.quotation_number} v{self.version_number}"


class QuotationItem(AuditModel):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotation_items",
    )
    product_code = models.CharField(max_length=100, blank=True)
    product_description = models.TextField()
    brand = models.CharField(max_length=100, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    specifications = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_rule = models.ForeignKey(
        "core.TaxRule",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotation_items",
    )
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=15, decimal_places=2)
    sort_order = models.IntegerField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "quotation_items"
        ordering = ["sort_order", "id"]


class QuotationApprovalStep(AuditModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        SKIPPED = "skipped", "Skipped"

    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name="approval_steps")
    step_order = models.PositiveIntegerField()
    approver = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.PROTECT,
        related_name="quotation_approval_steps",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    action_at = models.DateTimeField(null=True, blank=True)
    comments = models.TextField(blank=True)
    condition_type = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "quotation_approval_steps"
        ordering = ["quotation", "step_order"]


class PriceRule(AuditModel):
    class RuleType(models.TextChoices):
        COST_PLUS_MARGIN = "cost_plus_margin", "Cost + Margin"
        LIST_PRICE = "list_price", "List Price"
        DEALER_PRICE = "dealer_price", "Dealer Price"
        PROJECT_SPECIFIC = "project_specific", "Project-specific"

    class CustomerType(models.TextChoices):
        DEALER = "dealer", "Dealer"
        CONTRACTOR = "contractor", "Contractor"
        DIRECT = "direct", "Direct"

    name = models.CharField(max_length=100)
    rule_type = models.CharField(max_length=30, choices=RuleType.choices)
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="price_rules",
    )
    category = models.ForeignKey(
        "inventory.ProductCategory",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="price_rules",
    )
    customer_type = models.CharField(max_length=20, choices=CustomerType.choices, blank=True)
    base_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    margin_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "price_rules"
        ordering = ["name"]


class DiscountRule(AuditModel):
    class ApplicableTo(models.TextChoices):
        ALL = "all", "All"
        PRODUCT = "product", "Product"
        CATEGORY = "category", "Category"
        CUSTOMER_TYPE = "customer_type", "Customer Type"

    name = models.CharField(max_length=100)
    max_discount_percent = models.DecimalField(max_digits=5, decimal_places=2)
    requires_approval_above = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    applicable_to = models.CharField(max_length=20, choices=ApplicableTo.choices)
    entity_id = models.BigIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "discount_rules"
        ordering = ["name"]

class QuotationActivityLog(TimeStampedModel):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name="activity_logs")
    action_type = models.CharField(max_length=100, db_index=True)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.PROTECT,
        related_name="quotation_activities",
    )
    performed_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = "quotation_activity_logs"
        ordering = ["-performed_at"]


class QuotationCommunicationLog(TimeStampedModel):
    class Channel(models.TextChoices):
        EMAIL = "email", "Email"
        WHATSAPP = "whatsapp", "WhatsApp"
        SMS = "sms", "SMS"

    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name="communications")
    channel = models.CharField(max_length=20, choices=Channel.choices)
    to_address = models.CharField(max_length=255)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    sent_at = models.DateTimeField(db_index=True)
    sent_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.PROTECT,
        related_name="quotation_communications",
    )

    class Meta:
        db_table = "quotation_communication_logs"
        ordering = ["-sent_at"]
