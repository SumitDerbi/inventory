"""Order line-pricing + stage transition services (Step 07a-cont)."""
from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable

from django.db import transaction
from django.db.models import Sum
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


def _check_stage_gates(order: SalesOrder, next_stage: str) -> None:
    """Raise ValidationError if order does not meet preconditions for next_stage."""
    Status = SalesOrder.Status
    if next_stage == Status.CONFIRMED:
        if not order.items.exists():
            raise ValidationError(
                {"next_stage": "Cannot confirm order without at least one item."}
            )
    if next_stage == Status.READY_TO_DISPATCH:
        if not order.items.exists():
            raise ValidationError(
                {"next_stage": "Cannot mark ready to dispatch without items."}
            )
        if order.material_checklists.filter(status="shortage").exists():
            raise ValidationError(
                {
                    "next_stage": (
                        "Cannot mark ready to dispatch while material checklist "
                        "has shortages."
                    )
                }
            )


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
    _check_stage_gates(order, next_stage)

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


# ---------------------------------------------------------------------------
# MRP availability
# ---------------------------------------------------------------------------
def compute_mrp_availability(order: SalesOrder) -> list[dict]:
    """Return per-item availability snapshot."""
    from apps.inventory.models import StockLedger, StockReservation

    rows: list[dict] = []
    items = list(order.items.select_related("product").all())
    for item in items:
        required = _q(item.quantity_pending or item.quantity_ordered)
        product_id = item.product_id
        if product_id is None:
            on_hand = ZERO
            reserved = ZERO
        else:
            on_hand = (
                StockLedger.objects.filter(product_id=product_id).aggregate(
                    s=Sum("quantity")
                )["s"]
                or ZERO
            )
            reserved = (
                StockReservation.objects.filter(
                    product_id=product_id,
                    status=StockReservation.Status.ACTIVE,
                )
                .exclude(order_id=order.id)
                .aggregate(s=Sum("reserved_qty"))["s"]
                or ZERO
            )
        on_hand = _q(on_hand)
        reserved = _q(reserved)
        available = _q(on_hand - reserved)
        shortfall = _q(max(ZERO, required - available))
        rows.append(
            {
                "item_id": item.id,
                "product_id": product_id,
                "product_description": item.product_description,
                "required_qty": str(required),
                "on_hand": str(on_hand),
                "reserved": str(reserved),
                "available": str(available),
                "shortfall": str(shortfall),
                "ready": shortfall == ZERO and required > ZERO,
            }
        )
    return rows


# ---------------------------------------------------------------------------
# Reserve / release
# ---------------------------------------------------------------------------
@transaction.atomic
def reserve_stock(order: SalesOrder, *, warehouse_id: int, user=None) -> list[dict]:
    """Create active StockReservation rows for each item with a product FK.

    Skips items already having an active reservation (idempotent).
    Raises ValidationError if any required item has insufficient available stock.
    """
    from apps.inventory.models import StockReservation, Warehouse

    if not Warehouse.objects.filter(pk=warehouse_id).exists():
        raise ValidationError({"warehouse": "Warehouse not found."})

    rows = compute_mrp_availability(order)
    short = [r for r in rows if not r["ready"] and r["product_id"] is not None]
    if short:
        raise ValidationError(
            {
                "items": [
                    {
                        "item_id": r["item_id"],
                        "shortfall": r["shortfall"],
                    }
                    for r in short
                ]
            }
        )

    created: list[dict] = []
    items = list(order.items.select_related("product").all())
    now = timezone.now()
    for item in items:
        if item.product_id is None:
            continue
        existing = StockReservation.objects.filter(
            order_item=item, status=StockReservation.Status.ACTIVE
        ).first()
        if existing:
            created.append({"item_id": item.id, "reservation_id": existing.id, "skipped": True})
            continue
        kwargs = {
            "product_id": item.product_id,
            "warehouse_id": warehouse_id,
            "order": order,
            "order_item": item,
            "reserved_qty": _q(item.quantity_pending or item.quantity_ordered),
            "reserved_at": now,
            "status": StockReservation.Status.ACTIVE,
        }
        if hasattr(StockReservation, "created_by_id") and user is not None:
            kwargs.update({"created_by": user, "updated_by": user})
        res = StockReservation.objects.create(**kwargs)
        created.append({"item_id": item.id, "reservation_id": res.id, "skipped": False})
    return created


@transaction.atomic
def release_stock(order: SalesOrder, *, user=None) -> int:
    """Release all active reservations for the order. Returns count released."""
    from apps.inventory.models import StockReservation

    qs = StockReservation.objects.filter(
        order=order, status=StockReservation.Status.ACTIVE
    )
    now = timezone.now()
    update_kwargs = {"status": StockReservation.Status.RELEASED, "released_at": now}
    if hasattr(StockReservation, "updated_by_id") and user is not None:
        update_kwargs["updated_by"] = user
    return qs.update(**update_kwargs)


