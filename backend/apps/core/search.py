"""Step 04c: Global staff search.

A pluggable registry that lets each module describe how to:
- query its model with `?q=` (a list of `searchable_fields` with weights),
- format the result row (title, subtitle, href).

Backend: SQL `ILIKE`. Score = field_weight * (1.0 if prefix match else 0.5).
RBAC: filtered through each entry's `queryset_for_user(user)` callable so a
user only sees what they can list elsewhere.

Adding a new resource later is one `register(...)` call — see the bottom
of this module for the foundation set (customers + inquiries + quotations
+ orders + jobs + documents).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Iterable

from django.db.models import Model, Q, QuerySet


@dataclass
class SearchEntry:
    type: str  # public type label, e.g. "inquiry"
    model: type[Model]
    fields: list[tuple[str, float]]  # [(field_name, weight)]
    title: Callable[[Model], str]
    subtitle: Callable[[Model], str]
    href: Callable[[Model], str]
    queryset_for_user: Callable[[object], QuerySet] | None = None
    permission: str | None = None  # e.g. "inquiry.list" — uses HasRolePermission code


@dataclass
class SearchRegistry:
    entries: dict[str, SearchEntry] = field(default_factory=dict)

    def register(self, entry: SearchEntry) -> None:
        self.entries[entry.type] = entry

    def types(self) -> list[str]:
        return list(self.entries.keys())

    def get(self, type_name: str) -> SearchEntry | None:
        return self.entries.get(type_name)


registry = SearchRegistry()


def _user_has_permission(user, code: str | None) -> bool:
    if code is None:
        return True
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.role_mappings.filter(
        role__is_active=True,
        role__role_permissions__permission__code=code,
    ).exists()


def _score(value: str, q: str, weight: float) -> float:
    v = (value or "").lower()
    qq = q.lower()
    if v.startswith(qq):
        return 1.0 * weight
    if qq in v:
        return 0.5 * weight
    return 0.0


def search(user, q: str, types: Iterable[str] | None = None, limit: int = 8) -> list[dict]:
    """Run the cross-module search and return scored, sorted result rows."""
    limit = max(1, min(int(limit or 8), 20))
    targets = [t for t in (types or registry.types()) if t in registry.entries]
    out: list[dict] = []

    for type_name in targets:
        entry = registry.entries[type_name]
        if not _user_has_permission(user, entry.permission):
            continue

        qs = entry.queryset_for_user(user) if entry.queryset_for_user else entry.model.objects.all()

        # Build OR filter across searchable fields (icontains).
        cond = Q()
        for fname, _w in entry.fields:
            cond |= Q(**{f"{fname}__icontains": q})
        qs = qs.filter(cond).distinct()[: limit * 3]  # over-fetch for scoring

        scored: list[tuple[float, str, Model]] = []
        for obj in qs:
            best = 0.0
            best_field = entry.fields[0][0]
            for fname, w in entry.fields:
                val = getattr(obj, fname, "") or ""
                s = _score(str(val), q, w)
                if s > best:
                    best = s
                    best_field = fname
            if best > 0:
                scored.append((best, best_field, obj))

        scored.sort(key=lambda x: x[0], reverse=True)
        for score_v, mfield, obj in scored[:limit]:
            out.append(
                {
                    "id": f"{type_name}_{obj.pk}",
                    "type": type_name,
                    "title": entry.title(obj),
                    "subtitle": entry.subtitle(obj),
                    "href": entry.href(obj),
                    "matched_field": mfield,
                    "score": round(score_v, 3),
                }
            )

    # Cross-type stable sort by score desc.
    out.sort(key=lambda r: r["score"], reverse=True)
    return out


# ---------------------------------------------------------------------------
# Foundation registrations — modules can extend later in their own AppConfig.
# Imported and invoked from `apps.core.apps.CoreConfig.ready()`.
# ---------------------------------------------------------------------------
def register_defaults() -> None:
    from apps.customers.models import Customer
    from apps.documents.models import Document
    from apps.inquiries.models import Inquiry
    from apps.jobs.models import InstallationJob
    from apps.orders.models import SalesOrder
    from apps.quotations.models import Quotation

    if registry.entries:
        return  # already registered

    # ---- Customer ----
    registry.register(SearchEntry(
        type="customer",
        model=Customer,
        fields=[("company_name", 1.0), ("mobile", 0.8), ("email", 0.7), ("gst_number", 0.6)],
        title=lambda c: c.company_name or f"Customer #{c.pk}",
        subtitle=lambda c: f"{c.get_customer_type_display() if hasattr(c, 'get_customer_type_display') else ''} · {c.status}".strip(" ·"),
        href=lambda c: f"/customers/{c.pk}",
        permission="customer.list",
    ))

    # ---- Inquiry ----
    registry.register(SearchEntry(
        type="inquiry",
        model=Inquiry,
        fields=[
            ("inquiry_number", 1.0),
            ("customer_name", 0.9),
            ("company_name", 0.8),
            ("project_name", 0.7),
            ("mobile", 0.6),
            ("email", 0.5),
        ],
        title=lambda i: f"{i.inquiry_number} — {i.customer_name or i.company_name or ''}".strip(" —"),
        subtitle=lambda i: f"Sales · {i.status} · {i.priority}",
        href=lambda i: f"/inquiries/{i.pk}",
        permission="inquiry.list",
    ))

    # ---- Quotation ----
    registry.register(SearchEntry(
        type="quotation",
        model=Quotation,
        fields=[("quotation_number", 1.0), ("project_name", 0.7)],
        title=lambda q: f"{q.quotation_number} — {q.customer.company_name if q.customer_id else ''}".rstrip(" —"),
        subtitle=lambda q: f"Sales · {q.status} · v{q.version_number}",
        href=lambda q: f"/quotations/{q.pk}",
        permission="quotation.list",
    ))

    # ---- Order ----
    registry.register(SearchEntry(
        type="order",
        model=SalesOrder,
        fields=[("order_number", 1.0), ("project_name", 0.7)],
        title=lambda o: f"{o.order_number} — {o.customer.company_name if o.customer_id else ''}".rstrip(" —"),
        subtitle=lambda o: f"Orders · {o.status}",
        href=lambda o: f"/orders/{o.pk}",
        permission="order.list",
    ))

    # ---- Service Job ----
    registry.register(SearchEntry(
        type="job",
        model=InstallationJob,
        fields=[("job_number", 1.0), ("site_contact_name", 0.6), ("site_contact_mobile", 0.5)],
        title=lambda j: f"{j.job_number} — {j.customer.company_name if j.customer_id else ''}".rstrip(" —"),
        subtitle=lambda j: f"Service · {j.job_type} · {j.status}",
        href=lambda j: f"/jobs/{j.pk}",
        permission="job.list",
    ))

    # ---- Document ----
    registry.register(SearchEntry(
        type="document",
        model=Document,
        fields=[("document_number", 1.0), ("file_name", 0.7), ("notes", 0.4)],
        title=lambda d: d.document_number or d.file_name or f"Document #{d.pk}",
        subtitle=lambda d: f"Documents · {d.sensitivity} · v{d.version}",
        href=lambda d: f"/documents/{d.pk}",
        permission="document.list",
    ))
