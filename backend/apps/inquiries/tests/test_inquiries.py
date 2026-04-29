"""Inquiry slice — Step 05a tests."""
from __future__ import annotations

import pytest

from apps.customers.models import Customer
from apps.inquiries.models import (
    Inquiry,
    InquiryActivityLog,
    InquiryFollowUp,
    InquiryLineItem,
    InquirySource,
)


@pytest.fixture
def source(db):
    return InquirySource.objects.create(name="Website")


@pytest.fixture
def customer(db):
    return Customer.objects.create(
        customer_type="company",
        company_name="Acme Pumps Ltd",
        contact_person_name="Bob",
        mobile="9876543210",
        email="bob@acme.example",
    )


def _payload(source, **overrides):
    base = {
        "source": source.id,
        "customer_name": "Carol",
        "company_name": "Carol Co",
        "mobile": "9000000001",
        "email": "carol@example.com",
        "inquiry_type": "new_project",
        "priority": "medium",
        "project_name": "Phase 1 Pumps",
    }
    base.update(overrides)
    return base


# ---------------- create ------------------------------------------------
def test_create_assigns_number_and_logs_activity(auth_client, source):
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    assert res.status_code == 201, res.content
    body = res.data
    assert body["inquiry_number"].startswith("INQ")
    assert body["status"] == "new"
    assert InquiryActivityLog.objects.filter(
        inquiry_id=body["id"], action_type="created"
    ).exists()


def test_create_dedupe_returns_409(auth_client, source):
    auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    assert res.status_code == 409
    assert res.data["matches"]
    assert "mobile" in res.data["matches"][0]["match_reasons"]


def test_create_force_bypasses_dedupe(auth_client, source):
    auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    res = auth_client.post(
        "/api/v1/inquiries/?force=true", _payload(source), format="json"
    )
    assert res.status_code == 201


# ---------------- assign / status --------------------------------------
def test_assign_inquiry(auth_client, source, user, admin_user):
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    pk = res.data["id"]
    res2 = auth_client.post(
        f"/api/v1/inquiries/{pk}/assign/", {"user_id": admin_user.id}, format="json"
    )
    assert res2.status_code == 200
    assert res2.data["assigned_to"] == admin_user.id
    assert InquiryActivityLog.objects.filter(
        inquiry_id=pk, action_type="assigned"
    ).exists()


def test_status_machine_valid(auth_client, source):
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    pk = res.data["id"]
    r1 = auth_client.post(
        f"/api/v1/inquiries/{pk}/status/", {"status": "in_progress"}, format="json"
    )
    assert r1.status_code == 200
    assert r1.data["status"] == "in_progress"


def test_status_invalid_transition(auth_client, source):
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    pk = res.data["id"]
    # new → converted is not allowed
    r = auth_client.post(
        f"/api/v1/inquiries/{pk}/status/", {"status": "converted"}, format="json"
    )
    assert r.status_code == 422


def test_status_lost_requires_reason(auth_client, source):
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    pk = res.data["id"]
    r = auth_client.post(
        f"/api/v1/inquiries/{pk}/status/", {"status": "lost"}, format="json"
    )
    assert r.status_code == 422
    r2 = auth_client.post(
        f"/api/v1/inquiries/{pk}/status/",
        {"status": "lost", "lost_reason": "budget cut"},
        format="json",
    )
    assert r2.status_code == 200
    assert r2.data["lost_reason"] == "budget cut"


def test_update_blocked_when_lost(auth_client, source):
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    pk = res.data["id"]
    auth_client.post(
        f"/api/v1/inquiries/{pk}/status/",
        {"status": "lost", "lost_reason": "x"},
        format="json",
    )
    r = auth_client.patch(
        f"/api/v1/inquiries/{pk}/", {"notes": "post-lost edit"}, format="json"
    )
    assert r.status_code == 403


# ---------------- convert-to-quotation ---------------------------------
def test_convert_to_quotation_requires_customer(auth_client, source):
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    pk = res.data["id"]
    # advance through valid path: new → in_progress → quoted (then convert)
    auth_client.post(
        f"/api/v1/inquiries/{pk}/status/", {"status": "in_progress"}, format="json"
    )
    auth_client.post(
        f"/api/v1/inquiries/{pk}/status/", {"status": "quoted"}, format="json"
    )
    r = auth_client.post(f"/api/v1/inquiries/{pk}/convert-to-quotation/")
    assert r.status_code == 422


def test_convert_to_quotation_happy_path(auth_client, source, customer):
    payload = _payload(source, customer=customer.id)
    res = auth_client.post("/api/v1/inquiries/", payload, format="json")
    pk = res.data["id"]
    auth_client.post(
        f"/api/v1/inquiries/{pk}/status/", {"status": "in_progress"}, format="json"
    )
    auth_client.post(
        f"/api/v1/inquiries/{pk}/status/", {"status": "quoted"}, format="json"
    )
    # add a line item so quotation gets one
    auth_client.post(
        f"/api/v1/inquiries/{pk}/items/",
        {
            "product_description": "Submersible pump 5HP",
            "quantity": "2.00",
            "unit": "nos",
            "estimated_value": "55000.00",
        },
        format="json",
    )
    r = auth_client.post(f"/api/v1/inquiries/{pk}/convert-to-quotation/")
    assert r.status_code == 201, r.content
    assert r.data["quotation_number"].startswith("QUO")
    inq = Inquiry.objects.get(pk=pk)
    assert inq.status == "converted"


# ---------------- follow-ups + items -----------------------------------
def test_follow_up_create_and_list(auth_client, source, user):
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    pk = res.data["id"]
    r = auth_client.post(
        f"/api/v1/inquiries/{pk}/follow-ups/",
        {
            "follow_up_type": "call",
            "scheduled_at": "2026-05-01T10:00:00Z",
            "assigned_to": user.id,
        },
        format="json",
    )
    assert r.status_code == 201
    fid = r.data["id"]
    listing = auth_client.get(f"/api/v1/inquiries/{pk}/follow-ups/")
    assert listing.status_code == 200
    assert len(listing.data) == 1
    upd = auth_client.patch(
        f"/api/v1/inquiries/follow-ups/{fid}/",
        {"status": "completed", "outcome": "spoke"},
        format="json",
    )
    assert upd.status_code == 200
    assert upd.data["status"] == "completed"


def test_line_item_lifecycle(auth_client, source):
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    pk = res.data["id"]
    add = auth_client.post(
        f"/api/v1/inquiries/{pk}/items/",
        {
            "product_description": "Valve 3 inch",
            "quantity": "5.00",
            "unit": "nos",
        },
        format="json",
    )
    assert add.status_code == 201
    iid = add.data["id"]
    upd = auth_client.patch(
        f"/api/v1/inquiries/items/{iid}/", {"quantity": "10.00"}, format="json"
    )
    assert upd.status_code == 200
    assert str(upd.data["quantity"]) == "10.00"
    rm = auth_client.delete(f"/api/v1/inquiries/items/{iid}/")
    assert rm.status_code == 204
    assert not InquiryLineItem.objects.filter(id=iid).exists()


def test_activity_endpoint_returns_log(auth_client, source):
    res = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    pk = res.data["id"]
    auth_client.post(
        f"/api/v1/inquiries/{pk}/status/", {"status": "in_progress"}, format="json"
    )
    r = auth_client.get(f"/api/v1/inquiries/{pk}/activity/")
    assert r.status_code == 200
    types = {row["action_type"] for row in r.data}
    assert {"created", "status_changed"}.issubset(types)


# ---------------- bulk + stats -----------------------------------------
def test_bulk_assign_partial(auth_client, source, admin_user):
    r1 = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    r2 = auth_client.post(
        "/api/v1/inquiries/?force=true",
        _payload(source, mobile="9000000002"),
        format="json",
    )
    res = auth_client.post(
        "/api/v1/inquiries/bulk-assign/",
        {"inquiry_ids": [r1.data["id"], r2.data["id"], 999999], "user_id": admin_user.id},
        format="json",
    )
    assert res.status_code == 207
    assert len(res.data["succeeded"]) == 2
    assert any(f["id"] == 999999 for f in res.data["failed"])


def test_bulk_status(auth_client, source):
    r1 = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    r2 = auth_client.post(
        "/api/v1/inquiries/?force=true",
        _payload(source, mobile="9000000003"),
        format="json",
    )
    res = auth_client.post(
        "/api/v1/inquiries/bulk-status/",
        {"inquiry_ids": [r1.data["id"], r2.data["id"]], "status": "in_progress"},
        format="json",
    )
    assert res.status_code == 200
    assert sorted(res.data["succeeded"]) == sorted([r1.data["id"], r2.data["id"]])


def test_bulk_export_csv(auth_client, source):
    r = auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    res = auth_client.post(
        "/api/v1/inquiries/bulk-export/",
        {"inquiry_ids": [r.data["id"]], "format": "csv"},
        format="json",
    )
    assert res.status_code == 200
    assert res["Content-Type"].startswith("text/csv")
    body = res.content.decode()
    assert "inquiry_number" in body
    assert r.data["inquiry_number"] in body


def test_stats(auth_client, source):
    auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    r = auth_client.get("/api/v1/inquiries/stats/")
    assert r.status_code == 200
    assert any(row["status"] == "new" and row["count"] == 1 for row in r.data["by_status"])


def test_find_duplicates_endpoint(auth_client, source):
    auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    r = auth_client.get("/api/v1/inquiries/find-duplicates/?mobile=9000000001")
    assert r.status_code == 200
    assert len(r.data["matches"]) == 1


# ---------------- list + filters ---------------------------------------
def test_list_filters_by_status(auth_client, source):
    auth_client.post("/api/v1/inquiries/", _payload(source), format="json")
    r = auth_client.get("/api/v1/inquiries/?status=new")
    assert r.status_code == 200
    assert r.data["count"] == 1


def test_anonymous_blocked(api_client):
    res = api_client.get("/api/v1/inquiries/")
    assert res.status_code in (401, 403)
