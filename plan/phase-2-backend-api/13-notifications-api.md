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
- `scheduled_reports_dispatch` — every 5 min; selects scheduled reports where `next_run_at <= now()`, runs the saved report, sends per format/recipients (see step 12), records `run_history`, advances `next_run_at` via `croniter`.

---

## Producers

- Django signals on model state transitions emit domain events; a dispatcher maps events → templates → recipients → channels.
- Template system: `apps/notifications/templates/<event>.html` + subject `.txt`.
- Channel backends pluggable: `InApp`, `Email` (SMTP), stubs for `WhatsApp`, `SMS`.
- Per-recipient channel selection honours `notification_channel_defaults` (settings, step 04b) and per-user overrides from `/notifications/preferences`.

### Event → kind matrix

The 7 kinds match `frontend/src/mocks/notifications.ts`. Every producer must map to exactly one kind. Add new producers by extending this table — never invent ad-hoc kinds.

| Kind        | Producer event                      | Trigger                                                | Recipients                    | Channels (default) |
| ----------- | ----------------------------------- | ------------------------------------------------------ | ----------------------------- | ------------------ |
| `inquiry`   | `inquiry.created`                   | new inquiry POST                                       | inquiry owner, sales head     | in_app, email      |
| `inquiry`   | `inquiry.assigned`                  | owner change                                           | new owner                     | in_app, email      |
| `inquiry`   | `inquiry.follow_up_overdue`         | `follow_up_due_scan` cron                              | owner                         | in_app, email      |
| `inquiry`   | `inquiry.status_changed`            | status transition (lost / qualified / converted)       | owner, sales head             | in_app             |
| `quotation` | `quotation.submitted_for_approval`  | submit-approval action                                 | next approver in chain        | in_app, email      |
| `quotation` | `quotation.approved`                | final approval                                         | owner                         | in_app, email      |
| `quotation` | `quotation.rejected`                | reject action                                          | owner                         | in_app, email      |
| `quotation` | `quotation.sent`                    | send action                                            | owner                         | in_app             |
| `quotation` | `quotation.client_approved`         | portal approve (step 11b)                              | owner, sales head             | in_app, email      |
| `quotation` | `quotation.client_rejected`         | portal reject                                          | owner                         | in_app, email      |
| `quotation` | `quotation.expired`                 | `quotation_expiry_scan` cron                           | owner                         | in_app, email      |
| `order`     | `order.confirmed`                   | confirm action (also reserves stock)                   | owner, ops head               | in_app, email      |
| `order`     | `order.ready_for_dispatch`          | readiness gate passes                                  | dispatch manager              | in_app, email      |
| `order`     | `order.installed`                   | last job complete                                      | owner, customer (portal)      | in_app, email      |
| `dispatch`  | `dispatch.scheduled`                | challan create                                         | dispatcher, customer (portal) | in_app, email      |
| `dispatch`  | `dispatch.in_transit`               | status → in_transit                                    | customer (portal)             | in_app             |
| `dispatch`  | `dispatch.delivered`                | status → delivered                                     | dispatcher, customer (portal) | in_app, email      |
| `dispatch`  | `dispatch.pod_pending`              | `pod_pending_scan` cron                                | dispatcher                    | in_app             |
| `job`       | `job.assigned`                      | assign action                                          | engineer                      | in_app, email      |
| `job`       | `job.scheduled`                     | visit scheduled                                        | engineer, customer (portal)   | in_app, email      |
| `job`       | `job.completed`                     | complete action                                        | ops head, customer (portal)   | in_app             |
| `job`       | `job.signoff_received`              | customer signoff                                       | owner, ops head               | in_app, email      |
| `inventory` | `inventory.low_stock`               | `reorder_alert_scan` cron                              | inventory manager, purchase   | in_app, email      |
| `inventory` | `inventory.adjustment_posted`       | adjustment > threshold                                 | inventory manager, finance    | in_app             |
| `inventory` | `inventory.reservation_failed`      | confirm where stock unavailable                        | order owner                   | in_app, email      |
| `system`    | `system.report_scheduled_delivered` | `scheduled_reports_dispatch` success                   | scheduled-report recipients   | email              |
| `system`    | `system.integration_failed`         | settings integration test fail / runtime delivery fail | admin                         | in_app, email      |
| `system`    | `system.digest`                     | `digest_email` cron                                    | each user                     | email              |

Templates per event live in `apps/notifications/templates/<event>.{html,txt}`; the dispatcher chooses PDF attachment vs link based on size (≤ 1 MB attach, otherwise signed link).

---

## Tests

- Triggering an inquiry status change creates a notification row with correct kind + recipient.
- Event matrix snapshot test: every producer event listed above resolves to a (kind, template, recipients) tuple; no event resolves to two kinds.
- Scheduled job produces expected rows given a fixture clock (`freezegun`).
- Preference opt-out suppresses channel delivery but still writes in-app row.
- `scheduled_reports_dispatch` advances `next_run_at` and writes a `system.report_scheduled_delivered` notification.

---

## Verification

- [ ] All scheduled tasks documented in `config/beat_schedule.py`.
- [ ] Event → kind matrix exhaustive: every domain transition that mocks notify is mapped here.
- [ ] Coverage ≥ 85 %.
- [ ] Commit: `feat(api): notifications + event matrix + background jobs`.

---

**Next:** [14-postman-tests.md](./14-postman-tests.md)
