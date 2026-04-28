"""Inventory: categories, brands, products, warehouses, stock movements, reservations.

`stock_summary_v` (managed DB view) is added in a separate `RunSQL` migration
in step 08 — until then, list endpoints aggregate `stock_ledger` directly.
"""
from django.db import models

from apps.core.models import AuditModel, TimeStampedModel


class ProductCategory(AuditModel):
    name = models.CharField(max_length=100, db_index=True)
    parent_category = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "product_categories"
        ordering = ["name"]
        verbose_name_plural = "Product categories"

    def __str__(self) -> str:
        return self.name


class Brand(AuditModel):
    name = models.CharField(max_length=100, unique=True)
    country_of_origin = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "brands"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Product(AuditModel):
    product_code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, db_index=True)
    category = models.ForeignKey(
        ProductCategory, on_delete=models.PROTECT, related_name="products"
    )
    brand = models.ForeignKey(
        Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name="products"
    )
    model_number = models.CharField(max_length=100, blank=True, db_index=True)
    description = models.TextField(blank=True)
    unit_of_measure = models.CharField(max_length=50)
    hsn_code = models.CharField(max_length=20, blank=True)
    tax_rule = models.ForeignKey(
        "core.TaxRule",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    purchase_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    selling_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    minimum_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reorder_point = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_serialized = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, db_index=True)
    weight_kg = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    dimensions = models.CharField(max_length=100, blank=True)
    warranty_months = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "products"
        ordering = ["product_code"]

    def __str__(self) -> str:
        return f"{self.product_code} — {self.name}"


class ProductSpecification(AuditModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="specifications")
    spec_key = models.CharField(max_length=100)
    spec_value = models.CharField(max_length=255)
    unit = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = "product_specifications"
        ordering = ["spec_key"]


class Warehouse(AuditModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    address = models.TextField(blank=True)
    manager = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_warehouses",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "warehouses"
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.code} — {self.name}"


class StockLedger(TimeStampedModel):
    """Append-only stock movement journal. Positive qty = inward, negative = outward."""

    class TransactionType(models.TextChoices):
        INWARD_PURCHASE = "inward_purchase", "Inward — Purchase"
        INWARD_RETURN = "inward_return", "Inward — Return"
        OUTWARD_SALE = "outward_sale", "Outward — Sale"
        OUTWARD_DISPATCH = "outward_dispatch", "Outward — Dispatch"
        TRANSFER_IN = "transfer_in", "Transfer In"
        TRANSFER_OUT = "transfer_out", "Transfer Out"
        ADJUSTMENT = "adjustment", "Adjustment"
        OPENING = "opening", "Opening Balance"

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="ledger_entries")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="ledger_entries")
    transaction_type = models.CharField(max_length=30, choices=TransactionType.choices, db_index=True)
    reference_type = models.CharField(max_length=50, blank=True, db_index=True)
    reference_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    reference_number = models.CharField(max_length=100, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=3)
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    batch_number = models.CharField(max_length=100, blank=True, db_index=True)
    serial_number = models.CharField(max_length=100, blank=True, db_index=True)
    remarks = models.TextField(blank=True)
    transacted_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = "stock_ledger"
        ordering = ["-transacted_at"]
        indexes = [
            models.Index(fields=["product", "warehouse"]),
            models.Index(fields=["reference_type", "reference_id"]),
        ]


class StockReservation(AuditModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        RELEASED = "released", "Released"
        CANCELLED = "cancelled", "Cancelled"

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="reservations")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="reservations")
    order = models.ForeignKey(
        "orders.SalesOrder", on_delete=models.CASCADE, related_name="reservations"
    )
    order_item = models.ForeignKey(
        "orders.SalesOrderItem", on_delete=models.CASCADE, related_name="reservations"
    )
    reserved_qty = models.DecimalField(max_digits=10, decimal_places=3)
    reserved_at = models.DateTimeField(db_index=True)
    released_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)

    class Meta:
        db_table = "stock_reservations"
        ordering = ["-reserved_at"]


class ReorderRule(AuditModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reorder_rules")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name="reorder_rules")
    reorder_point = models.DecimalField(max_digits=10, decimal_places=3)
    reorder_quantity = models.DecimalField(max_digits=10, decimal_places=3)
    lead_time_days = models.IntegerField(null=True, blank=True)
    preferred_supplier = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "reorder_rules"
        ordering = ["product"]
        constraints = [
            models.UniqueConstraint(fields=["product", "warehouse"], name="uq_reorder_product_warehouse"),
        ]
