"""Tests for TaxRule + Attachment masters API."""
import io

from django.core.files.uploadedfile import SimpleUploadedFile

from apps.core.masters import Attachment, TaxRule


def test_tax_rule_crud(auth_client):
    res = auth_client.post(
        "/api/v1/tax-rules/",
        {
            "name": "GST 18%",
            "tax_type": "GST",
            "rate_percent": "18.00",
            "applicable_to": "product",
            "is_active": True,
        },
        format="json",
    )
    assert res.status_code == 201, res.content
    rid = res.data["id"]

    res = auth_client.patch(
        f"/api/v1/tax-rules/{rid}/", {"rate_percent": "12.00"}, format="json"
    )
    assert res.status_code == 200
    assert res.data["rate_percent"] == "12.00"

    res = auth_client.delete(f"/api/v1/tax-rules/{rid}/")
    assert res.status_code == 204
    assert TaxRule.objects.filter(pk=rid).count() == 0  # soft-deleted hidden


def test_attachment_upload_and_version_bump(auth_client):
    file1 = SimpleUploadedFile(
        "spec.pdf", b"%PDF-1.4 fake content", content_type="application/pdf"
    )
    res1 = auth_client.post(
        "/api/v1/attachments/",
        {"entity_type": "quotation", "entity_id": 42, "file": file1},
        format="multipart",
    )
    assert res1.status_code == 201, res1.content
    assert res1.data["version"] == 1
    assert res1.data["is_latest"] is True

    file2 = SimpleUploadedFile(
        "spec.pdf", b"%PDF-1.4 newer", content_type="application/pdf"
    )
    res2 = auth_client.post(
        "/api/v1/attachments/",
        {"entity_type": "quotation", "entity_id": 42, "file": file2},
        format="multipart",
    )
    assert res2.status_code == 201
    assert res2.data["version"] == 2
    assert res2.data["is_latest"] is True

    # Older row should now be is_latest=False.
    older = Attachment.objects.get(pk=res1.data["id"])
    assert older.is_latest is False


def test_attachment_rejects_bad_mime(auth_client):
    bad = SimpleUploadedFile(
        "evil.exe", b"MZ\x90\x00", content_type="application/x-msdownload"
    )
    res = auth_client.post(
        "/api/v1/attachments/",
        {"entity_type": "quotation", "entity_id": 1, "file": bad},
        format="multipart",
    )
    assert res.status_code == 400
    assert "file" in res.data


def test_attachment_rejects_bad_entity_type(auth_client):
    f = SimpleUploadedFile("a.pdf", b"%PDF-1.4", content_type="application/pdf")
    res = auth_client.post(
        "/api/v1/attachments/",
        {"entity_type": "alien", "entity_id": 1, "file": f},
        format="multipart",
    )
    assert res.status_code == 400


def test_attachment_filter_by_entity(auth_client):
    f = SimpleUploadedFile("x.pdf", b"%PDF-1.4", content_type="application/pdf")
    auth_client.post(
        "/api/v1/attachments/",
        {"entity_type": "inquiry", "entity_id": 7, "file": f},
        format="multipart",
    )
    res = auth_client.get("/api/v1/attachments/?entity_type=inquiry&entity_id=7")
    assert res.status_code == 200
    assert res.data["count"] == 1
