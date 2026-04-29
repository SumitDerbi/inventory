"""Tests for customers + contacts + addresses + merge."""
import pytest

from apps.customers.models import Address, Contact, Customer


CUSTOMER_PAYLOAD = {
    "customer_type": "company",
    "company_name": "Acme Industries",
    "contact_person_name": "Bob",
    "mobile": "9876543210",
    "email": "bob@acme.example",
    "gst_number": "27ABCDE1234F1Z5",
    "pan_number": "ABCDE1234F",
    "address_line1": "1 Main Rd",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "credit_limit": "100000.00",
    "credit_days": 30,
}


def test_create_customer_happy_path(auth_client):
    res = auth_client.post("/api/v1/customers/", CUSTOMER_PAYLOAD, format="json")
    assert res.status_code == 201, res.content
    assert res.data["company_name"] == "Acme Industries"
    assert "matches" not in res.data  # first row → no duplicates


def test_create_customer_invalid_mobile(auth_client):
    payload = {**CUSTOMER_PAYLOAD, "mobile": "12345"}
    res = auth_client.post("/api/v1/customers/", payload, format="json")
    assert res.status_code == 400
    assert "mobile" in res.data


def test_create_customer_invalid_gst(auth_client):
    payload = {**CUSTOMER_PAYLOAD, "gst_number": "BADGST"}
    res = auth_client.post("/api/v1/customers/", payload, format="json")
    assert res.status_code == 400
    assert "gst_number" in res.data


def test_create_returns_match_hint_on_duplicate_mobile(auth_client):
    auth_client.post("/api/v1/customers/", CUSTOMER_PAYLOAD, format="json")
    second = {**CUSTOMER_PAYLOAD, "company_name": "Acme Branch", "email": "alt@acme.example"}
    res = auth_client.post("/api/v1/customers/", second, format="json")
    assert res.status_code == 201
    assert res.data["matches"], res.data
    assert "mobile" in res.data["matches"][0]["match_reasons"]


def test_list_filters_and_search(auth_client):
    auth_client.post("/api/v1/customers/", CUSTOMER_PAYLOAD, format="json")
    res = auth_client.get("/api/v1/customers/?search=Acme")
    assert res.status_code == 200
    assert res.data["count"] == 1


def test_find_duplicates_by_email(auth_client):
    auth_client.post("/api/v1/customers/", CUSTOMER_PAYLOAD, format="json")
    res = auth_client.get("/api/v1/customers/find-duplicates/?email=bob@acme.example")
    assert res.status_code == 200
    assert len(res.data["matches"]) == 1
    assert "email" in res.data["matches"][0]["match_reasons"]


def test_find_duplicates_excludes_self(auth_client):
    res1 = auth_client.post("/api/v1/customers/", CUSTOMER_PAYLOAD, format="json")
    res = auth_client.get(
        f"/api/v1/customers/find-duplicates/?mobile=9876543210&exclude_id={res1.data['id']}"
    )
    assert res.data["matches"] == []


def test_search_endpoint_combined(auth_client):
    auth_client.post("/api/v1/customers/", CUSTOMER_PAYLOAD, format="json")
    res = auth_client.get("/api/v1/customers/search/?q=9876543210")
    assert res.status_code == 200
    assert len(res.data["results"]) == 1


def test_soft_delete_hides_from_list(auth_client):
    res = auth_client.post("/api/v1/customers/", CUSTOMER_PAYLOAD, format="json")
    cid = res.data["id"]
    auth_client.delete(f"/api/v1/customers/{cid}/")
    res2 = auth_client.get("/api/v1/customers/")
    assert res2.data["count"] == 0


def test_soft_delete_visible_to_admin_with_include_deleted(admin_client, auth_client):
    res = auth_client.post("/api/v1/customers/", CUSTOMER_PAYLOAD, format="json")
    cid = res.data["id"]
    auth_client.delete(f"/api/v1/customers/{cid}/")
    res2 = admin_client.get("/api/v1/customers/?include_deleted=true")
    assert res2.data["count"] == 1


def test_nested_contacts_addresses(auth_client):
    res = auth_client.post("/api/v1/customers/", CUSTOMER_PAYLOAD, format="json")
    cid = res.data["id"]
    auth_client.post(
        "/api/v1/contacts/",
        {
            "customer": cid,
            "name": "Alice",
            "mobile": "9876500001",
            "email": "alice@acme.example",
            "is_primary": True,
        },
        format="json",
    )
    auth_client.post(
        "/api/v1/addresses/",
        {
            "customer": cid,
            "address_type": "billing",
            "label": "HQ",
            "address_line1": "1 Main",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411001",
            "is_default": True,
        },
        format="json",
    )
    res2 = auth_client.get(f"/api/v1/customers/{cid}/contacts/")
    assert len(res2.data) == 1
    res3 = auth_client.get(f"/api/v1/customers/{cid}/addresses/")
    assert len(res3.data) == 1


# -----------------------------------------------------------------
# Merge
# -----------------------------------------------------------------
def _create_two(auth_client):
    a = auth_client.post(
        "/api/v1/customers/",
        {**CUSTOMER_PAYLOAD, "mobile": "9876500010", "email": "a@acme.example"},
        format="json",
    ).data
    b = auth_client.post(
        "/api/v1/customers/",
        {
            **CUSTOMER_PAYLOAD,
            "company_name": "Acme HQ",
            "mobile": "9876500011",
            "email": "b@acme.example",
            "gst_number": "27ABCDE1234F2Z5",
        },
        format="json",
    ).data
    return a, b


def test_merge_preview_lists_conflicts(auth_client):
    a, b = _create_two(auth_client)
    res = auth_client.post(
        f"/api/v1/customers/{a['id']}/merge-preview/",
        {"target_id": b["id"]},
        format="json",
    )
    assert res.status_code == 200
    assert res.data["preview_hash"]
    fields = {c["field"] for c in res.data["conflicts"]}
    assert "company_name" in fields
    assert "email" in fields


def test_merge_moves_contacts_and_marks_source(auth_client):
    a, b = _create_two(auth_client)
    auth_client.post(
        "/api/v1/contacts/",
        {"customer": a["id"], "name": "A1", "mobile": "9876500020"},
        format="json",
    )
    preview = auth_client.post(
        f"/api/v1/customers/{a['id']}/merge-preview/",
        {"target_id": b["id"]},
        format="json",
    ).data
    res = auth_client.post(
        f"/api/v1/customers/{a['id']}/merge/",
        {
            "target_id": b["id"],
            "preview_hash": preview["preview_hash"],
            "field_choices": {"company_name": "source"},
        },
        format="json",
    )
    assert res.status_code == 200, res.content
    assert res.data["merged_into"] == b["id"]
    assert res.data["moved"]["contacts"] == 1
    src = Customer.objects.get(pk=a["id"])
    assert src.status == "merged"
    assert src.merged_into_id == b["id"]
    tgt = Customer.objects.get(pk=b["id"])
    assert tgt.company_name == "Acme Industries"  # source value applied


def test_merge_hash_mismatch_returns_409(auth_client):
    a, b = _create_two(auth_client)
    res = auth_client.post(
        f"/api/v1/customers/{a['id']}/merge/",
        {"target_id": b["id"], "preview_hash": "deadbeefdeadbeef"},
        format="json",
    )
    assert res.status_code == 409
    assert res.data["detail"] == "HASH_MISMATCH"


def test_merge_chained_returns_409(auth_client):
    a, b = _create_two(auth_client)
    preview = auth_client.post(
        f"/api/v1/customers/{a['id']}/merge-preview/",
        {"target_id": b["id"]},
        format="json",
    ).data
    auth_client.post(
        f"/api/v1/customers/{a['id']}/merge/",
        {"target_id": b["id"], "preview_hash": preview["preview_hash"]},
        format="json",
    )
    # Try to merge already-merged source again.
    res = auth_client.post(
        f"/api/v1/customers/{a['id']}/merge/",
        {"target_id": b["id"], "preview_hash": "x" * 16},
        format="json",
    )
    assert res.status_code == 409
    assert res.data["detail"] == "CHAINED_MERGE"
