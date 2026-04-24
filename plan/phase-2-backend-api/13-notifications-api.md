# Step 13 — Notifications API + Background Jobs

> Before this: [12-reports-api.md](./12-reports-api.md)

---

## Scope

- In-app notifications table already exists.
- This step wires **producers** (domain events → notification rows) and **delivery channels** (in-app, email, optional WhatsApp/SMS).

---

## Endpoints

| Method | Path                                  | Purpose             |
| ------ | ------------------------------------- | ------------------- |
| GET    | `/api/v1/notifications/`              | current user's feed |
| GET    | `/api/v1/notifications/unread-count`  |                     |
| PATCH  | `/api/v1/notifications/:id/read`      |                     |
| POST   | `/api/v1/notifications/mark-all-read` |                     |
| GET    | `/api/v1/notifications/preferences`   | per-channel opt-in  |
| PUT    | `/api/v1/notifications/preferences`   |                     |

---

## Background jobs

Use `django-q` or `celery` + `celery-beat`:

- `follow_up_due_scan` — every 15 min; creates notifications for overdue follow-ups.
- `quotation_expiry_scan` — daily; flags expired quotations + notifies owners.
- `reorder_alert_scan` — hourly; notifies inventory managers on threshold breaches.
- `pod_pending_scan` — daily; nudges dispatchers.
- `digest_email` — daily 8 am IST; summary per user.

---

## Producers

- Django signals on model state transitions emit domain events; a dispatcher maps events → templates → recipients → channels.
- Template system: `apps/notifications/templates/<event>.html` + subject `.txt`.
- Channel backends pluggable: `InApp`, `Email` (SMTP), stubs for `WhatsApp`, `SMS`.

---

## Tests

- Triggering an inquiry status change creates a notification row with correct recipient.
- Scheduled job produces expected rows given a fixture clock (`freezegun`).
- Preference opt-out suppresses channel delivery but still writes in-app row.

---

## Verification

- [ ] All scheduled tasks documented in `config/beat_schedule.py`.
- [ ] Coverage ≥ 85 %.
- [ ] Commit: `feat(api): notifications + background jobs`.

---

**Next:** [14-postman-tests.md](./14-postman-tests.md)
