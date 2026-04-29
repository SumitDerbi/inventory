"""Approval matrix engine for quotations (Step 06a).

Given quotation totals + heuristics, return list of required approver user_ids
in step order. Threshold rules (defaults; can be overridden via settings later):

- discount_percent > 10%       → manager approval
- discount_percent > 25%       → director approval (in addition)
- gross_margin_percent < 15%   → manager approval
- grand_total > 5,00,000       → manager approval
- grand_total > 25,00,000      → director approval

Manager / director users are picked from the User model:
- manager: is_staff=True
- director: is_superuser=True

If multiple matching users, the lowest-id is chosen for determinism.
The approval chain is de-duplicated and ordered manager → director.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class ApprovalRequirement:
    role: str  # "manager" | "director"
    reason: str


def determine_requirements(
    *,
    discount_percent: Decimal | float = 0,
    gross_margin_percent: Decimal | float | None = None,
    grand_total: Decimal | float = 0,
) -> list[ApprovalRequirement]:
    dp = Decimal(str(discount_percent or 0))
    gt = Decimal(str(grand_total or 0))
    gmp = (
        Decimal(str(gross_margin_percent))
        if gross_margin_percent is not None
        else None
    )

    reqs: list[ApprovalRequirement] = []
    if dp > Decimal("10"):
        reqs.append(ApprovalRequirement("manager", f"discount {dp}% > 10%"))
    if gmp is not None and gmp < Decimal("15"):
        reqs.append(ApprovalRequirement("manager", f"gross_margin {gmp}% < 15%"))
    if gt > Decimal("500000"):
        reqs.append(ApprovalRequirement("manager", f"grand_total {gt} > 500000"))
    if dp > Decimal("25"):
        reqs.append(ApprovalRequirement("director", f"discount {dp}% > 25%"))
    if gt > Decimal("2500000"):
        reqs.append(ApprovalRequirement("director", f"grand_total {gt} > 2500000"))

    # de-dup by role, preserve order
    seen: set[str] = set()
    deduped: list[ApprovalRequirement] = []
    for r in reqs:
        if r.role in seen:
            continue
        seen.add(r.role)
        deduped.append(r)
    # sort manager → director
    order = {"manager": 0, "director": 1}
    deduped.sort(key=lambda r: order.get(r.role, 99))
    return deduped


def resolve_approver_ids(reqs: list[ApprovalRequirement]) -> list[tuple[int, str]]:
    """Resolve required roles to concrete user IDs. Returns [(user_id, reason)]."""
    from apps.auth_ext.models import User

    out: list[tuple[int, str]] = []
    for r in reqs:
        qs = User.objects.filter(is_active=True)
        if r.role == "manager":
            qs = qs.filter(is_staff=True, is_superuser=False)
        elif r.role == "director":
            qs = qs.filter(is_superuser=True)
        u = qs.order_by("id").first()
        if u is None:
            # fallback: any superuser; if none, skip
            u = User.objects.filter(is_active=True, is_superuser=True).order_by("id").first()
        if u is None:
            continue
        out.append((u.id, r.reason))
    return out
