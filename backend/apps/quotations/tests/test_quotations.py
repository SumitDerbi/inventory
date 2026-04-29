"""Quotation API integration tests (Step 06a)."""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from apps.core.masters import TaxRule
from apps.customers.models import Customer
from apps.quotations.models import (
    Quotation,
    QuotationActivityLog,
    QuotationApprovalStep,
    QuotationCommunicationLog,
    QuotationItem,
)


@pytest.fixture
def customer(db):
    return Customer.objects.create(
        customer_type="company",
        company_name="Acme Pumps Ltd",
        contact_person_name="Bob",
        mobile="9876543210",
        email="bob@acme.example",
    )


@pytest.fixture
def gst18(db):
    return TaxRule.objects.create(name="GST 18", tax_type="GST", rate_percent=18, applicable_to="product")


def _payload(customer, **overrides):
    today = date.today()
    base = {
        "customer": customer.id,
        "project_name": "Phase 1 Pumps",
        "quotation_date": today.isoformat(),
        "valid_until": (today + timedelta(days=30)).isoformat(),
        "freight_amount": "0",
        "other_charges": "0",
    }
    base.update(overrides)
    return base


def _add_item(auth_client, qid, gst18, **overrides):
    payload = {
        "product_description": "Centrifugal Pump 5HP",
        "quantity": "10",
        "unit": "nos",
        "unit_cost": "8000",
        "unit_price": "10000",
        "discount_percent": "0",
        "tax_rule": gst18.id,
    }
    payload.update(overrides)
    return auth_client.post(f"/api/v1/quotations/{qid}/items/", payload, format="json")


# ---------------- create ------------------------------------------------
def test_create_assigns_number_and_logs_activity(auth_client, customer):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    assert res.status_code == 201, res.content
    body = res.data
    assert body["quotation_number"].startswith("QUO")
    assert body["version_number"] == 1
    assert body["status"] == "draft"
    assert QuotationActivityLog.objects.filter(
        quotation_id=body["id"], action_type="created"
    ).exists()


def test_list_filters_and_search(auth_client, customer):
    auth_client.post("/api/v1/quotations/", _payload(customer, project_name="Foo"), format="json")
    auth_client.post("/api/v1/quotations/", _payload(customer, project_name="Bar"), format="json")
    res = auth_client.get("/api/v1/quotations/?search=Foo")
    assert res.status_code == 200
    rows = res.data.get("results", res.data)
    assert len(rows) == 1
    assert rows[0]["project_name"] == "Foo"


# ---------------- items + recompute ------------------------------------
def test_add_item_recomputes_totals(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    res2 = _add_item(auth_client, qid, gst18)
    assert res2.status_code == 201, res2.content
    detail = auth_client.get(f"/api/v1/quotations/{qid}/").data
    assert detail["subtotal"] == "100000.00"
    assert detail["total_tax"] == "18000.00"
    assert detail["grand_total"] == "118000.00"
    assert detail["gross_margin_percent"] == "20.00"


def test_update_item_recomputes(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    item_res = _add_item(auth_client, qid, gst18)
    iid = item_res.data["id"]
    auth_client.patch(
        f"/api/v1/quotations/items/{iid}/",
        {"quantity": "5"},
        format="json",
    )
    detail = auth_client.get(f"/api/v1/quotations/{qid}/").data
    assert detail["subtotal"] == "50000.00"


def test_delete_item_recomputes(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    item_res = _add_item(auth_client, qid, gst18)
    iid = item_res.data["id"]
    auth_client.delete(f"/api/v1/quotations/items/{iid}/")
    detail = auth_client.get(f"/api/v1/quotations/{qid}/").data
    assert detail["subtotal"] == "0.00"


# ---------------- approval workflow ------------------------------------
def test_submit_auto_approves_when_no_thresholds(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    _add_item(auth_client, qid, gst18, quantity="1", unit_price="100", unit_cost="80")
    res2 = auth_client.post(f"/api/v1/quotations/{qid}/submit-approval/", {}, format="json")
    assert res2.status_code == 200
    assert res2.data["status"] == "approved"


def test_submit_creates_approval_chain_when_above_threshold(api_client, admin_user, customer, gst18, django_user_model):
    # Need a manager + login as a regular user to create
    django_user_model.objects.create_user(
        username="mgr@x.com", email="mgr@x.com", password="StrongP@ssw0rd!", is_staff=True
    )
    # login as admin so as not to trip permissions
    res_login = api_client.post(
        "/api/auth/login",
        {"email": admin_user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    token = res_login.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    res = api_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    # qty 100 * price 10000 = 1,000,000 → grand_total > 500000 → manager required
    _add_item(api_client, qid, gst18, quantity="100", unit_price="10000", unit_cost="9000")
    res2 = api_client.post(f"/api/v1/quotations/{qid}/submit-approval/", {}, format="json")
    assert res2.status_code == 200, res2.content
    assert res2.data["status"] == "pending_approval"
    assert QuotationApprovalStep.objects.filter(quotation_id=qid).exists()


def test_approve_by_correct_approver(api_client, admin_user, customer, gst18, django_user_model):
    mgr = django_user_model.objects.create_user(
        username="mgr2@x.com", email="mgr2@x.com", password="StrongP@ssw0rd!", is_staff=True
    )
    res_login = api_client.post(
        "/api/auth/login",
        {"email": admin_user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {res_login.data['access']}")
    res = api_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    _add_item(api_client, qid, gst18, quantity="100", unit_price="10000", unit_cost="9000")
    api_client.post(f"/api/v1/quotations/{qid}/submit-approval/", {}, format="json")

    # Wrong approver
    bad = api_client.post(f"/api/v1/quotations/{qid}/approve/", {}, format="json")
    assert bad.status_code == 422

    # Login as manager
    mgr_login = api_client.post(
        "/api/auth/login",
        {"email": mgr.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {mgr_login.data['access']}")
    ok = api_client.post(f"/api/v1/quotations/{qid}/approve/", {"comments": "ok"}, format="json")
    assert ok.status_code == 200
    assert ok.data["status"] == "approved"


def test_reject_requires_comments(api_client, admin_user, customer, gst18, django_user_model):
    mgr = django_user_model.objects.create_user(
        username="mgr3@x.com", email="mgr3@x.com", password="StrongP@ssw0rd!", is_staff=True
    )
    res_login = api_client.post(
        "/api/auth/login",
        {"email": admin_user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {res_login.data['access']}")
    res = api_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    _add_item(api_client, qid, gst18, quantity="100", unit_price="10000")
    api_client.post(f"/api/v1/quotations/{qid}/submit-approval/", {}, format="json")
    mgr_login = api_client.post(
        "/api/auth/login",
        {"email": mgr.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {mgr_login.data['access']}")
    bad = api_client.post(f"/api/v1/quotations/{qid}/reject/", {}, format="json")
    assert bad.status_code == 400
    ok = api_client.post(f"/api/v1/quotations/{qid}/reject/", {"comments": "too low margin"}, format="json")
    assert ok.status_code == 200
    assert ok.data["status"] == "rejected"


# ---------------- send / clone / version / convert ----------------------
def test_send_quotation_after_approval(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    _add_item(auth_client, qid, gst18, quantity="1", unit_price="100", unit_cost="80")
    auth_client.post(f"/api/v1/quotations/{qid}/submit-approval/", {}, format="json")
    res2 = auth_client.post(
        f"/api/v1/quotations/{qid}/send/",
        {"channel": "email", "to_address": "buyer@acme.test"},
        format="json",
    )
    assert res2.status_code == 201, res2.content
    assert QuotationCommunicationLog.objects.filter(quotation_id=qid).exists()
    detail = auth_client.get(f"/api/v1/quotations/{qid}/").data
    assert detail["status"] == "sent"


def test_clone_creates_draft_with_new_number(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    _add_item(auth_client, qid, gst18, quantity="2", unit_price="200")
    res2 = auth_client.post(f"/api/v1/quotations/{qid}/clone/", {}, format="json")
    assert res2.status_code == 201
    assert res2.data["status"] == "draft"
    assert res2.data["quotation_number"] != Quotation.objects.get(id=qid).quotation_number
    assert res2.data["subtotal"] == "400.00"


def test_new_version_increments_and_starts_draft(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    _add_item(auth_client, qid, gst18, quantity="1", unit_price="100")
    res2 = auth_client.post(f"/api/v1/quotations/{qid}/versions/", {}, format="json")
    assert res2.status_code == 201
    assert res2.data["version_number"] == 2
    assert res2.data["quotation_number"] == res.data["quotation_number"]
    assert res2.data["status"] == "draft"


def test_convert_to_order(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    _add_item(auth_client, qid, gst18, quantity="1", unit_price="100", unit_cost="80")
    auth_client.post(f"/api/v1/quotations/{qid}/submit-approval/", {}, format="json")
    auth_client.post(
        f"/api/v1/quotations/{qid}/send/",
        {"channel": "email", "to_address": "buyer@acme.test"},
        format="json",
    )
    res2 = auth_client.post(f"/api/v1/quotations/{qid}/convert-to-order/", {}, format="json")
    assert res2.status_code == 201, res2.content
    assert res2.data["order_number"].startswith("SO")
    detail = auth_client.get(f"/api/v1/quotations/{qid}/").data
    assert detail["status"] == "converted"


def test_convert_blocked_from_draft(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    _add_item(auth_client, qid, gst18, quantity="1", unit_price="100")
    bad = auth_client.post(f"/api/v1/quotations/{qid}/convert-to-order/", {}, format="json")
    assert bad.status_code == 422


# ---------------- activity / communications endpoints -----------------
def test_activity_endpoint_returns_log(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    _add_item(auth_client, qid, gst18, quantity="1", unit_price="100")
    rows = auth_client.get(f"/api/v1/quotations/{qid}/activity/").data
    types = {r["action_type"] for r in rows}
    assert "created" in types
    assert "line_item_added" in types


def test_communications_endpoint(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/quotations/", _payload(customer), format="json")
    qid = res.data["id"]
    _add_item(auth_client, qid, gst18, quantity="1", unit_price="100", unit_cost="80")
    auth_client.post(f"/api/v1/quotations/{qid}/submit-approval/", {}, format="json")
    auth_client.post(
        f"/api/v1/quotations/{qid}/send/",
        {"channel": "email", "to_address": "x@y.test"},
        format="json",
    )
    rows = auth_client.get(f"/api/v1/quotations/{qid}/communications/").data
    assert len(rows) == 1
    assert rows[0]["channel"] == "email"


# ---------------- expiry ----------------------------------------------
def test_expire_due_marks_old_quotations(auth_client, customer):
    auth_client.post(
        "/api/v1/quotations/",
        _payload(customer, valid_until=(date.today() - timedelta(days=1)).isoformat()),
        format="json",
    )
    from apps.quotations.services import expire_due
    n = expire_due()
    assert n == 1
    q = Quotation.objects.first()
    assert q.status == "expired"
