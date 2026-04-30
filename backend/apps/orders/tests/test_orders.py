"""Sales order API tests (Step 07a — list/detail)."""
from __future__ import annotations

from datetime import date

import pytest

from apps.core.masters import TaxRule
from apps.customers.models import Customer
from apps.orders.models import SalesOrder


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
    return TaxRule.objects.create(
        name="GST 18", tax_type="GST", rate_percent=18, applicable_to="product"
    )


def _payload(customer, **overrides):
    base = {
        "customer": customer.id,
        "project_name": "Phase 1 Pumps",
        "order_date": date.today().isoformat(),
    }
    base.update(overrides)
    return base


def _add_item(auth_client, oid, gst18, **overrides):
    payload = {
        "product_description": "Centrifugal Pump 5HP",
        "quantity_ordered": "10",
        "quantity_pending": "10",
        "unit": "nos",
        "unit_price": "10000",
        "discount_percent": "0",
        "tax_rule": gst18.id,
    }
    payload.update(overrides)
    return auth_client.post(f"/api/v1/orders/{oid}/items/", payload, format="json")


def test_create_assigns_order_number(auth_client, customer):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    assert res.status_code == 201, res.content
    body = res.data
    assert body["order_number"].startswith("SO")
    assert body["status"] == "draft"
    assert SalesOrder.objects.filter(id=body["id"]).exists()


def test_list_returns_denormalised_fields(auth_client, customer):
    auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    res = auth_client.get("/api/v1/orders/")
    assert res.status_code == 200
    rows = res.data.get("results", res.data)
    assert len(rows) == 1
    assert rows[0]["company_name"] == "Acme Pumps Ltd"
    assert rows[0]["customer_name"] == "Bob"


def test_list_search_filters_by_project(auth_client, customer):
    auth_client.post("/api/v1/orders/", _payload(customer, project_name="Foo"), format="json")
    auth_client.post("/api/v1/orders/", _payload(customer, project_name="Bar"), format="json")
    res = auth_client.get("/api/v1/orders/?search=Foo")
    assert res.status_code == 200
    rows = res.data.get("results", res.data)
    assert len(rows) == 1
    assert rows[0]["project_name"] == "Foo"


def test_list_filter_by_status(auth_client, customer):
    auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    SalesOrder.objects.update(status="confirmed")
    res = auth_client.get("/api/v1/orders/?status=confirmed")
    rows = res.data.get("results", res.data)
    assert len(rows) == 1


def test_detail_includes_items(auth_client, customer):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    detail = auth_client.get(f"/api/v1/orders/{oid}/")
    assert detail.status_code == 200
    assert detail.data["items"] == []
    assert detail.data["order_number"].startswith("SO")


def test_patch_updates_project_name(auth_client, customer):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    patch = auth_client.patch(
        f"/api/v1/orders/{oid}/", {"project_name": "Renamed"}, format="json"
    )
    assert patch.status_code == 200
    assert patch.data["project_name"] == "Renamed"


def test_items_action_returns_empty(auth_client, customer):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    items = auth_client.get(f"/api/v1/orders/{oid}/items/")
    assert items.status_code == 200
    assert items.data == []


def test_soft_delete(auth_client, customer):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    delres = auth_client.delete(f"/api/v1/orders/{oid}/")
    assert delres.status_code == 204
    assert auth_client.get(f"/api/v1/orders/{oid}/").status_code == 404


# ---------------- items + recompute -------------------------------------
def test_add_item_recomputes_totals(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    item_res = _add_item(auth_client, oid, gst18)
    assert item_res.status_code == 201, item_res.content
    detail = auth_client.get(f"/api/v1/orders/{oid}/").data
    assert detail["subtotal"] == "100000.00"
    assert detail["total_tax"] == "18000.00"
    assert detail["grand_total"] == "118000.00"
    assert len(detail["items"]) == 1
    assert detail["items"][0]["line_total"] == "118000.00"


def test_patch_item_recomputes(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    item_res = _add_item(auth_client, oid, gst18)
    iid = item_res.data["id"]
    auth_client.patch(
        f"/api/v1/orders/items/{iid}/", {"quantity_ordered": "5"}, format="json"
    )
    detail = auth_client.get(f"/api/v1/orders/{oid}/").data
    assert detail["subtotal"] == "50000.00"
    assert detail["grand_total"] == "59000.00"


def test_delete_item_recomputes(auth_client, customer, gst18):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    item_res = _add_item(auth_client, oid, gst18)
    iid = item_res.data["id"]
    auth_client.delete(f"/api/v1/orders/items/{iid}/")
    detail = auth_client.get(f"/api/v1/orders/{oid}/").data
    assert detail["subtotal"] == "0.00"
    assert detail["grand_total"] == "0.00"


# ---------------- stage machine -----------------------------------------
@pytest.mark.parametrize(
    "chain",
    [
        ["confirmed", "processing", "ready_to_dispatch", "fully_dispatched", "installed", "closed"],
    ],
)
def test_stage_happy_path(auth_client, customer, chain):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    for stage in chain:
        r = auth_client.post(
            f"/api/v1/orders/{oid}/stage/", {"next_stage": stage}, format="json"
        )
        assert r.status_code == 200, r.content
        assert r.data["status"] == stage


def test_stage_rejects_invalid_jump(auth_client, customer):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    r = auth_client.post(
        f"/api/v1/orders/{oid}/stage/", {"next_stage": "installed"}, format="json"
    )
    assert r.status_code == 400
    assert "next_stage" in r.data


def test_stage_confirm_sets_confirmed_at(auth_client, customer):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    r = auth_client.post(
        f"/api/v1/orders/{oid}/stage/", {"next_stage": "confirmed"}, format="json"
    )
    assert r.status_code == 200
    assert r.data["confirmed_at"] is not None


def test_stage_cancel_requires_reason(auth_client, customer):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    bad = auth_client.post(
        f"/api/v1/orders/{oid}/stage/", {"next_stage": "cancelled"}, format="json"
    )
    assert bad.status_code == 400
    assert "cancellation_reason" in bad.data
    good = auth_client.post(
        f"/api/v1/orders/{oid}/stage/",
        {"next_stage": "cancelled", "cancellation_reason": "duplicate"},
        format="json",
    )
    assert good.status_code == 200
    assert good.data["status"] == "cancelled"
    assert good.data["cancellation_reason"] == "duplicate"


def test_stage_cancel_blocked_after_dispatch(auth_client, customer):
    res = auth_client.post("/api/v1/orders/", _payload(customer), format="json")
    oid = res.data["id"]
    for stage in ["confirmed", "processing", "ready_to_dispatch", "fully_dispatched"]:
        auth_client.post(
            f"/api/v1/orders/{oid}/stage/", {"next_stage": stage}, format="json"
        )
    r = auth_client.post(
        f"/api/v1/orders/{oid}/stage/",
        {"next_stage": "cancelled", "cancellation_reason": "x"},
        format="json",
    )
    assert r.status_code == 400


# ---------------- sub-resources ---------------------------------------
def test_milestones_list_and_create(auth_client, customer):
    res = auth_client.post('/api/v1/orders/', _payload(customer), format='json')
    oid = res.data['id']
    empty = auth_client.get(f'/api/v1/orders/{oid}/milestones/')
    assert empty.status_code == 200
    assert empty.data == []
    created = auth_client.post(
        f'/api/v1/orders/{oid}/milestones/',
        {'milestone_name': 'PI', 'target_date': '2026-05-15', 'status': 'pending'},
        format='json',
    )
    assert created.status_code == 201, created.content
    assert created.data['milestone_name'] == 'PI'
    listed = auth_client.get(f'/api/v1/orders/{oid}/milestones/')
    assert len(listed.data) == 1


def test_material_checklist_list_and_create(auth_client, customer):
    res = auth_client.post('/api/v1/orders/', _payload(customer), format='json')
    oid = res.data['id']
    empty = auth_client.get(f'/api/v1/orders/{oid}/material-checklist/')
    assert empty.status_code == 200
    assert empty.data == []
    created = auth_client.post(
        f'/api/v1/orders/{oid}/material-checklist/',
        {'description': 'Pump 5HP', 'required_qty': '10', 'status': 'shortage'},
        format='json',
    )
    assert created.status_code == 201, created.content
    assert created.data['description'] == 'Pump 5HP'


def test_installation_requirement_create_and_update(auth_client, customer):
    res = auth_client.post('/api/v1/orders/', _payload(customer), format='json')
    oid = res.data['id']
    empty = auth_client.get(f'/api/v1/orders/{oid}/installation-requirement/')
    assert empty.status_code == 200
    assert empty.data is None
    put_res = auth_client.put(
        f'/api/v1/orders/{oid}/installation-requirement/',
        {'site_address': '12 Industrial Estate', 'civil_readiness': 'ready'},
        format='json',
    )
    assert put_res.status_code == 201, put_res.content
    assert put_res.data['site_address'] == '12 Industrial Estate'
    patch_res = auth_client.patch(
        f'/api/v1/orders/{oid}/installation-requirement/',
        {'electrical_readiness': 'partial'},
        format='json',
    )
    assert patch_res.status_code == 200
    assert patch_res.data['electrical_readiness'] == 'partial'
    assert patch_res.data['site_address'] == '12 Industrial Estate'
