"""Pricing engine for quotations (Step 06a).

Pure functions — given line input dicts, returns computed totals + per-line
breakdown. Caller persists. No DB access.
"""
from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Iterable, TypedDict

ZERO = Decimal("0.00")
TWOPL = Decimal("0.01")


def _q(value) -> Decimal:
    if value is None or value == "":
        return ZERO
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return value.quantize(TWOPL, rounding=ROUND_HALF_UP)


class LineInput(TypedDict, total=False):
    quantity: Decimal | float | str
    unit_price: Decimal | float | str
    unit_cost: Decimal | float | str
    discount_percent: Decimal | float | str
    discount_amount: Decimal | float | str
    tax_percent: Decimal | float | str  # already-resolved tax rate %


class LineResult(TypedDict):
    quantity: Decimal
    unit_price: Decimal
    unit_cost: Decimal
    discount_percent: Decimal
    discount_amount: Decimal
    tax_percent: Decimal
    tax_amount: Decimal
    line_subtotal: Decimal       # qty*price - discount (pre-tax)
    line_total: Decimal           # subtotal + tax


class Totals(TypedDict):
    subtotal: Decimal
    total_discount: Decimal
    total_tax: Decimal
    freight_amount: Decimal
    other_charges: Decimal
    grand_total: Decimal
    gross_margin_percent: Decimal | None
    lines: list[LineResult]
    tax_breakup: list[dict]       # [{rate: Decimal, base: Decimal, tax: Decimal}]


def calculate(
    lines: Iterable[LineInput],
    *,
    freight_amount=ZERO,
    other_charges=ZERO,
) -> Totals:
    """Compute per-line and document totals.

    Per line:
      gross = qty * unit_price
      discount = max(discount_amount, gross * discount_percent / 100)
      subtotal = gross - discount
      tax = subtotal * tax_percent / 100
      line_total = subtotal + tax
    """
    freight_amount = _q(freight_amount)
    other_charges = _q(other_charges)

    line_results: list[LineResult] = []
    subtotal = ZERO
    total_discount = ZERO
    total_tax = ZERO
    total_cost = ZERO
    breakup: dict[str, dict] = {}

    for li in lines:
        qty = _q(li.get("quantity", 0))
        price = _q(li.get("unit_price", 0))
        cost = _q(li.get("unit_cost", 0))
        disc_pct = _q(li.get("discount_percent", 0))
        disc_amt_in = _q(li.get("discount_amount", 0))
        tax_pct = _q(li.get("tax_percent", 0))

        gross = _q(qty * price)
        pct_disc = _q(gross * disc_pct / Decimal("100"))
        disc_amt = pct_disc if pct_disc > disc_amt_in else disc_amt_in
        if disc_amt > gross:
            disc_amt = gross
        line_subtotal = _q(gross - disc_amt)
        tax_amount = _q(line_subtotal * tax_pct / Decimal("100"))
        line_total = _q(line_subtotal + tax_amount)

        line_results.append(
            {
                "quantity": qty,
                "unit_price": price,
                "unit_cost": cost,
                "discount_percent": disc_pct,
                "discount_amount": disc_amt,
                "tax_percent": tax_pct,
                "tax_amount": tax_amount,
                "line_subtotal": line_subtotal,
                "line_total": line_total,
            }
        )

        subtotal += line_subtotal
        total_discount += disc_amt
        total_tax += tax_amount
        total_cost += _q(qty * cost)

        key = str(tax_pct)
        slot = breakup.setdefault(key, {"rate": tax_pct, "base": ZERO, "tax": ZERO})
        slot["base"] += line_subtotal
        slot["tax"] += tax_amount

    subtotal = _q(subtotal)
    total_discount = _q(total_discount)
    total_tax = _q(total_tax)
    grand_total = _q(subtotal + total_tax + freight_amount + other_charges)

    gross_margin_percent: Decimal | None = None
    if subtotal > ZERO:
        margin = subtotal - total_cost
        gross_margin_percent = _q(margin * Decimal("100") / subtotal)

    tax_breakup = [
        {"rate": v["rate"], "base": _q(v["base"]), "tax": _q(v["tax"])}
        for v in breakup.values()
    ]

    return {
        "subtotal": subtotal,
        "total_discount": total_discount,
        "total_tax": total_tax,
        "freight_amount": freight_amount,
        "other_charges": other_charges,
        "grand_total": grand_total,
        "gross_margin_percent": gross_margin_percent,
        "lines": line_results,
        "tax_breakup": tax_breakup,
    }
