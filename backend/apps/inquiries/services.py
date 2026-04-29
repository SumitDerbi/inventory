"""Inquiry services (Step 05a) — numbering, status machine, activity, conversion."""
from __future__ import annotations

from datetime import timedelta
from typing import Iterable

from django.db import transaction
from django.utils import timezone

from apps.core.numbering import consume_next

from .models import Inquiry, InquiryActivityLog


# ---------------------------------------------------------------------------
# Numbering
# ---------------------------------------------------------------------------
def next_inquiry_number() -> str:
    return consume_next("INQ")


def next_quotation_number() -> str:
    return consume_next("QUO")


# ---------------------------------------------------------------------------
# Activity log
# ---------------------------------------------------------------------------
def log_activity(
    inquiry: Inquiry,
    *,
    action_type: str,
    user,
    old_value: str = "",
    new_value: str = "",
    remarks: str = "",
) -> InquiryActivityLog:
    return InquiryActivityLog.objects.create(
        inquiry=inquiry,
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
    Inquiry.Status.NEW: {
        Inquiry.Status.IN_PROGRESS,
        Inquiry.Status.ON_HOLD,
        Inquiry.Status.LOST,
    },
    Inquiry.Status.IN_PROGRESS: {
        Inquiry.Status.QUOTED,
        Inquiry.Status.ON_HOLD,
        Inquiry.Status.LOST,
    },
    Inquiry.Status.QUOTED: {
        Inquiry.Status.CONVERTED,
        Inquiry.Status.LOST,
        Inquiry.Status.ON_HOLD,
    },
    Inquiry.Status.ON_HOLD: {
        Inquiry.Status.IN_PROGRESS,
        Inquiry.Status.LOST,
    },
    Inquiry.Status.CONVERTED: set(),
    Inquiry.Status.LOST: set(),
}


class StatusTransitionError(Exception):
    pass


def assert_can_transition(current: str, target: str) -> None:
    if current == target:
        raise StatusTransitionError(f"already {target}")
    allowed = TRANSITIONS.get(current, set())
    if target not in allowed:
        raise StatusTransitionError(f"cannot move {current} → {target}")


def apply_status(
    inquiry: Inquiry,
    *,
    new_status: str,
    user,
    lost_reason: str = "",
) -> Inquiry:
    assert_can_transition(inquiry.status, new_status)
    if new_status == Inquiry.Status.LOST and not lost_reason:
        raise StatusTransitionError("lost_reason required")

    old = inquiry.status
    inquiry.status = new_status
    if new_status == Inquiry.Status.LOST:
        inquiry.lost_reason = lost_reason
    inquiry.updated_by = user if getattr(user, "is_authenticated", False) else None
    inquiry.save(update_fields=["status", "lost_reason", "updated_by", "updated_at"])
    log_activity(
        inquiry,
        action_type="status_changed",
        user=user,
        old_value=old,
        new_value=new_status,
        remarks=lost_reason,
    )
    return inquiry


# ---------------------------------------------------------------------------
# Dedupe
# ---------------------------------------------------------------------------
def find_duplicate_inquiries(
    *,
    mobile: str = "",
    email: str = "",
    project_name: str = "",
    exclude_id: int | None = None,
) -> list[dict]:
    qs = Inquiry.objects.none()
    if mobile:
        qs = qs | Inquiry.objects.filter(mobile=mobile)
    if email:
        qs = qs | Inquiry.objects.filter(email__iexact=email)
    if project_name:
        qs = qs | Inquiry.objects.filter(project_name__iexact=project_name)
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    out: list[dict] = []
    for row in qs.distinct()[:25]:
        reasons = []
        if mobile and row.mobile == mobile:
            reasons.append("mobile")
        if email and row.email and row.email.lower() == email.lower():
            reasons.append("email")
        if project_name and row.project_name and row.project_name.lower() == project_name.lower():
            reasons.append("project_name")
        out.append(
            {
                "id": row.id,
                "inquiry_number": row.inquiry_number,
                "customer_name": row.customer_name,
                "match_reasons": reasons,
            }
        )
    return out


# ---------------------------------------------------------------------------
# Convert to quotation
# ---------------------------------------------------------------------------
class ConversionError(Exception):
    pass


@transaction.atomic
def convert_to_quotation(inquiry: Inquiry, *, user):
    from apps.quotations.models import Quotation, QuotationItem

    if inquiry.status == Inquiry.Status.CONVERTED:
        raise ConversionError("inquiry already converted")
    if inquiry.customer_id is None:
        raise ConversionError("inquiry must have a customer before conversion")

    today = timezone.now().date()
    quotation = Quotation.objects.create(
        quotation_number=next_quotation_number(),
        version_number=1,
        inquiry=inquiry,
        customer=inquiry.customer,
        project_name=inquiry.project_name or "",
        quotation_date=today,
        valid_until=today + timedelta(days=30),
        status=Quotation.Status.DRAFT,
        prepared_by=user,
        created_by=user,
        updated_by=user,
    )
    for li in inquiry.line_items.all():
        QuotationItem.objects.create(
            quotation=quotation,
            product=li.product,
            product_description=li.product_description,
            quantity=li.quantity,
            unit=li.unit or "nos",
            unit_cost=0,
            unit_price=li.estimated_value or 0,
            line_total=(li.estimated_value or 0) * li.quantity,
            specifications=li.specification_notes or "",
            notes=li.notes or "",
            created_by=user,
            updated_by=user,
        )

    inquiry.status = Inquiry.Status.CONVERTED
    inquiry.updated_by = user
    inquiry.save(update_fields=["status", "updated_by", "updated_at"])
    log_activity(
        inquiry,
        action_type="converted_to_quotation",
        user=user,
        new_value=quotation.quotation_number,
    )
    return quotation


# ---------------------------------------------------------------------------
# Bulk helpers
# ---------------------------------------------------------------------------
def bulk_assign(inquiry_ids: Iterable[int], user_id: int, *, actor) -> dict:
    from apps.auth_ext.models import User

    target = User.objects.filter(id=user_id).first()
    if target is None:
        return {"failed": [{"id": i, "reason": "user_not_found"} for i in inquiry_ids], "succeeded": []}

    succeeded: list[int] = []
    failed: list[dict] = []
    for inq in Inquiry.objects.filter(id__in=list(inquiry_ids)):
        old = inq.assigned_to_id
        inq.assigned_to = target
        inq.updated_by = actor if getattr(actor, "is_authenticated", False) else None
        inq.save(update_fields=["assigned_to", "updated_by", "updated_at"])
        log_activity(
            inq,
            action_type="assigned",
            user=actor,
            old_value=str(old or ""),
            new_value=str(user_id),
        )
        succeeded.append(inq.id)
    seen = set(succeeded)
    for i in inquiry_ids:
        if i not in seen:
            failed.append({"id": i, "reason": "not_found"})
    return {"succeeded": succeeded, "failed": failed}


def bulk_change_status(
    inquiry_ids: Iterable[int],
    new_status: str,
    *,
    actor,
    lost_reason: str = "",
) -> dict:
    succeeded: list[int] = []
    failed: list[dict] = []
    found = {inq.id: inq for inq in Inquiry.objects.filter(id__in=list(inquiry_ids))}
    for i in inquiry_ids:
        inq = found.get(i)
        if inq is None:
            failed.append({"id": i, "reason": "not_found"})
            continue
        try:
            apply_status(inq, new_status=new_status, user=actor, lost_reason=lost_reason)
            succeeded.append(inq.id)
        except StatusTransitionError as exc:
            failed.append({"id": i, "reason": str(exc)})
    return {"succeeded": succeeded, "failed": failed}
