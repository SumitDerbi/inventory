"""Purchase & procurement — vendors, PR, RFQ, PO, GRN, vendor invoices, payments, returns."""
from django.db import models

from apps.core.models import AuditModel


# ---------------------------------------------------------------------------
# Vendor master
# ---------------------------------------------------------------------------
class Vendor(AuditModel):
    class VendorType(models.TextChoices):
        MANUFACTURER = "manufacturer", "Manufacturer"
        DISTRIBUTOR = "distributor", "Distributor"
        TRADER = "trader", "Trader"
        SERVICE = "service", "Service"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        BLACKLISTED = "blacklisted", "Blacklisted"
        ON_HOLD = "on_hold", "On Hold"

    vendor_code = models.CharField(max_length=50, unique=True)
    vendor_type = models.CharField(max_length=20, choices=VendorType.choices, db_index=True)
    company_name = models.CharField(max_length=255, db_index=True)
    contact_person_name = models.CharField(max_length=100, blank=True)
    mobile = models.CharField(max_length=20, db_index=True)
    alternate_mobile = models.CharField(max_length=20, blank=True)
    email = models.EmailField(max_length=150, blank=True)
    website = models.CharField(max_length=255, blank=True)
    gst_number = models.CharField(max_length=20, blank=True, db_index=True)
    pan_number = models.CharField(max_length=20, blank=True)
    msme_number = models.CharField(max_length=50, blank=True)
    address_line1 = models.TextField(blank=True)
    address_line2 = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    country = models.CharField(max_length=100, default="India")
    payment_terms = models.CharField(max_length=100, blank=True)
    credit_days = models.IntegerField(null=True, blank=True)
    currency = models.CharField(max_length=10, default="INR")
    category_tags = models.CharField(max_length=255, blank=True)
    performance_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "vendors"
        ordering = ["vendor_code"]

    def __str__(self) -> str:
        return f"{self.vendor_code} — {self.company_name}"


class VendorContact(AuditModel):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100, blank=True)
    mobile = models.CharField(max_length=20)
    email = models.EmailField(max_length=150, blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = "vendor_contacts"
        ordering = ["-is_primary", "name"]


class VendorBankDetail(AuditModel):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="bank_details")
    bank_name = models.CharField(max_length=150)
    branch = models.CharField(max_length=150, blank=True)
    account_number = models.CharField(max_length=50)
    account_holder = models.CharField(max_length=150, blank=True)
    ifsc_code = models.CharField(max_length=20)
    swift_code = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = "vendor_bank_details"
        ordering = ["-is_default", "bank_name"]


# ---------------------------------------------------------------------------
# Purchase Requisition (PR)
# ---------------------------------------------------------------------------
class PurchaseRequisition(AuditModel):
    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        REORDER = "reorder", "Reorder"
        SALES_ORDER = "sales_order", "Sales Order"
        SITE_REQUEST = "site_request", "Site Request"

    class Priority(models.TextChoices):
        HIGH = "high", "High"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_APPROVAL = "pending_approval", "Pending Approval"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        RFQ_SENT = "rfq_sent", "RFQ Sent"
        PO_CREATED = "po_created", "PO Created"
        CLOSED = "closed", "Closed"
        CANCELLED = "cancelled", "Cancelled"

    pr_number = models.CharField(max_length=50, unique=True)
    pr_date = models.DateField(db_index=True)
    source = models.CharField(max_length=20, choices=Source.choices, db_index=True)
    sales_order = models.ForeignKey(
        "orders.SalesOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_requisitions",
    )
    job = models.ForeignKey(
        "jobs.InstallationJob",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_requisitions",
    )
    department = models.CharField(max_length=100, blank=True)
    project_reference = models.CharField(max_length=255, blank=True)
    required_by_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM, db_index=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True)
    requested_by = models.ForeignKey(
        "auth_ext.User", on_delete=models.PROTECT, related_name="prs_requested"
    )
    approved_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prs_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "purchase_requisitions"
        ordering = ["-pr_date"]


class PurchaseRequisitionItem(AuditModel):
    pr = models.ForeignKey(PurchaseRequisition, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pr_items",
    )
    product_description = models.CharField(max_length=255)
    specification_notes = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, blank=True)
    estimated_unit_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    estimated_total = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    warehouse = models.ForeignKey(
        "inventory.Warehouse",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pr_items",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "purchase_requisition_items"
        ordering = ["id"]


# ---------------------------------------------------------------------------
# RFQ
# ---------------------------------------------------------------------------
class Rfq(AuditModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        RESPONSES_RECEIVED = "responses_received", "Responses Received"
        AWARDED = "awarded", "Awarded"
        CANCELLED = "cancelled", "Cancelled"

    rfq_number = models.CharField(max_length=50, unique=True)
    pr = models.ForeignKey(
        PurchaseRequisition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rfqs",
    )
    rfq_date = models.DateField(db_index=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True)
    awarded_to = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rfqs_awarded",
    )
    awarded_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "rfqs"
        ordering = ["-rfq_date"]
        verbose_name = "RFQ"
        verbose_name_plural = "RFQs"


class RfqVendor(AuditModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RESPONDED = "responded", "Responded"
        DECLINED = "declined", "Declined"
        NO_RESPONSE = "no_response", "No Response"

    rfq = models.ForeignKey(Rfq, on_delete=models.CASCADE, related_name="vendors")
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name="rfq_invitations")
    sent_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)

    class Meta:
        db_table = "rfq_vendors"
        ordering = ["rfq", "vendor"]


class VendorQuote(AuditModel):
    rfq = models.ForeignKey(Rfq, on_delete=models.CASCADE, related_name="quotes")
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name="quotes")
    quote_number = models.CharField(max_length=100, blank=True)
    quote_date = models.DateField(db_index=True)
    valid_until = models.DateField(null=True, blank=True)
    lead_time_days = models.IntegerField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="INR")
    payment_terms = models.CharField(max_length=100, blank=True)
    freight_terms = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "vendor_quotes"
        ordering = ["-quote_date"]


class VendorQuoteItem(AuditModel):
    vendor_quote = models.ForeignKey(VendorQuote, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_quote_items",
    )
    product_description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, blank=True)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    tax = models.ForeignKey(
        "core.TaxRule",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_quote_items",
    )
    line_total = models.DecimalField(max_digits=15, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "vendor_quote_items"
        ordering = ["id"]


# ---------------------------------------------------------------------------
# Purchase Order (PO)
# ---------------------------------------------------------------------------
class PurchaseOrder(AuditModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_APPROVAL = "pending_approval", "Pending Approval"
        APPROVED = "approved", "Approved"
        SENT = "sent", "Sent"
        PARTIALLY_RECEIVED = "partially_received", "Partially Received"
        RECEIVED = "received", "Received"
        CLOSED = "closed", "Closed"
        CANCELLED = "cancelled", "Cancelled"

    po_number = models.CharField(max_length=50, unique=True)
    po_date = models.DateField(db_index=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name="purchase_orders")
    pr = models.ForeignKey(
        PurchaseRequisition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_orders",
    )
    rfq = models.ForeignKey(
        Rfq,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_orders",
    )
    sales_order = models.ForeignKey(
        "orders.SalesOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_orders",
    )
    billing_address = models.TextField(blank=True)
    shipping_address = models.TextField(blank=True)
    expected_delivery = models.DateField(null=True, blank=True)
    payment_terms = models.CharField(max_length=100, blank=True)
    freight_terms = models.CharField(max_length=100, blank=True)
    currency = models.CharField(max_length=10, default="INR")
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    tax_total = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    freight_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    grand_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    advance_paid = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True)
    approved_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pos_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    terms_and_conditions = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "purchase_orders"
        ordering = ["-po_date"]


class PurchaseOrderItem(AuditModel):
    po = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="po_items",
    )
    product_description = models.CharField(max_length=255)
    specification_notes = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, blank=True)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    tax = models.ForeignKey(
        "core.TaxRule",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="po_items",
    )
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    line_total = models.DecimalField(max_digits=15, decimal_places=2)
    received_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pending_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    warehouse = models.ForeignKey(
        "inventory.Warehouse",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="po_items",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "purchase_order_items"
        ordering = ["id"]


class PoDeliverySchedule(AuditModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RECEIVED = "received", "Received"
        OVERDUE = "overdue", "Overdue"
        CANCELLED = "cancelled", "Cancelled"

    po_item = models.ForeignKey(
        PurchaseOrderItem, on_delete=models.CASCADE, related_name="delivery_schedules"
    )
    scheduled_date = models.DateField(db_index=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)

    class Meta:
        db_table = "po_delivery_schedules"
        ordering = ["scheduled_date"]


class PurchaseApproval(AuditModel):
    class EntityType(models.TextChoices):
        PR = "purchase_requisition", "Purchase Requisition"
        PO = "purchase_order", "Purchase Order"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        RETURNED = "returned", "Returned"

    entity_type = models.CharField(max_length=30, choices=EntityType.choices, db_index=True)
    entity_id = models.BigIntegerField(db_index=True)
    level = models.PositiveIntegerField()
    approver = models.ForeignKey(
        "auth_ext.User", on_delete=models.PROTECT, related_name="purchase_approvals"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    acted_at = models.DateTimeField(null=True, blank=True)
    comments = models.TextField(blank=True)

    class Meta:
        db_table = "purchase_approvals"
        ordering = ["entity_type", "entity_id", "level"]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
        ]


# ---------------------------------------------------------------------------
# GRN
# ---------------------------------------------------------------------------
class GoodsReceiptNote(AuditModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_QC = "pending_qc", "Pending QC"
        COMPLETED = "completed", "Completed"
        PARTIALLY_ACCEPTED = "partially_accepted", "Partially Accepted"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    grn_number = models.CharField(max_length=50, unique=True)
    grn_date = models.DateField(db_index=True)
    po = models.ForeignKey(PurchaseOrder, on_delete=models.PROTECT, related_name="grns")
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name="grns")
    warehouse = models.ForeignKey(
        "inventory.Warehouse", on_delete=models.PROTECT, related_name="grns"
    )
    invoice_number = models.CharField(max_length=100, blank=True)
    invoice_date = models.DateField(null=True, blank=True)
    vehicle_number = models.CharField(max_length=50, blank=True)
    transporter = models.CharField(max_length=150, blank=True)
    received_by = models.ForeignKey(
        "auth_ext.User", on_delete=models.PROTECT, related_name="grns_received"
    )
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "goods_receipt_notes"
        ordering = ["-grn_date"]


class GrnItem(AuditModel):
    class QcStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        ON_HOLD = "on_hold", "On Hold"

    grn = models.ForeignKey(GoodsReceiptNote, on_delete=models.CASCADE, related_name="items")
    po_item = models.ForeignKey(
        PurchaseOrderItem, on_delete=models.PROTECT, related_name="grn_items"
    )
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="grn_items",
    )
    received_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    accepted_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    rejected_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    qc_status = models.CharField(max_length=20, choices=QcStatus.choices, default=QcStatus.PENDING, db_index=True)
    qc_remarks = models.TextField(blank=True)
    batch_number = models.CharField(max_length=100, blank=True, db_index=True)
    serial_numbers = models.TextField(blank=True)
    warehouse_location = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "grn_items"
        ordering = ["id"]


# ---------------------------------------------------------------------------
# Vendor invoices & payments
# ---------------------------------------------------------------------------
class VendorInvoice(AuditModel):
    class MatchStatus(models.TextChoices):
        UNMATCHED = "unmatched", "Unmatched"
        MATCHED = "matched", "Matched"
        PRICE_VARIANCE = "price_variance", "Price Variance"
        QTY_VARIANCE = "qty_variance", "Qty Variance"
        ON_HOLD = "on_hold", "On Hold"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        VERIFIED = "verified", "Verified"
        APPROVED = "approved", "Approved"
        PAID = "paid", "Paid"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        DISPUTED = "disputed", "Disputed"
        CANCELLED = "cancelled", "Cancelled"

    invoice_number = models.CharField(max_length=100, db_index=True)
    invoice_date = models.DateField(db_index=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name="invoices")
    po = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_invoices",
    )
    grn = models.ForeignKey(
        GoodsReceiptNote,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_invoices",
    )
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    tax_total = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    freight_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    grand_total = models.DecimalField(max_digits=15, decimal_places=2)
    due_date = models.DateField(null=True, blank=True)
    match_status = models.CharField(
        max_length=20, choices=MatchStatus.choices, default=MatchStatus.UNMATCHED, db_index=True
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    attachment = models.ForeignKey(
        "core.Attachment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_invoices",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "vendor_invoices"
        ordering = ["-invoice_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["vendor", "invoice_number"], name="uq_vendor_invoice_number"
            ),
        ]


class VendorInvoiceItem(AuditModel):
    invoice = models.ForeignKey(VendorInvoice, on_delete=models.CASCADE, related_name="items")
    po_item = models.ForeignKey(
        PurchaseOrderItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_invoice_items",
    )
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendor_invoice_items",
    )
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    line_total = models.DecimalField(max_digits=15, decimal_places=2)

    class Meta:
        db_table = "vendor_invoice_items"
        ordering = ["id"]


class VendorPayment(AuditModel):
    class PaymentType(models.TextChoices):
        ADVANCE = "advance", "Advance"
        AGAINST_INVOICE = "against_invoice", "Against Invoice"
        ON_ACCOUNT = "on_account", "On Account"
        REFUND = "refund", "Refund"

    class PaymentMethod(models.TextChoices):
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        CHEQUE = "cheque", "Cheque"
        CASH = "cash", "Cash"
        UPI = "upi", "UPI"
        RTGS = "rtgs", "RTGS"
        NEFT = "neft", "NEFT"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSED = "processed", "Processed"
        CLEARED = "cleared", "Cleared"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    payment_number = models.CharField(max_length=50, unique=True)
    payment_date = models.DateField(db_index=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name="payments")
    invoice = models.ForeignKey(
        VendorInvoice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    po = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices, db_index=True)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    reference_number = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    tds_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "vendor_payments"
        ordering = ["-payment_date"]


# ---------------------------------------------------------------------------
# Returns
# ---------------------------------------------------------------------------
class PurchaseReturn(AuditModel):
    class ReasonCode(models.TextChoices):
        DAMAGED = "damaged", "Damaged"
        WRONG_ITEM = "wrong_item", "Wrong Item"
        QUALITY_FAIL = "quality_fail", "Quality Fail"
        EXCESS = "excess", "Excess"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        APPROVED = "approved", "Approved"
        DISPATCHED = "dispatched", "Dispatched"
        CLOSED = "closed", "Closed"
        CANCELLED = "cancelled", "Cancelled"

    return_number = models.CharField(max_length=50, unique=True)
    return_date = models.DateField(db_index=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name="returns")
    grn = models.ForeignKey(
        GoodsReceiptNote,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="returns",
    )
    po = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="returns",
    )
    reason_code = models.CharField(max_length=20, choices=ReasonCode.choices, db_index=True)
    reason_notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    debit_note_no = models.CharField(max_length=100, blank=True)
    debit_note_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    approved_by = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="returns_approved",
    )

    class Meta:
        db_table = "purchase_returns"
        ordering = ["-return_date"]


class PurchaseReturnItem(AuditModel):
    return_doc = models.ForeignKey(
        PurchaseReturn, on_delete=models.CASCADE, related_name="items", db_column="return_id"
    )
    grn_item = models.ForeignKey(
        GrnItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="return_items",
    )
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchase_return_items",
    )
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    line_total = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = "purchase_return_items"
        ordering = ["id"]
