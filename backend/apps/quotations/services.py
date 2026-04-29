"""Quotation services (Step 06a) — numbering, pricing, status, versions, conversion."""
from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from typing import Iterable

from django.db import transaction
from django.utils import timezone

from apps.core.numbering import consume_next

from . import approvals, pricing
from .models import (
    Quotation,
    QuotationActivityLog,
    QuotationApprovalStep,
    QuotationCommunicationLog,
    QuotationItem,
)


# ---------------------------------------------------------------------------
# Numbering
# ---------------------------------------------------------------------------
def next_quotation_number() -> str:
    return consume_next("QUO")


def next_order_number() -> str:
    return consume_next("SO")


# ---------------------------------------------------------------------------
# Activity log
# ---------------------------------------------------------------------------
def log_activity(
    quotation: Quotation,
    *,
    action_type: str,
    user,
    old_value: str = "",
    new_value: str = "",
    remarks: str = "",
) -> QuotationActivityLog:
    return QuotationActivityLog.objects.create(
        quotation=quotation,
        action_type=action_type,
        old_value=old_value or "",
        new_value=new_value or "",
        remarks=remarks or "",
        performed_by=user,
        performed_at=timezone.now(),
    )


# ---------------------------------------------------------------------------
# Status machine
# ---------------------------------------------------------------------------
TRANSITIONS: dict[str, set[str]] = {
    Quotation.Status.DRAFT: {
        Quotation.Status.PENDING_APPROVAL,
        Quotation.Status.SENT,        # allow direct send when no approval needed
        Quotation.Status.EXPIRED,
    },
    Quotation.Status.PENDING_APPROVAL: {
        Quotation.Status.APPROVED,
        Quotation.Status.REJECTED,
        Quotation.Status.DRAFT,       # revoke
    },
    Quotation.Status.APPROVED: {
        Quotation.Status.SENT,
        Quotation.Status.EXPIRED,
    },
    Quotation.Status.SENT: {
        Quotation.Status.ACCEPTED,
        Quotation.Status.REJECTED,
        Quotation.Status.EXPIRED,
        Quotation.Status.CONVERTED,
    },
    Quotation.Status.ACCEPTED: {
        Quotation.Status.CONVERTED,
        Quotation.Status.EXPIRED,
    },
    Quotation.Status.REJECTED: set(),
    Quotation.Status.EXPIRED: set(),
    Quotation.Status.CONVERTED: set(),
}

LOCKED_STATUSES = {
    Quotation.Status.SENT,
    Quotation.Status.ACCEPTED,
    Quotation.Status.APPROVED,
    Quotation.Status.CONVERTED,
}


class StatusTransitionError(Exception):
    pass


class ConversionError(Exception):
    pass


def assert_can_transition(current: str, target: str) -> None:
    allowed = TRANSITIONS.get(current, set())
    if target not in allowed:
        raise StatusTransitionError(f"cannot move {current} → {target}")


# ---------------------------------------------------------------------------
# Pricing — recompute totals + persist on items
# ---------------------------------------------------------------------------
def recompute(quotation: Quotation, *, user=None) -> Quotation:
    """Recompute totals from current items + freight + other_charges. Persists."""
    items = list(quotation.items.select_related("tax_rule").all())
    line_inputs = []
    for it in items:
        tax_pct = it.tax_rule.rate_percent if it.tax_rule_id else Decimal("0")
        line_inputs.append(
            {
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "unit_cost": it.unit_cost,
                "discount_percent": it.discount_percent,
                "discount_amount": it.discount_amount,
                "tax_percent": tax_pct,
            }
        )
    totals = pricing.calculate(
        line_inputs,
        freight_amount=quotation.freight_amount,
        other_charges=quotation.other_charges,
    )
    # Persist line numbers
    for it, lr in zip(items, totals["lines"]):
        it.discount_amount = lr["discount_amount"]
        it.tax_amount = lr["tax_amount"]
        it.line_total = lr["line_total"]
        it.save(update_fields=["discount_amount", "tax_amount", "line_total", "updated_at"])

    quotation.subtotal = totals["subtotal"]
    quotation.total_discount = totals["total_discount"]
    quotation.total_tax = totals["total_tax"]
    quotation.grand_total = totals["grand_total"]
    quotation.gross_margin_percent = totals["gross_margin_percent"]
    if user is not None and getattr(user, "is_authenticated", False):
        quotation.updated_by = user
    quotation.save(update_fields=[
        "subtotal", "total_discount", "total_tax",
        "grand_total", "gross_margin_percent", "updated_by", "updated_at",
    ])
    return quotation


def compute_overall_discount_percent(quotation: Quotation) -> Decimal:
    items = quotation.items.all()
    if not items:
        return Decimal("0")
    gross = Decimal("0")
    disc = Decimal("0")
    for it in items:
        gross += Decimal(it.quantity) * Decimal(it.unit_price)
        disc += Decimal(it.discount_amount or 0)
    if gross <= Decimal("0"):
        return Decimal("0")
    return (disc * Decimal("100") / gross).quantize(Decimal("0.01"))


# ---------------------------------------------------------------------------
# Approvals — submit / approve / reject
# ---------------------------------------------------------------------------
@transaction.atomic
def submit_for_approval(quotation: Quotation, *, user) -> list[QuotationApprovalStep]:
    if quotation.status != Quotation.Status.DRAFT:
        raise StatusTransitionError(f"cannot submit from {quotation.status}")
    recompute(quotation, user=user)
    discount_pct = compute_overall_discount_percent(quotation)
    reqs = approvals.determine_requirements(
        discount_percent=discount_pct,
        gross_margin_percent=quotation.gross_margin_percent,
        grand_total=quotation.grand_total,
    )
    approver_pairs = approvals.resolve_approver_ids(reqs)
    if not approver_pairs:
        # No approval needed — auto-approve
        quotation.status = Quotation.Status.APPROVED
        quotation.approved_by = user if getattr(user, "is_authenticated", False) else None
        quotation.approved_at = timezone.now()
        quotation.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])
        log_activity(
            quotation, action_type="auto_approved", user=user,
            new_value=Quotation.Status.APPROVED,
        )
        return []

    QuotationApprovalStep.objects.filter(quotation=quotation).delete()
    steps: list[QuotationApprovalStep] = []
    for idx, (approver_id, reason) in enumerate(approver_pairs, start=1):
        steps.append(
            QuotationApprovalStep.objects.create(
                quotation=quotation,
                step_order=idx,
                approver_id=approver_id,
                status=QuotationApprovalStep.Status.PENDING,
                condition_type=reason,
                created_by=user if getattr(user, "is_authenticated", False) else None,
                updated_by=user if getattr(user, "is_authenticated", False) else None,
            )
        )
    quotation.status = Quotation.Status.PENDING_APPROVAL
    quotation.save(update_fields=["status", "updated_at"])
    log_activity(
        quotation, action_type="submitted_for_approval", user=user,
        new_value=str(len(steps)),
    )
    return steps


@transaction.atomic
def approve(quotation: Quotation, *, user, comments: str = "") -> Quotation:
    if quotation.status != Quotation.Status.PENDING_APPROVAL:
        raise StatusTransitionError(f"cannot approve from {quotation.status}")
    pending = quotation.approval_steps.filter(status=QuotationApprovalStep.Status.PENDING).order_by("step_order")
    step = pending.first()
    if step is None:
        raise StatusTransitionError("no pending approval step")
    if step.approver_id != getattr(user, "id", None):
        raise StatusTransitionError("user is not the next approver")
    step.status = QuotationApprovalStep.Status.APPROVED
    step.action_at = timezone.now()
    step.comments = comments or ""
    step.save(update_fields=["status", "action_at", "comments", "updated_at"])

    remaining = quotation.approval_steps.filter(status=QuotationApprovalStep.Status.PENDING).count()
    if remaining == 0:  # this was the last
        assert_can_transition(quotation.status, Quotation.Status.APPROVED)
        quotation.status = Quotation.Status.APPROVED
        quotation.approved_by = user
        quotation.approved_at = timezone.now()
        quotation.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])
        log_activity(quotation, action_type="approved", user=user)
    else:
        log_activity(quotation, action_type="approval_step_passed", user=user, new_value=str(step.step_order))
    return quotation


@transaction.atomic
def reject(quotation: Quotation, *, user, comments: str) -> Quotation:
    if quotation.status != Quotation.Status.PENDING_APPROVAL:
        raise StatusTransitionError(f"cannot reject from {quotation.status}")
    if not comments:
        raise StatusTransitionError("comments required for reject")
    step = quotation.approval_steps.filter(
        status=QuotationApprovalStep.Status.PENDING
    ).order_by("step_order").first()
    if step is None or step.approver_id != getattr(user, "id", None):
        raise StatusTransitionError("user is not the next approver")
    step.status = QuotationApprovalStep.Status.REJECTED
    step.action_at = timezone.now()
    step.comments = comments
    step.save(update_fields=["status", "action_at", "comments", "updated_at"])

    quotation.status = Quotation.Status.REJECTED
    quotation.save(update_fields=["status", "updated_at"])
    log_activity(quotation, action_type="rejected", user=user, remarks=comments)
    return quotation


# ---------------------------------------------------------------------------
# Send / clone / convert / version
# ---------------------------------------------------------------------------
@transaction.atomic
def send_quotation(
    quotation: Quotation,
    *,
    user,
    channel: str = "email",
    to_address: str = "",
    subject: str = "",
    body: str = "",
) -> QuotationCommunicationLog:
    if quotation.status not in (Quotation.Status.APPROVED, Quotation.Status.DRAFT, Quotation.Status.SENT):
        raise StatusTransitionError(f"cannot send from {quotation.status}")
    # Allow re-send while sent
    if quotation.status != Quotation.Status.SENT:
        assert_can_transition(quotation.status, Quotation.Status.SENT)
        quotation.status = Quotation.Status.SENT
    quotation.sent_at = timezone.now()
    quotation.save(update_fields=["status", "sent_at", "updated_at"])
    log = QuotationCommunicationLog.objects.create(
        quotation=quotation,
        channel=channel,
        to_address=to_address,
        subject=subject,
        body=body,
        sent_at=timezone.now(),
        sent_by=user,
    )
    log_activity(quotation, action_type="sent", user=user, new_value=channel)
    return log


@transaction.atomic
def clone_quotation(quotation: Quotation, *, user) -> Quotation:
    new = Quotation.objects.create(
        quotation_number=next_quotation_number(),
        version_number=1,
        inquiry=quotation.inquiry,
        customer=quotation.customer,
        contact=quotation.contact,
        billing_address=quotation.billing_address,
        shipping_address=quotation.shipping_address,
        site_address=quotation.site_address,
        project_name=quotation.project_name,
        quotation_date=timezone.now().date(),
        valid_until=timezone.now().date() + timedelta(days=30),
        status=Quotation.Status.DRAFT,
        prepared_by=user if getattr(user, "is_authenticated", False) else quotation.prepared_by,
        currency=quotation.currency,
        freight_amount=quotation.freight_amount,
        other_charges=quotation.other_charges,
        payment_terms=quotation.payment_terms,
        delivery_terms=quotation.delivery_terms,
        warranty_terms=quotation.warranty_terms,
        scope_of_supply=quotation.scope_of_supply,
        exclusions=quotation.exclusions,
        notes=quotation.notes,
        created_by=user if getattr(user, "is_authenticated", False) else None,
        updated_by=user if getattr(user, "is_authenticated", False) else None,
    )
    for it in quotation.items.all():
        QuotationItem.objects.create(
            quotation=new,
            product=it.product,
            product_code=it.product_code,
            product_description=it.product_description,
            brand=it.brand,
            model_number=it.model_number,
            specifications=it.specifications,
            quantity=it.quantity,
            unit=it.unit,
            unit_cost=it.unit_cost,
            unit_price=it.unit_price,
            discount_percent=it.discount_percent,
            discount_amount=it.discount_amount,
            tax_rule=it.tax_rule,
            tax_amount=it.tax_amount,
            line_total=it.line_total,
            sort_order=it.sort_order,
            notes=it.notes,
            created_by=user if getattr(user, "is_authenticated", False) else None,
            updated_by=user if getattr(user, "is_authenticated", False) else None,
        )
    recompute(new, user=user)
    log_activity(new, action_type="cloned_from", user=user, new_value=quotation.quotation_number)
    return new


@transaction.atomic
def new_version(quotation: Quotation, *, user) -> Quotation:
    """Create a new version (parent_quotation=this) starting from latest version's data."""
    base = quotation
    new = Quotation.objects.create(
        quotation_number=base.quotation_number,
        version_number=base.version_number + 1,
        inquiry=base.inquiry,
        customer=base.customer,
        contact=base.contact,
        billing_address=base.billing_address,
        shipping_address=base.shipping_address,
        site_address=base.site_address,
        project_name=base.project_name,
        quotation_date=timezone.now().date(),
        valid_until=base.valid_until,
        status=Quotation.Status.DRAFT,
        prepared_by=user if getattr(user, "is_authenticated", False) else base.prepared_by,
        parent_quotation=base,
        currency=base.currency,
        freight_amount=base.freight_amount,
        other_charges=base.other_charges,
        payment_terms=base.payment_terms,
        delivery_terms=base.delivery_terms,
        warranty_terms=base.warranty_terms,
        scope_of_supply=base.scope_of_supply,
        exclusions=base.exclusions,
        notes=base.notes,
        created_by=user if getattr(user, "is_authenticated", False) else None,
        updated_by=user if getattr(user, "is_authenticated", False) else None,
    )
    for it in base.items.all():
        QuotationItem.objects.create(
            quotation=new,
            product=it.product,
            product_code=it.product_code,
            product_description=it.product_description,
            brand=it.brand,
            model_number=it.model_number,
            specifications=it.specifications,
            quantity=it.quantity,
            unit=it.unit,
            unit_cost=it.unit_cost,
            unit_price=it.unit_price,
            discount_percent=it.discount_percent,
            discount_amount=it.discount_amount,
            tax_rule=it.tax_rule,
            tax_amount=it.tax_amount,
            line_total=it.line_total,
            sort_order=it.sort_order,
            notes=it.notes,
            created_by=user if getattr(user, "is_authenticated", False) else None,
            updated_by=user if getattr(user, "is_authenticated", False) else None,
        )
    recompute(new, user=user)
    log_activity(new, action_type="version_created", user=user, new_value=str(new.version_number))
    return new


@transaction.atomic
def convert_to_order(quotation: Quotation, *, user):
    from apps.orders.models import SalesOrder, SalesOrderItem

    if quotation.status == Quotation.Status.CONVERTED:
        raise ConversionError("quotation already converted")
    if quotation.status not in (Quotation.Status.SENT, Quotation.Status.ACCEPTED, Quotation.Status.APPROVED):
        raise ConversionError(f"cannot convert from status={quotation.status}")

    order = SalesOrder.objects.create(
        order_number=next_order_number(),
        quotation=quotation,
        customer=quotation.customer,
        contact=quotation.contact,
        billing_address=quotation.billing_address,
        shipping_address=quotation.shipping_address,
        project_name=quotation.project_name,
        status=SalesOrder.Status.DRAFT,
        order_date=timezone.now().date(),
        payment_terms=quotation.payment_terms,
        delivery_terms=quotation.delivery_terms,
        subtotal=quotation.subtotal,
        total_discount=quotation.total_discount,
        total_tax=quotation.total_tax,
        freight_amount=quotation.freight_amount,
        grand_total=quotation.grand_total,
        created_by=user if getattr(user, "is_authenticated", False) else None,
        updated_by=user if getattr(user, "is_authenticated", False) else None,
    )
    for it in quotation.items.all():
        SalesOrderItem.objects.create(
            order=order,
            product=it.product,
            product_description=it.product_description,
            quantity_ordered=it.quantity,
            quantity_pending=it.quantity,
            unit=it.unit,
            unit_price=it.unit_price,
            discount_percent=it.discount_percent,
            tax_rule=it.tax_rule,
            line_total=it.line_total,
            created_by=user if getattr(user, "is_authenticated", False) else None,
            updated_by=user if getattr(user, "is_authenticated", False) else None,
        )

    quotation.status = Quotation.Status.CONVERTED
    quotation.save(update_fields=["status", "updated_at"])
    log_activity(
        quotation, action_type="converted_to_order", user=user,
        new_value=order.order_number,
    )
    return order


# ---------------------------------------------------------------------------
# Expiry job
# ---------------------------------------------------------------------------
def expire_due() -> int:
    today = timezone.now().date()
    qs = Quotation.objects.filter(
        valid_until__lt=today,
    ).exclude(status__in=[
        Quotation.Status.EXPIRED,
        Quotation.Status.CONVERTED,
        Quotation.Status.REJECTED,
    ])
    count = 0
    for q in qs:
        q.status = Quotation.Status.EXPIRED
        q.save(update_fields=["status", "updated_at"])
        log_activity(q, action_type="expired", user=None) if False else None
        QuotationActivityLog.objects.create(
            quotation=q,
            action_type="expired",
            old_value="",
            new_value=Quotation.Status.EXPIRED,
            remarks="auto-expired",
            performed_by_id=q.prepared_by_id,
            performed_at=timezone.now(),
        )
        count += 1
    return count
