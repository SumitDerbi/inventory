"""Tests for ProductCategory + Brand lookup APIs."""


def test_product_category_crud(auth_client):
    res = auth_client.post(
        "/api/v1/product-categories/",
        {"name": "Solar", "description": "Solar panels", "is_active": True},
        format="json",
    )
    assert res.status_code == 201, res.content
    cid = res.data["id"]

    sub = auth_client.post(
        "/api/v1/product-categories/",
        {"name": "Inverter", "parent_category": cid, "is_active": True},
        format="json",
    )
    assert sub.status_code == 201

    listing = auth_client.get("/api/v1/product-categories/")
    assert listing.data["count"] == 2


def test_brand_crud(auth_client):
    res = auth_client.post(
        "/api/v1/brands/",
        {"name": "Acme", "country_of_origin": "India", "is_active": True},
        format="json",
    )
    assert res.status_code == 201
    listing = auth_client.get("/api/v1/brands/?search=Acme")
    assert listing.data["count"] == 1
