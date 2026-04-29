"""Customer dedupe + merge service."""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Iterable

from django.db import transaction
from django.utils import timezone

from .models import Address, Contact, Customer


# ---------------------------------------------------------------------------
# Dedupe / search
# ---------------------------------------------------------------------------
def find_matches(
    *, mobile: str = "", email: str = "", gst: str = "", exclude_id: int | None = None
) -> list[dict]:
    """Return Customer rows matching any of the given criteria, with reasons."""
    qs = Customer.objects.all()
    if exclude_id:
        qs = qs.exclude(id=exclude_id)

    matches: dict[int, dict] = {}

    def _add(c: Customer, reason: str) -> None:
        entry = matches.setdefault(c.id, {"obj": c, "match_reasons": []})
        if reason not in entry["match_reasons"]:
            entry["match_reasons"].append(reason)

    if mobile:
        for c in qs.filter(mobile=mobile):
            _add(c, "mobile")
        for c in qs.filter(alternate_mobile=mobile):
            _add(c, "alternate_mobile")
    if email:
        for c in qs.filter(email__iexact=email):
            _add(c, "email")
    if gst:
        for c in qs.filter(gst_number__iexact=gst):
            _add(c, "gst")

    return [
        {**_serialize_summary(entry["obj"]), "match_reasons": entry["match_reasons"]}
        for entry in matches.values()
    ]


def _serialize_summary(c: Customer) -> dict:
    return {
        "id": c.id,
        "company_name": c.company_name,
        "mobile": c.mobile,
        "email": c.email,
        "gst_number": c.gst_number,
        "city": c.city,
        "status": c.status,
    }


# ---------------------------------------------------------------------------
# Merge
# ---------------------------------------------------------------------------
@dataclass
class MergePreview:
    source_id: int
    target_id: int
    conflicts: list[dict]
    impact_counts: dict[str, int]
    preview_hash: str


# Field-level conflict candidates. Multi-value sets (contacts/addresses) are
# always "both" — we union them.
SCALAR_FIELDS = (
    "company_name",
    "contact_person_name",
    "mobile",
    "alternate_mobile",
    "email",
    "gst_number",
    "pan_number",
    "address_line1",
    "address_line2",
    "city",
    "state",
    "pincode",
    "territory",
    "credit_limit",
    "credit_days",
    "notes",
)

# (related_name, label)
RELATED_FK_REASSIGNMENTS: tuple[tuple[str, str], ...] = (
    ("contacts", "contacts"),
    ("addresses", "addresses"),
    ("inquiries", "inquiries"),
    ("quotations", "quotations"),
    ("sales_orders", "sales_orders"),
    ("dispatch_challans", "dispatch_challans"),
    ("installation_jobs", "installation_jobs"),
)


def _impact_counts(source: Customer) -> dict[str, int]:
    counts: dict[str, int] = {}
    for related_name, label in RELATED_FK_REASSIGNMENTS:
        manager = getattr(source, related_name, None)
        counts[label] = manager.count() if manager is not None else 0
    return counts


def _hash_state(source: Customer, target: Customer) -> str:
    payload = {
        "src": {f: str(getattr(source, f) or "") for f in SCALAR_FIELDS}
        | {"updated_at": source.updated_at.isoformat()},
        "tgt": {f: str(getattr(target, f) or "") for f in SCALAR_FIELDS}
        | {"updated_at": target.updated_at.isoformat()},
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]


def merge_preview(source_id: int, target_id: int) -> MergePreview:
    source = Customer.objects.get(pk=source_id)
    target = Customer.objects.get(pk=target_id)
    if source.id == target.id:
        raise ValueError("Source and target must differ.")
    if source.status == "merged" or target.status == "merged":
        raise ValueError("Cannot preview merge — one side is already merged.")

    conflicts = []
    for f in SCALAR_FIELDS:
        sv = getattr(source, f)
        tv = getattr(target, f)
        if sv and tv and sv != tv:
            conflicts.append({"field": f, "source": str(sv), "target": str(tv)})

    return MergePreview(
        source_id=source.id,
        target_id=target.id,
        conflicts=conflicts,
        impact_counts=_impact_counts(source),
        preview_hash=_hash_state(source, target),
    )


@transaction.atomic
def perform_merge(
    *,
    source_id: int,
    target_id: int,
    preview_hash: str,
    field_choices: dict[str, str] | None = None,
    actor=None,
) -> dict:
    field_choices = field_choices or {}

    # Lock both rows.
    source = Customer.objects.select_for_update().get(pk=source_id)
    target = Customer.objects.select_for_update().get(pk=target_id)

    if source.id == target.id:
        raise ValueError("Source and target must differ.")
    if source.status == "merged" or target.status == "merged":
        raise ValueError("CHAINED_MERGE")

    # Re-compute hash; reject if data changed mid-flow.
    current_hash = _hash_state(source, target)
    if current_hash != preview_hash:
        raise ValueError("HASH_MISMATCH")

    # Apply scalar choices: default keep target unless explicit "source".
    update_fields: list[str] = []
    for field, choice in field_choices.items():
        if field not in SCALAR_FIELDS:
            continue
        if choice == "source":
            setattr(target, field, getattr(source, field))
            update_fields.append(field)
        # "target" or "both" → no scalar change.
    if update_fields:
        target.save(update_fields=update_fields)

    # Reassign FK references.
    moved: dict[str, int] = {}
    Contact.objects.filter(customer=source).update(customer=target)
    Address.objects.filter(customer=source).update(customer=target)
    moved["contacts"] = Contact.objects.filter(customer=target).count()
    moved["addresses"] = Address.objects.filter(customer=target).count()

    # Other related models — guarded so unmigrated apps are skipped gracefully.
    for related_name, label in RELATED_FK_REASSIGNMENTS:
        if label in ("contacts", "addresses"):
            continue
        manager = getattr(source, related_name, None)
        if manager is None:
            moved[label] = 0
            continue
        count = manager.count()
        manager.update(customer=target)  # type: ignore[attr-defined]
        moved[label] = count

    # Mark source merged.
    source.status = "merged"
    source.merged_into_id = target.id  # type: ignore[attr-defined]
    source.save(update_fields=["status", "merged_into"])

    # Audit log
    try:
        from apps.auth_ext.models import AuditLog

        AuditLog.objects.create(
            user=actor if getattr(actor, "is_authenticated", False) else None,
            module="customers",
            action="merge",
            entity_type="customer",
            entity_id=source.id,
            new_data={
                "merged_into": target.id,
                "moved": moved,
                "field_choices": field_choices,
            },
        )
    except Exception:  # pragma: no cover — never block merge on audit
        pass

    return {"merged_into": target.id, "moved": moved}
