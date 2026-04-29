"""Tests for InquirySource lookup API."""


def test_inquiry_source_crud(auth_client):
    res = auth_client.post(
        "/api/v1/inquiry-sources/",
        {"name": "Website", "is_active": True},
        format="json",
    )
    assert res.status_code == 201, res.content
    sid = res.data["id"]

    res = auth_client.get("/api/v1/inquiry-sources/")
    assert res.status_code == 200
    assert res.data["count"] == 1

    res = auth_client.patch(
        f"/api/v1/inquiry-sources/{sid}/", {"is_active": False}, format="json"
    )
    assert res.status_code == 200
    assert res.data["is_active"] is False

    res = auth_client.delete(f"/api/v1/inquiry-sources/{sid}/")
    assert res.status_code == 204
