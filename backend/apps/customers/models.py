"""Customer master + contacts + addresses."""
from django.db import models

from apps.core.models import AuditModel


class Customer(AuditModel):
    class CustomerType(models.TextChoices):
        DEALER = "dealer", "Dealer"
        CONTRACTOR = "contractor", "Contractor"
        DIRECT = "direct", "Direct"
        COMPANY = "company", "Company"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        BLACKLISTED = "blacklisted", "Blacklisted"
        MERGED = "merged", "Merged"

    customer_type = models.CharField(max_length=20, choices=CustomerType.choices, db_index=True)
    company_name = models.CharField(max_length=255, db_index=True)
    contact_person_name = models.CharField(max_length=100, blank=True)
    mobile = models.CharField(max_length=20, db_index=True)
    alternate_mobile = models.CharField(max_length=20, blank=True)
    email = models.EmailField(max_length=150, blank=True)
    gst_number = models.CharField(max_length=20, blank=True, db_index=True)
    pan_number = models.CharField(max_length=20, blank=True)
    address_line1 = models.TextField(blank=True)
    address_line2 = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    assigned_sales_exec = models.ForeignKey(
        "auth_ext.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customers_assigned",
    )
    territory = models.CharField(max_length=100, blank=True)
    credit_limit = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    credit_days = models.IntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    merged_into = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="merged_from",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "customers"
        ordering = ["company_name"]

    def __str__(self) -> str:
        return self.company_name


class Contact(AuditModel):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100, blank=True)
    mobile = models.CharField(max_length=20)
    email = models.EmailField(max_length=150, blank=True)
    is_primary = models.BooleanField(default=False)
    department = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "contacts"
        ordering = ["-is_primary", "name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.customer.company_name})"


class Address(AuditModel):
    class AddressType(models.TextChoices):
        BILLING = "billing", "Billing"
        SHIPPING = "shipping", "Shipping"
        SITE = "site", "Site"

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="addresses")
    address_type = models.CharField(max_length=20, choices=AddressType.choices, db_index=True)
    label = models.CharField(max_length=100, blank=True)
    address_line1 = models.TextField()
    address_line2 = models.TextField(blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    contact_person = models.CharField(max_length=100, blank=True)
    contact_mobile = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = "addresses"
        ordering = ["-is_default", "label"]
