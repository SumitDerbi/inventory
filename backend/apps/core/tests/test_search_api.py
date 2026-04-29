"""Step 04c: Global search API tests."""
from __future__ import annotations

import pytest


@pytest.fixture
def seed_inquiry(user):
    from apps.customers.models import Customer
    from apps.inquiries.models import Inquiry, InquirySource

    customer = Customer.objects.create(
        company_name="Acme Pumps Ltd",
        mobile="9999900001",
        status=Customer.Status.ACTIVE,
    )
    src = InquirySource.objects.create(name="Website")
    return Inquiry.objects.create(
        inquiry_number="INQ-2026-014",
        source=src,
        customer=customer,
        customer_name="Bob Builder",
        company_name="Acme Pumps Ltd",
        mobile="9999900001",
        inquiry_type=Inquiry.InquiryType.NEW_PROJECT,
        status=Inquiry.Status.NEW,
        priority=Inquiry.Priority.HIGH,
    )


def _grant_admin_role(user):
    """Give the regular `user` an admin role so they pass `xxx.list` permission checks.

    Search RBAC checks `user.role_mappings.filter(role__role_permissions__permission__code=...)`
    so we need to ensure the user has the relevant permission codes.
    """
    from apps.auth_ext.models import (
        Permission,
        Role,
        RolePermission,
        UserRoleMapping,
    )

    role, _ = Role.objects.get_or_create(code="searcher", defaults={"name": "Searcher"})
    perms = [
        ("customer", "list"),
        ("inquiry", "list"),
        ("quotation", "list"),
        ("order", "list"),
        ("job", "list"),
        ("document", "list"),
    ]
    for module, action in perms:
        perm, _ = Permission.objects.get_or_create(
            module=module, action=action, defaults={"code": f"{module}.{action}"}
        )
        RolePermission.objects.get_or_create(role=role, permission=perm)
    UserRoleMapping.objects.get_or_create(user=user, role=role, defaults={"assigned_by": user})


class TestSearchValidation:
    def test_min_two_chars(self, auth_client):
        r = auth_client.get("/api/v1/search/?q=a")
        assert r.status_code == 400

    def test_unknown_type_400(self, auth_client):
        r = auth_client.get("/api/v1/search/?q=foo&type=banana")
        assert r.status_code == 400
        assert "supported" in r.data

    def test_anonymous_unauthorized(self, api_client):
        r = api_client.get("/api/v1/search/?q=foo")
        assert r.status_code in (401, 403)


class TestSearchResults:
    def test_finds_inquiry_by_number(self, auth_client, user, seed_inquiry):
        _grant_admin_role(user)
        r = auth_client.get("/api/v1/search/?q=INQ-2026")
        assert r.status_code == 200, r.data
        types = {row["type"] for row in r.data["results"]}
        assert "inquiry" in types
        first = next(x for x in r.data["results"] if x["type"] == "inquiry")
        assert first["matched_field"] == "inquiry_number"
        assert first["href"] == f"/inquiries/{seed_inquiry.pk}"

    def test_rbac_filters_inquiry_when_no_permission(self, auth_client, user, seed_inquiry):
        # No role granted -> no inquiry rows
        r = auth_client.get("/api/v1/search/?q=INQ-2026")
        assert r.status_code == 200
        inquiry_rows = [x for x in r.data["results"] if x["type"] == "inquiry"]
        assert inquiry_rows == []

    def test_type_filter_restricts(self, auth_client, user, seed_inquiry):
        _grant_admin_role(user)
        r = auth_client.get("/api/v1/search/?q=acme&type=customer")
        assert r.status_code == 200
        types = {row["type"] for row in r.data["results"]}
        assert types <= {"customer"}

    def test_limit_respected(self, auth_client, user):
        _grant_admin_role(user)
        from apps.customers.models import Customer

        for i in range(5):
            Customer.objects.create(
                company_name=f"Acme {i:02d} Pvt Ltd", mobile=f"9{i:09d}", status=Customer.Status.ACTIVE
            )
        r = auth_client.get("/api/v1/search/?q=acme&type=customer&limit=2")
        assert r.status_code == 200
        rows = [x for x in r.data["results"] if x["type"] == "customer"]
        assert len(rows) <= 2

    def test_prefix_outranks_substring(self, auth_client, user):
        _grant_admin_role(user)
        from apps.customers.models import Customer

        a = Customer.objects.create(company_name="Banana Bread Co", mobile="1", status=Customer.Status.ACTIVE)
        b = Customer.objects.create(company_name="Big Banana Holdings", mobile="2", status=Customer.Status.ACTIVE)
        r = auth_client.get("/api/v1/search/?q=banana&type=customer")
        assert r.status_code == 200
        rows = [x for x in r.data["results"] if x["type"] == "customer"]
        # `Banana Bread Co` is a prefix match → score 1.0; `Big Banana ...` substring → 0.5
        assert rows[0]["title"].startswith("Banana")
        assert rows[0]["score"] >= rows[-1]["score"]
        assert rows[0]["id"] == f"customer_{a.pk}"

    def test_response_shape(self, auth_client, user, seed_inquiry):
        _grant_admin_role(user)
        r = auth_client.get("/api/v1/search/?q=INQ")
        assert r.status_code == 200
        assert "results" in r.data and "took_ms" in r.data
        for row in r.data["results"]:
            for key in ("id", "type", "title", "subtitle", "href", "matched_field", "score"):
                assert key in row
