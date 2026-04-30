"""Customer invoice API tests (Module 7 slice)."""
from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

import pytest

from apps.core.masters import TaxRule
from apps.customers.models import Customer
from apps.documents.models import Invoice, InvoiceItem
from apps.documents.services import (
    aging_buckets,
    bulk_export,
    bulk_send,
    compute_item_totals,
    create_from_order,
    next_invoice_number,
    recompute_totals,
    transition_status,
)
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


@pytest.fixture
def order(customer, gst18):
    so = SalesOrder.objects.create(
        order_number="SO/TEST/00001",
        customer=customer,
        order_date=date.today(),
        status=SalesOrder.Status.PROCESSING,
    )
    from apps.orders.models import SalesOrderItem

    SalesOrderItem.objects.create(
        order=so,
        product_description="Centrifugal Pump 5HP",
        quantity_ordered=Decimal("10"),
        quantity_pending=Decimal("10"),
        unit="nos",
        unit_price=Decimal("10000"),
        discount_percent=Decimal("0"),
        tax_rule=gst18,
        line_total=Decimal("118000"),
    )
    return so


# ---------------------------------------------------------------------------
# Service-level math
# ---------------------------------------------------------------------------
def test_compute_item_totals_with_tax():
    item = InvoiceItem(
        quantity=Decimal("2"),
        unit_price=Decimal("100"),
        discount_amount=Decimal("0"),
        tax_percent=Decimal("18"),
    )
    taxable, tax, line = compute_item_totals(item)
    assert taxable == Decimal("200.00")
    assert tax == Decimal("36.00")
    assert line == Decimal("236.00")


def test_compute_item_totals_with_discount():
    item = InvoiceItem(
        quantity=Decimal("5"),
        unit_price=Decimal("100"),
        discount_amount=Decimal("50"),
        tax_percent=Decimal("10"),
    )
    taxable, tax, line = compute_item_totals(item)
    assert taxable == Decimal("450.00")
    assert tax == Decimal("45.00")
    assert line == Decimal("495.00")


def test_recompute_totals_aggregates(customer, order):
    inv = create_from_order(order)
    # 10 * 10000 = 100000 taxable, 18000 tax, 118000 grand
    inv.refresh_from_db()
    assert inv.subtotal == Decimal("100000.00")
    assert inv.tax_amount == Decimal("18000.00")
    assert inv.grand_total == Decimal("118000.00")


def test_next_invoice_number_uses_inv_prefix():
    n = next_invoice_number()
    assert n.startswith("INV")


# ---------------------------------------------------------------------------
# Status machine
# ---------------------------------------------------------------------------
def test_transition_draft_to_issued(customer, order):
    inv = create_from_order(order)
    transition_status(inv, next_status=Invoice.Status.ISSUED)
    inv.refresh_from_db()
    assert inv.status == Invoice.Status.ISSUED


def test_cannot_issue_invoice_without_items(customer):
    inv = Invoice.objects.create(
        invoice_number=next_invoice_number(),
        order=SalesOrder.objects.create(
            order_number="SO/TEST/EMPTY",
            customer=customer,
            order_date=date.today(),
        ),
        customer=customer,
        invoice_date=date.today(),
        invoice_type=Invoice.InvoiceType.TAX,
    )
    from rest_framework.exceptions import ValidationError

    with pytest.raises(ValidationError):
        transition_status(inv, next_status=Invoice.Status.ISSUED)


def test_cancel_requires_reason(customer, order):
    inv = create_from_order(order)
    from rest_framework.exceptions import ValidationError

    with pytest.raises(ValidationError):
        transition_status(inv, next_status=Invoice.Status.CANCELLED, reason="")


def test_cancel_with_reason_updates_notes(customer, order):
    inv = create_from_order(order)
    transition_status(
        inv, next_status=Invoice.Status.CANCELLED, reason="Duplicate"
    )
    inv.refresh_from_db()
    assert inv.status == Invoice.Status.CANCELLED
    assert "Duplicate" in inv.notes


def test_cannot_revert_from_cancelled(customer, order):
    inv = create_from_order(order)
    transition_status(
        inv, next_status=Invoice.Status.CANCELLED, reason="Mistake"
    )
    from rest_framework.exceptions import ValidationError

    with pytest.raises(ValidationError):
        transition_status(inv, next_status=Invoice.Status.DRAFT)


# ---------------------------------------------------------------------------
# Aging buckets
# ---------------------------------------------------------------------------
def test_aging_buckets(customer, order):
    inv = create_from_order(order)
    transition_status(inv, next_status=Invoice.Status.ISSUED)
    Invoice.objects.filter(id=inv.id).update(invoice_date=date.today() - timedelta(days=45))
    buckets = aging_buckets()
    assert buckets["31-60"]["count"] == 1
    assert buckets["31-60"]["total"] == Decimal("118000.00")
    assert buckets["0-30"]["count"] == 0


# ---------------------------------------------------------------------------
# Bulk
# ---------------------------------------------------------------------------
def test_bulk_export_returns_rows(customer, order):
    inv = create_from_order(order)
    rows = bulk_export([inv.id, 9999])
    assert {r["id"]: r["status"] for r in rows} == {inv.id: "ok", 9999: "error"}
    ok = next(r for r in rows if r["status"] == "ok")
    assert ok["invoice_number"] == inv.invoice_number


def test_bulk_send_transitions_drafts(customer, order):
    inv = create_from_order(order)
    rows = bulk_send([inv.id])
    assert rows[0]["status"] == "ok"
    inv.refresh_from_db()
    assert inv.status == Invoice.Status.ISSUED


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------
def test_api_list_returns_results(auth_client, customer, order):
    create_from_order(order)
    res = auth_client.get("/api/v1/customer-invoices/")
    assert res.status_code == 200
    rows = res.data.get("results", res.data)
    assert len(rows) == 1
    assert rows[0]["customer_name"] == "Acme Pumps Ltd"
    assert rows[0]["order_number"] == "SO/TEST/00001"


def test_api_detail_includes_items(auth_client, customer, order):
    inv = create_from_order(order)
    res = auth_client.get(f"/api/v1/customer-invoices/{inv.id}/")
    assert res.status_code == 200
    assert len(res.data["items"]) == 1
    assert Decimal(res.data["grand_total"]) == Decimal("118000.00")


def test_api_create_from_order_endpoint(auth_client, customer, order):
    res = auth_client.post(
        f"/api/v1/orders/{order.id}/customer-invoices/",
        {"invoice_type": "tax_invoice"},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert res.data["invoice_number"].startswith("INV")
    assert res.data["status"] == "draft"
    assert len(res.data["items"]) == 1


def test_api_list_invoices_for_order(auth_client, customer, order):
    create_from_order(order)
    res = auth_client.get(f"/api/v1/orders/{order.id}/customer-invoices/")
    assert res.status_code == 200
    rows = res.data.get("results", res.data)
    assert len(rows) == 1


def test_api_cannot_edit_after_issue(auth_client, customer, order):
    inv = create_from_order(order)
    transition_status(inv, next_status=Invoice.Status.ISSUED)
    res = auth_client.patch(
        f"/api/v1/customer-invoices/{inv.id}/",
        {"notes": "later edit"},
        format="json",
    )
    assert res.status_code == 400


def test_api_finalise_endpoint(auth_client, customer, order):
    inv = create_from_order(order)
    res = auth_client.post(f"/api/v1/customer-invoices/{inv.id}/finalise/", {}, format="json")
    assert res.status_code == 200
    assert res.data["status"] == "issued"


def test_api_cancel_requires_reason(auth_client, customer, order):
    inv = create_from_order(order)
    res = auth_client.post(
        f"/api/v1/customer-invoices/{inv.id}/cancel/", {}, format="json"
    )
    assert res.status_code == 400


def test_api_cancel_with_reason(auth_client, customer, order):
    inv = create_from_order(order)
    res = auth_client.post(
        f"/api/v1/customer-invoices/{inv.id}/cancel/",
        {"reason": "Customer requested"},
        format="json",
    )
    assert res.status_code == 200
    assert res.data["status"] == "cancelled"


def test_api_add_item_recomputes_totals(auth_client, customer, order):
    inv = create_from_order(order)
    res = auth_client.post(
        f"/api/v1/customer-invoices/{inv.id}/items/",
        {
            "description": "Spare kit",
            "quantity": "1",
            "unit": "nos",
            "unit_price": "1000",
            "discount_amount": "0",
            "tax_percent": "18",
        },
        format="json",
    )
    assert res.status_code == 201, res.content
    inv.refresh_from_db()
    assert inv.grand_total == Decimal("119180.00")  # 118000 + 1180


def test_api_cannot_add_item_when_issued(auth_client, customer, order):
    inv = create_from_order(order)
    transition_status(inv, next_status=Invoice.Status.ISSUED)
    res = auth_client.post(
        f"/api/v1/customer-invoices/{inv.id}/items/",
        {
            "description": "Spare",
            "quantity": "1",
            "unit": "nos",
            "unit_price": "100",
            "discount_amount": "0",
            "tax_percent": "0",
        },
        format="json",
    )
    assert res.status_code == 400


def test_api_patch_item_recomputes(auth_client, customer, order):
    inv = create_from_order(order)
    item_id = inv.items.first().id
    res = auth_client.patch(
        f"/api/v1/customer-invoices/items/{item_id}/",
        {"quantity": "5"},
        format="json",
    )
    assert res.status_code == 200, res.content
    inv.refresh_from_db()
    # 5 * 10000 = 50000 + 18% = 59000
    assert inv.grand_total == Decimal("59000.00")


def test_api_delete_item_recomputes(auth_client, customer, order):
    inv = create_from_order(order)
    item_id = inv.items.first().id
    res = auth_client.delete(f"/api/v1/customer-invoices/items/{item_id}/")
    assert res.status_code == 204
    inv.refresh_from_db()
    assert inv.grand_total == Decimal("0.00")


def test_api_aging_endpoint(auth_client, customer, order):
    inv = create_from_order(order)
    transition_status(inv, next_status=Invoice.Status.ISSUED)
    res = auth_client.get("/api/v1/customer-invoices/aging/")
    assert res.status_code == 200
    assert "0-30" in res.data
    assert "31-60" in res.data
    assert "61-90" in res.data
    assert "90+" in res.data


def test_api_bulk_export(auth_client, customer, order):
    inv = create_from_order(order)
    res = auth_client.post(
        "/api/v1/customer-invoices/bulk-export/",
        {"ids": [inv.id]},
        format="json",
    )
    assert res.status_code == 200
    assert len(res.data["results"]) == 1
    assert res.data["results"][0]["status"] == "ok"


def test_api_bulk_send_partial(auth_client, customer, order):
    inv1 = create_from_order(order)
    res = auth_client.post(
        "/api/v1/customer-invoices/bulk-send/",
        {"ids": [inv1.id, 9999]},
        format="json",
    )
    assert res.status_code == 207
    inv1.refresh_from_db()
    assert inv1.status == Invoice.Status.ISSUED


def test_api_bulk_empty_ids_400(auth_client):
    res = auth_client.post(
        "/api/v1/customer-invoices/bulk-export/",
        {"ids": []},
        format="json",
    )
    assert res.status_code == 400
