"""Step 04b: Settings & Admin Config + Approvals Inbox API tests."""
from __future__ import annotations

import pytest
from django.core import mail
from rest_framework.test import APIClient

from apps.core.masters import (
    EmailTemplate,
    Integration,
    NotificationChannelDefault,
    NumberSeries,
    PaymentTerm,
)


@pytest.fixture(autouse=True)
def _email_locmem(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    mail.outbox = []


# ---------------------------------------------------------------------------
# Admin gate
# ---------------------------------------------------------------------------
class TestAdminGate:
    def test_non_admin_forbidden_on_company(self, auth_client):
        r = auth_client.get("/api/v1/settings/company/")
        assert r.status_code == 403

    def test_non_admin_forbidden_on_numbering_list(self, auth_client):
        r = auth_client.get("/api/v1/settings/numbering-series/")
        assert r.status_code == 403

    def test_anonymous_unauthorized(self, api_client):
        r = api_client.get("/api/v1/settings/company/")
        assert r.status_code in (401, 403)


# ---------------------------------------------------------------------------
# CompanyProfile (singleton)
# ---------------------------------------------------------------------------
class TestCompanyProfile:
    def test_get_creates_singleton(self, admin_client):
        r = admin_client.get("/api/v1/settings/company/")
        assert r.status_code == 200
        assert "name" in r.data

    def test_put_updates(self, admin_client):
        admin_client.get("/api/v1/settings/company/")  # ensure exists
        r = admin_client.put(
            "/api/v1/settings/company/",
            {"name": "Acme Industries", "gst_number": "27AAAPL1234C1Z5"},
            format="json",
        )
        assert r.status_code == 200, r.data
        assert r.data["name"] == "Acme Industries"


# ---------------------------------------------------------------------------
# NumberingSeries — preview must not increment
# ---------------------------------------------------------------------------
class TestNumbering:
    def test_seeded_series_present(self, admin_client):
        r = admin_client.get("/api/v1/settings/numbering-series/")
        assert r.status_code == 200
        codes = {row["code"] for row in r.data["results"] if isinstance(r.data, dict) and "results" in r.data} or {row["code"] for row in r.data}
        assert "INQ" in codes and "QUO" in codes

    def test_preview_does_not_mutate(self, admin_client):
        s = NumberSeries.objects.get(code="INQ")
        before = s.last_number
        r = admin_client.get(f"/api/v1/settings/numbering-series/{s.id}/preview/")
        assert r.status_code == 200
        assert len(r.data["next"]) == 3
        assert all(isinstance(x, str) for x in r.data["next"])
        s.refresh_from_db()
        assert s.last_number == before

    def test_consume_next_mutates(self, admin_client):
        from apps.core.numbering import consume_next

        s = NumberSeries.objects.get(code="QUO")
        before = s.last_number
        token = consume_next("QUO")
        s.refresh_from_db()
        assert s.last_number == before + 1
        assert s.prefix in token


# ---------------------------------------------------------------------------
# Integrations — secrets masked + test endpoint
# ---------------------------------------------------------------------------
class TestIntegrations:
    def test_create_smtp_and_secrets_masked(self, admin_client):
        payload = {
            "kind": "smtp",
            "name": "Primary SMTP",
            "config": {
                "host": "smtp.example.com",
                "port": 587,
                "username": "noreply@example.com",
                "password": "supersecret123",
                "from_email": "noreply@example.com",
                "test_recipient": "qa@example.com",
            },
            "is_active": True,
        }
        r = admin_client.post("/api/v1/settings/integrations/", payload, format="json")
        assert r.status_code == 201, r.data
        assert r.data["config"]["password"].endswith("123") and "•" in r.data["config"]["password"]
        assert r.data["config"]["host"] == "smtp.example.com"

    def test_test_endpoint_smtp_sends_smoke_email(self, admin_client):
        r = admin_client.post(
            "/api/v1/settings/integrations/",
            {
                "kind": "smtp",
                "name": "SMTP",
                "config": {"from_email": "noreply@example.com", "test_recipient": "qa@example.com"},
            },
            format="json",
        )
        integ_id = r.data["id"]
        r2 = admin_client.post(f"/api/v1/settings/integrations/{integ_id}/test/", {}, format="json")
        assert r2.status_code == 200, r2.data
        assert r2.data["ok"] is True
        assert len(mail.outbox) == 1
        # row updated with last_test_status
        from apps.core.masters import Integration as Ig

        assert Ig.objects.get(id=integ_id).last_test_status == "ok"


# ---------------------------------------------------------------------------
# EmailTemplate — render + send-test
# ---------------------------------------------------------------------------
class TestEmailTemplates:
    def test_seeded_templates_listable(self, admin_client):
        r = admin_client.get("/api/v1/settings/email-templates/")
        assert r.status_code == 200

    def test_preview_missing_variables_returns_400(self, admin_client):
        tmpl = EmailTemplate.objects.get(slug="quotation_sent")
        r = admin_client.post(
            f"/api/v1/settings/email-templates/{tmpl.id}/preview/",
            {"variables": {"customer_name": "Bob"}},
            format="json",
        )
        assert r.status_code == 400
        assert "missing_variables" in r.data

    def test_preview_renders_with_full_vars(self, admin_client):
        tmpl = EmailTemplate.objects.get(slug="quotation_sent")
        r = admin_client.post(
            f"/api/v1/settings/email-templates/{tmpl.id}/preview/",
            {
                "variables": {
                    "customer_name": "Bob",
                    "quotation_number": "QUO/2526/00001",
                    "sender_name": "Alice",
                }
            },
            format="json",
        )
        assert r.status_code == 200, r.data
        assert "Bob" in r.data["body_text"] and "QUO/2526/00001" in r.data["body_text"]

    def test_send_test_emails_via_locmem(self, admin_client):
        tmpl = EmailTemplate.objects.get(slug="password_reset")
        r = admin_client.post(
            f"/api/v1/settings/email-templates/{tmpl.id}/send-test/",
            {
                "to": "qa@example.com",
                "variables": {"user_name": "Bob", "reset_link": "https://x.test/r/abc"},
            },
            format="json",
        )
        assert r.status_code == 200, r.data
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ["qa@example.com"]


# ---------------------------------------------------------------------------
# Payment terms / notification channels CRUD smoke
# ---------------------------------------------------------------------------
class TestSimpleResources:
    def test_payment_term_crud(self, admin_client):
        r = admin_client.post(
            "/api/v1/settings/payment-terms/",
            {"name": "Net 30", "days": 30, "milestone_split": []},
            format="json",
        )
        assert r.status_code == 201, r.data
        pid = r.data["id"]
        r2 = admin_client.get("/api/v1/settings/payment-terms/")
        assert r2.status_code == 200
        r3 = admin_client.delete(f"/api/v1/settings/payment-terms/{pid}/")
        assert r3.status_code in (204, 200)

    def test_notification_channel_seeded(self, admin_client):
        r = admin_client.get("/api/v1/settings/notification-channels/")
        assert r.status_code == 200
        assert NotificationChannelDefault.objects.filter(kind="invoice_overdue").exists()


# ---------------------------------------------------------------------------
# Approvals inbox
# ---------------------------------------------------------------------------
@pytest.fixture
def quotation_approval(user):
    """Create a Quotation + a pending QuotationApprovalStep assigned to `user`."""
    from apps.customers.models import Customer
    from apps.quotations.models import Quotation, QuotationApprovalStep

    customer = Customer.objects.create(
        company_name="ACME Ltd",
        mobile="9999900001",
        gst_number="",
        status=Customer.Status.ACTIVE,
    )
    q = Quotation.objects.create(
        quotation_number="QUO/2526/00001",
        customer=customer,
        prepared_by=user,
        quotation_date="2025-01-01",
        valid_until="2025-02-01",
    )
    return QuotationApprovalStep.objects.create(
        quotation=q,
        step_order=1,
        approver=user,
    )


class TestApprovalsInbox:
    def test_inbox_lists_pending_for_current_user(self, auth_client, quotation_approval):
        r = auth_client.get("/api/v1/approvals/inbox/")
        assert r.status_code == 200, r.data
        assert r.data["count"] == 1
        assert r.data["results"][0]["kind"] == "quotation"
        assert r.data["results"][0]["sla_bucket"] in ("fresh", "warning", "overdue")

    def test_kpis(self, auth_client, quotation_approval):
        r = auth_client.get("/api/v1/approvals/kpis/")
        assert r.status_code == 200
        assert r.data["total_pending"] == 1
        assert r.data["by_kind"]["quotation"] == 1

    def test_approve_flips_status(self, auth_client, quotation_approval):
        r = auth_client.post(
            f"/api/v1/approvals/quotation/{quotation_approval.id}/approve/",
            {"comments": "LGTM"},
            format="json",
        )
        assert r.status_code == 200, r.data
        quotation_approval.refresh_from_db()
        assert quotation_approval.status == "approved"
        assert quotation_approval.comments == "LGTM"

    def test_double_approve_returns_409(self, auth_client, quotation_approval):
        auth_client.post(f"/api/v1/approvals/quotation/{quotation_approval.id}/approve/", {}, format="json")
        r = auth_client.post(f"/api/v1/approvals/quotation/{quotation_approval.id}/approve/", {}, format="json")
        assert r.status_code == 409

    def test_reject_flips_status(self, auth_client, quotation_approval):
        r = auth_client.post(
            f"/api/v1/approvals/quotation/{quotation_approval.id}/reject/",
            {"comments": "Margin too low"},
            format="json",
        )
        assert r.status_code == 200
        quotation_approval.refresh_from_db()
        assert quotation_approval.status == "rejected"

    def test_other_user_cannot_approve(self, api_client, admin_user, quotation_approval):
        # admin_user is NOT the assigned approver but is admin → allowed by the permissive bypass.
        # Use a third regular user without admin role to assert 403.
        from django.contrib.auth import get_user_model

        U = get_user_model()
        third = U.objects.create_user(
            username="charlie@example.com",
            email="charlie@example.com",
            password="StrongP@ssw0rd!",
        )
        client = APIClient()
        res = client.post(
            "/api/auth/login",
            {"email": third.email, "password": "StrongP@ssw0rd!"},
            format="json",
        )
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        r = client.post(
            f"/api/v1/approvals/quotation/{quotation_approval.id}/approve/", {}, format="json"
        )
        assert r.status_code == 403

    def test_bulk_approve_returns_207_on_partial(self, auth_client, quotation_approval):
        r = auth_client.post(
            "/api/v1/approvals/bulk-approve/",
            {
                "items": [
                    {"kind": "quotation", "id": quotation_approval.id},
                    {"kind": "quotation", "id": 99999},  # not_found
                ]
            },
            format="json",
        )
        assert r.status_code == 207
        outcomes = {(o["id"], o["ok"]) for o in r.data["results"]}
        assert (quotation_approval.id, True) in outcomes
        assert (99999, False) in outcomes
