"""Sales order API tests (Step 07a — list/detail)."""
from __future__ import annotations

from datetime import date

import pytest

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


def _payload(customer, **overrides):
    base = {
        "customer": customer.id,
        "project_name": "Phase 1 Pumps",
        "order_date": date.today().isoformat(),
    }
    base.update(overrides)
    return base


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
