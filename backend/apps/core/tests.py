"""Smoke test — keeps pytest green until domain apps land."""
from django.test import Client


def test_health_endpoint_returns_ok():
    client = Client()
    response = client.get("/api/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_openapi_schema_renders():
    client = Client()
    response = client.get("/api/schema/")
    assert response.status_code == 200
