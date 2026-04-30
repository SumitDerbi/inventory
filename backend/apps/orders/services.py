"""Order line-pricing + stage transition services (Step 07a-cont)."""
from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import SalesOrder, SalesOrderItem


ZERO = Decimal("0.00")


def _q(value) -> Decimal:
    return Decimal(value or 0).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compute_item_line_total(item: SalesOrderItem) -> tuple[Decimal, Decimal, Decimal, Decimal]:
    """Return (line_total, line_subtotal, discount_amount, tax_amount)."""
    qty = _q(item.quantity_ordered)
    price = _q(item.unit_price)
    disc_pct = _q(item.discount_percent)
    gross = _q(qty * price)
    disc = _q(gross * disc_pct / Decimal("100"))
    subtotal = _q(gross - disc)
    tax_pct = _q(item.tax_rule.rate_percent) if item.tax_rule_id else ZERO
    tax = _q(subtotal * tax_pct / Decimal("100"))
    return _q(subtotal + tax), subtotal, disc, tax


@transaction.atomic
def recompute_totals(order: SalesOrder, *, user=None) -> SalesOrder:
    items: Iterable[SalesOrderItem] = list(order.items.select_related("tax_rule").all())
    subtotal = ZERO
    total_discount = ZERO
    total_tax = ZERO
    for item in items:
        line_total, line_subtotal, disc, tax = compute_item_line_total(item)
        if item.line_total != line_total:
            item.line_total = line_total
            item.save(update_fields=["line_total", "updated_at"])
        subtotal += line_subtotal
        total_discount += disc
        total_tax += tax
    order.subtotal = _q(subtotal)
    order.total_discount = _q(total_discount)
    order.total_tax = _q(total_tax)
    order.grand_total = _q(
        order.subtotal + order.total_tax + _q(order.freight_amount)
    )
    update_fields = ["subtotal", "total_discount", "total_tax", "grand_total", "updated_at"]
    if user is not None and hasattr(order, "updated_by_id"):
        order.updated_by = user
        update_fields.append("updated_by")
    order.save(update_fields=update_fields)
    return order


# ---------------------------------------------------------------------------
# Stage machine
# ---------------------------------------------------------------------------
# Forward-only happy path. Cancel allowed pre-dispatch.
STAGE_FLOW: dict[str, tuple[str, ...]] = {
    SalesOrder.Status.DRAFT: (SalesOrder.Status.CONFIRMED, SalesOrder.Status.CANCELLED),
    SalesOrder.Status.CONFIRMED: (
        SalesOrder.Status.PROCESSING,
        SalesOrder.Status.CANCELLED,
    ),
    SalesOrder.Status.PROCESSING: (
        SalesOrder.Status.READY_TO_DISPATCH,
        SalesOrder.Status.CANCELLED,
    ),
    SalesOrder.Status.READY_TO_DISPATCH: (
        SalesOrder.Status.FULLY_DISPATCHED,
        SalesOrder.Status.CANCELLED,
    ),
    SalesOrder.Status.FULLY_DISPATCHED: (SalesOrder.Status.INSTALLED,),
    SalesOrder.Status.INSTALLED: (SalesOrder.Status.CLOSED,),
    SalesOrder.Status.CLOSED: (),
    SalesOrder.Status.CANCELLED: (),
    SalesOrder.Status.PARTIALLY_DISPATCHED: (
        SalesOrder.Status.FULLY_DISPATCHED,
        SalesOrder.Status.INSTALLED,
    ),
}


@transaction.atomic
def transition_stage(
    order: SalesOrder,
    *,
    next_stage: str,
    user=None,
    cancellation_reason: str = "",
) -> SalesOrder:
    current = order.status
    allowed = STAGE_FLOW.get(current, ())
    if next_stage not in allowed:
        raise ValidationError(
            {
                "next_stage": (
                    f"Cannot transition from '{current}' to '{next_stage}'. "
                    f"Allowed: {list(allowed) or 'none'}."
                )
            }
        )
    if next_stage == SalesOrder.Status.CANCELLED and not cancellation_reason.strip():
        raise ValidationError({"cancellation_reason": "Reason is required to cancel."})

    update_fields: list[str] = ["status", "updated_at"]
    order.status = next_stage
    if next_stage == SalesOrder.Status.CONFIRMED and not order.confirmed_at:
        order.confirmed_at = timezone.now()
        order.confirmed_by = user
        update_fields += ["confirmed_at", "confirmed_by"]
    if next_stage == SalesOrder.Status.CANCELLED:
        order.cancellation_reason = cancellation_reason.strip()
        update_fields.append("cancellation_reason")
    if user is not None and hasattr(order, "updated_by_id"):
        order.updated_by = user
        update_fields.append("updated_by")
    order.save(update_fields=update_fields)
    return order
