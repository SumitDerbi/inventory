# Step 04c — Global Search API (staff)

> Before this: [04b-settings-api.md](./04b-settings-api.md)
> Drives: Phase 1 [16-ui-gap-closure.md §16.1](../phase-1-static-ui/16-ui-gap-closure.md) — Topbar `Ctrl+K` palette.

---

## Endpoint

| Method | Path              | Purpose                   |
| ------ | ----------------- | ------------------------- |
| GET    | `/api/v1/search/` | cross-resource type-ahead |

### Query parameters

- `q` (required, min 2 chars) — search term.
- `type` (optional, comma-separated) — restrict to subset: `inquiry,quotation,order,job,document,customer`. Default = all.
- `limit` (optional, default 8 per type, hard cap 20).

### Response

```jsonc
{
  "results": [
    {
      "id": "inq_42",
      "type": "inquiry",
      "title": "INQ-2026-014 — Acme Pumps",
      "subtitle": "Sales · open · ₹12.4L",
      "href": "/inquiries/inq_42",
      "matched_field": "number",
      "score": 0.92,
    },
    // ...
  ],
  "took_ms": 18,
}
```

Frontend groups by `type` for display. `href` mirrors the route the SPA already uses.

---

## Implementation

- Each module exposes a `SearchableMixin` registering `searchable_fields`, `title_template`, `subtitle_template`, `href_template`. Registry in `apps/core/search/registry.py`.
- Default backend: SQL `ILIKE` across registered fields with stable score = `(prefix? 1.0 : 0.5) * field_weight`.
- Pluggable: when MySQL FULLTEXT or Meilisearch is later added, swap the backend without changing endpoint contract.
- Permission: results filtered through each module's standard queryset (RBAC honoured); a user only sees what they can list elsewhere.
- Throttle 30/min/user.

---

## Tests

- Two-character minimum: `q=a` → 400.
- RBAC: user with no `inquiry.list` permission gets zero inquiry rows even on exact match.
- Result limit honoured per type (`?type=inquiry&limit=3` returns ≤ 3 inquiry rows).
- Score ordering: prefix match outranks substring match.
- `href` round-trip: every returned `href` resolves to a real list/detail endpoint that returns 200 for the same user.

---

## Postman

- Folder `Search`: query for an inquiry number, customer name, document tag; assert at least one result of expected type.

---

## Verification

- [x] Coverage ≥ 85 %.
- [x] Search registry has at least one entry per module: inquiries, quotations, orders, jobs, documents, customers.
- [x] Response time < 100 ms p95 on the seed dataset.
- [x] Commit: `feat(api): global staff search`.

---

**Next:** [05-inquiries-api.md](./05-inquiries-api.md)
