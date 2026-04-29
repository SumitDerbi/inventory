"""Step 04b: Approvals Inbox aggregator.

Aggregates pending approval rows from multiple modules:
- QuotationApprovalStep (quotations)
- PurchaseApproval      (purchase: PR + PO)

Per-module approve/reject services land with their respective slices (steps 06+).
For now the action endpoints update the row status inline and stamp `acted_at`.
Bulk endpoints return 207 Multi-Status with per-item outcomes.
"""
from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


SLA_HOURS = {"high": 4, "normal": 24}


def _quotation_pending_qs():
    from apps.quotations.models import QuotationApprovalStep

    return QuotationApprovalStep.objects.filter(status=QuotationApprovalStep.Status.PENDING)


def _purchase_pending_qs():
    from apps.purchase.models import PurchaseApproval

    return PurchaseApproval.objects.filter(status=PurchaseApproval.Status.PENDING)


def _serialize_quotation_step(step) -> dict:
    return {
        "kind": "quotation",
        "id": step.id,
        "ref_id": step.quotation_id,
        "ref_label": getattr(step.quotation, "quotation_number", str(step.quotation_id)),
        "step_order": step.step_order,
        "approver_id": step.approver_id,
        "status": step.status,
        "created_at": step.created_at,
    }


def _serialize_purchase_approval(row) -> dict:
    kind = "pr" if row.entity_type == "purchase_requisition" else "po"
    return {
        "kind": kind,
        "id": row.id,
        "ref_id": row.entity_id,
        "ref_label": f"{row.entity_type}#{row.entity_id}",
        "level": row.level,
        "approver_id": row.approver_id,
        "status": row.status,
        "created_at": row.created_at,
    }


def _bucket(item: dict, now) -> str:
    age = now - item["created_at"]
    if age >= timedelta(hours=SLA_HOURS["normal"]):
        return "overdue"
    if age >= timedelta(hours=SLA_HOURS["high"]):
        return "warning"
    return "fresh"


def _all_inbox_items(user_id: int | None = None) -> list[dict]:
    items: list[dict] = []
    qs1 = _quotation_pending_qs().select_related("quotation")
    qs2 = _purchase_pending_qs()
    if user_id is not None:
        qs1 = qs1.filter(approver_id=user_id)
        qs2 = qs2.filter(approver_id=user_id)
    items += [_serialize_quotation_step(s) for s in qs1]
    items += [_serialize_purchase_approval(r) for r in qs2]
    items.sort(key=lambda x: x["created_at"])
    return items


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inbox(request):
    """Pending approvals assigned to current user."""
    items = _all_inbox_items(user_id=request.user.id)
    now = timezone.now()
    for it in items:
        it["sla_bucket"] = _bucket(it, now)
    return Response({"results": items, "count": len(items)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def history(request):
    """Approvals (any status) assigned to current user, most recent first."""
    from apps.quotations.models import QuotationApprovalStep
    from apps.purchase.models import PurchaseApproval

    qs1 = QuotationApprovalStep.objects.filter(approver=request.user).exclude(
        status=QuotationApprovalStep.Status.PENDING
    ).select_related("quotation").order_by("-action_at")[:100]
    qs2 = PurchaseApproval.objects.filter(approver=request.user).exclude(
        status=PurchaseApproval.Status.PENDING
    ).order_by("-acted_at")[:100]
    items = [_serialize_quotation_step(s) for s in qs1] + [_serialize_purchase_approval(r) for r in qs2]
    items.sort(key=lambda x: x.get("created_at"), reverse=True)
    return Response({"results": items, "count": len(items)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def kpis(request):
    """Counts split by SLA bucket for the current user's pending queue."""
    items = _all_inbox_items(user_id=request.user.id)
    now = timezone.now()
    buckets = {"fresh": 0, "warning": 0, "overdue": 0}
    by_kind: dict[str, int] = {}
    for it in items:
        buckets[_bucket(it, now)] += 1
        by_kind[it["kind"]] = by_kind.get(it["kind"], 0) + 1
    return Response({"total_pending": len(items), "by_bucket": buckets, "by_kind": by_kind})


# ---------------------------------------------------------------------------
# Action helpers
# ---------------------------------------------------------------------------
def _resolve(kind: str, pk: int):
    from apps.quotations.models import QuotationApprovalStep
    from apps.purchase.models import PurchaseApproval

    if kind == "quotation":
        return QuotationApprovalStep.objects.filter(pk=pk).first(), "quotation"
    if kind in ("pr", "purchase_requisition"):
        return PurchaseApproval.objects.filter(pk=pk, entity_type="purchase_requisition").first(), "purchase"
    if kind in ("po", "purchase_order"):
        return PurchaseApproval.objects.filter(pk=pk, entity_type="purchase_order").first(), "purchase"
    return None, None


def _act(row, family: str, decision: str, user, comments: str = "") -> tuple[bool, str]:
    """Apply approve/reject to a row. decision ∈ {'approve','reject'}."""
    if row is None:
        return False, "not_found"
    if row.approver_id != user.id and not (user.is_superuser or getattr(user, "role", "") == "admin"):
        return False, "forbidden"
    if row.status != row.Status.PENDING:
        return False, "already_actioned"
    row.status = row.Status.APPROVED if decision == "approve" else row.Status.REJECTED
    row.comments = comments or row.comments
    if family == "quotation":
        row.action_at = timezone.now()
        row.save(update_fields=["status", "action_at", "comments"])
    else:
        row.acted_at = timezone.now()
        row.save(update_fields=["status", "acted_at", "comments"])
    return True, "ok"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve(request, kind: str, pk: int):
    row, family = _resolve(kind, pk)
    ok, msg = _act(row, family, "approve", request.user, request.data.get("comments", ""))
    if not ok:
        codes = {"not_found": 404, "forbidden": 403, "already_actioned": 409}
        return Response({"detail": msg}, status=codes.get(msg, 400))
    return Response({"detail": "approved", "id": pk, "kind": kind})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject(request, kind: str, pk: int):
    row, family = _resolve(kind, pk)
    ok, msg = _act(row, family, "reject", request.user, request.data.get("comments", ""))
    if not ok:
        codes = {"not_found": 404, "forbidden": 403, "already_actioned": 409}
        return Response({"detail": msg}, status=codes.get(msg, 400))
    return Response({"detail": "rejected", "id": pk, "kind": kind})


def _bulk(request, decision: str):
    items = request.data.get("items") or []
    if not isinstance(items, list) or not items:
        return Response({"detail": "items[] required"}, status=400)
    outcomes = []
    for entry in items:
        kind = entry.get("kind")
        pk = entry.get("id")
        row, family = _resolve(kind, pk)
        ok, msg = _act(row, family, decision, request.user, entry.get("comments", ""))
        outcomes.append({"kind": kind, "id": pk, "ok": ok, "detail": msg})
    code = status.HTTP_207_MULTI_STATUS if any(not o["ok"] for o in outcomes) else status.HTTP_200_OK
    return Response({"results": outcomes}, status=code)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_approve(request):
    return _bulk(request, "approve")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_reject(request):
    return _bulk(request, "reject")
