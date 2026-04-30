"""Customer invoice business logic (Module 7 slice)."""
from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.core.numbering import consume_next

from .models import Invoice, InvoiceItem


ZERO = Decimal("0.00")
BULK_MAX_IDS = 200


def _q(value) -> Decimal:
    return Decimal(str(value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def next_invoice_number() -> str:
    return consume_next("INV")


# ---------------------------------------------------------------------------
# Totals
# ---------------------------------------------------------------------------
def compute_item_totals(item: InvoiceItem) -> tuple[Decimal, Decimal, Decimal]:
    """Return (taxable, tax_amount, line_total) for an invoice item."""
    qty = _q(item.quantity)
    price = _q(item.unit_price)
    discount = _q(item.discount_amount)
    tax_pct = _q(item.tax_percent)

    gross = (qty * price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    taxable = (gross - discount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if taxable < ZERO:
        taxable = ZERO
    tax_amount = (taxable * tax_pct / Decimal("100")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    line_total = (taxable + tax_amount).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    return taxable, tax_amount, line_total


@transaction.atomic
def recompute_totals(invoice: Invoice, *, user=None) -> Invoice:
    subtotal = ZERO
    tax_total = ZERO
    grand = ZERO
    for it in InvoiceItem.objects.filter(invoice=invoice):
        taxable, tax_amount, line_total = compute_item_totals(it)
        if (
            it.tax_amount != tax_amount
            or it.line_total != line_total
        ):
            it.tax_amount = tax_amount
            it.line_total = line_total
            update_fields = ["tax_amount", "line_total", "updated_at"]
            if user is not None and hasattr(it, "updated_by_id"):
                it.updated_by = user
                update_fields.append("updated_by")
            it.save(update_fields=update_fields)
        subtotal += taxable
        tax_total += tax_amount
        grand += line_total

    invoice.subtotal = subtotal
    invoice.tax_amount = tax_total
    invoice.grand_total = grand
    update_fields = ["subtotal", "tax_amount", "grand_total", "updated_at"]
    if user is not None and hasattr(invoice, "updated_by_id"):
        invoice.updated_by = user
        update_fields.append("updated_by")
    invoice.save(update_fields=update_fields)
    return invoice


# ---------------------------------------------------------------------------
# Status machine: draft -> issued -> cancelled
# ---------------------------------------------------------------------------
ALLOWED_TRANSITIONS = {
    Invoice.Status.DRAFT: (Invoice.Status.ISSUED, Invoice.Status.CANCELLED),
    Invoice.Status.ISSUED: (Invoice.Status.CANCELLED,),
    Invoice.Status.CANCELLED: (),
}


@transaction.atomic
def transition_status(
    invoice: Invoice,
    *,
    next_status: str,
    reason: str = "",
    user=None,
) -> Invoice:
    if next_status not in dict(Invoice.Status.choices):
        raise ValidationError({"next_status": f"Unknown status '{next_status}'."})
    allowed = ALLOWED_TRANSITIONS.get(invoice.status, ())
    if next_status not in allowed:
        raise ValidationError(
            {
                "next_status": (
                    f"Cannot transition from '{invoice.status}' to '{next_status}'."
                )
            }
        )
    if next_status == Invoice.Status.ISSUED and not invoice.items.exists():
        raise ValidationError(
            {"items": "Cannot issue an invoice without line items."}
        )
    if next_status == Invoice.Status.CANCELLED and not reason:
        raise ValidationError({"reason": "Cancellation reason is required."})

    invoice.status = next_status
    update_fields = ["status", "updated_at"]
    if next_status == Invoice.Status.CANCELLED:
        invoice.notes = (invoice.notes + "\n" if invoice.notes else "") + (
            f"Cancelled: {reason}"
        )
        update_fields.append("notes")
    if user is not None and hasattr(invoice, "updated_by_id"):
        invoice.updated_by = user
        update_fields.append("updated_by")
    invoice.save(update_fields=update_fields)
    return invoice


# ---------------------------------------------------------------------------
# Create from sales order (inherits items)
# ---------------------------------------------------------------------------
@transaction.atomic
def create_from_order(order, *, invoice_type: str = "tax_invoice", user=None) -> Invoice:
    from apps.orders.models import SalesOrderItem  # local import to avoid cycle

    if invoice_type not in dict(Invoice.InvoiceType.choices):
        raise ValidationError({"invoice_type": f"Unknown type '{invoice_type}'."})

    audit = {"created_by": user, "updated_by": user} if user is not None else {}
    invoice = Invoice.objects.create(
        invoice_number=next_invoice_number(),
        order=order,
        customer=order.customer,
        invoice_date=timezone.now().date(),
        invoice_type=invoice_type,
        status=Invoice.Status.DRAFT,
        **audit,
    )

    items: Iterable[SalesOrderItem] = order.items.all()
    for oi in items:
        unit_price = _q(oi.unit_price)
        qty = _q(oi.quantity_ordered)
        discount_pct = _q(oi.discount_percent)
        gross = (unit_price * qty).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        discount_amount = (gross * discount_pct / Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        tax_pct = ZERO
        if oi.tax_rule_id is not None:
            tax_pct = _q(getattr(oi.tax_rule, "rate_percent", 0))
        item = InvoiceItem(
            invoice=invoice,
            product=oi.product,
            description=oi.product_description,
            hsn_code=getattr(oi.product, "hsn_code", "") or "",
            quantity=qty,
            unit=oi.unit,
            unit_price=unit_price,
            discount_amount=discount_amount,
            tax_percent=tax_pct,
            tax_amount=ZERO,
            line_total=ZERO,
            **audit,
        )
        taxable, tax_amount, line_total = compute_item_totals(item)
        item.tax_amount = tax_amount
        item.line_total = line_total
        item.save()

    recompute_totals(invoice, user=user)
    return invoice


# ---------------------------------------------------------------------------
# Aging buckets
# ---------------------------------------------------------------------------
def aging_buckets(qs=None) -> dict:
    """Return {bucket: {count, total}} for issued invoices.

    Buckets: 0-30 / 31-60 / 61-90 / 90+ days since invoice_date.
    """
    today = timezone.now().date()
    buckets = {
        "0-30": {"count": 0, "total": ZERO},
        "31-60": {"count": 0, "total": ZERO},
        "61-90": {"count": 0, "total": ZERO},
        "90+": {"count": 0, "total": ZERO},
    }
    if qs is None:
        qs = Invoice.objects.filter(status=Invoice.Status.ISSUED)
    for inv in qs.only("id", "invoice_date", "grand_total", "status"):
        days = (today - inv.invoice_date).days if inv.invoice_date else 0
        if days <= 30:
            key = "0-30"
        elif days <= 60:
            key = "31-60"
        elif days <= 90:
            key = "61-90"
        else:
            key = "90+"
        buckets[key]["count"] += 1
        buckets[key]["total"] = (buckets[key]["total"] + _q(inv.grand_total))
    return buckets


# ---------------------------------------------------------------------------
# Bulk operations
# ---------------------------------------------------------------------------
def _validate_ids(ids):
    if not isinstance(ids, list) or not ids:
        raise ValidationError({"ids": "Non-empty list of invoice ids required."})
    if len(ids) > BULK_MAX_IDS:
        raise ValidationError(
            {"ids": f"Cannot process more than {BULK_MAX_IDS} ids per request."}
        )
    return ids


def bulk_export(ids) -> list[dict]:
    _validate_ids(ids)
    by_id = {inv.id: inv for inv in Invoice.objects.filter(id__in=ids)}
    out: list[dict] = []
    for iid in ids:
        inv = by_id.get(iid)
        if inv is None:
            out.append({"id": iid, "status": "error", "error": "not_found"})
            continue
        out.append(
            {
                "id": iid,
                "status": "ok",
                "invoice_number": inv.invoice_number,
                "customer_id": inv.customer_id,
                "invoice_date": inv.invoice_date.isoformat() if inv.invoice_date else None,
                "grand_total": str(inv.grand_total),
                "invoice_status": inv.status,
            }
        )
    return out


def bulk_send(ids, *, user=None) -> list[dict]:
    """Bulk transition draft -> issued."""
    _validate_ids(ids)
    by_id = {inv.id: inv for inv in Invoice.objects.filter(id__in=ids)}
    out: list[dict] = []
    for iid in ids:
        inv = by_id.get(iid)
        if inv is None:
            out.append({"id": iid, "status": "error", "error": "not_found"})
            continue
        try:
            transition_status(inv, next_status=Invoice.Status.ISSUED, user=user)
        except ValidationError as exc:
            out.append({"id": iid, "status": "error", "error": str(exc.detail)})
            continue
        out.append(
            {
                "id": iid,
                "status": "ok",
                "invoice_number": inv.invoice_number,
                "invoice_status": inv.status,
            }
        )
    return out
