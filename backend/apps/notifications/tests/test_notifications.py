"""Tests for Notification API."""
from apps.notifications.models import Notification


def _make(user, **kwargs):
    defaults = {
        "user": user,
        "type": "inquiry_assigned",
        "title": "Test",
        "message": "hi",
    }
    defaults.update(kwargs)
    return Notification.objects.create(**defaults)


def test_list_only_my_notifications(auth_client, user, admin_user):
    _make(user, title="mine")
    _make(admin_user, title="theirs")
    res = auth_client.get("/api/v1/notifications/")
    assert res.status_code == 200
    titles = [n["title"] for n in res.data["results"]]
    assert titles == ["mine"]


def test_mark_read(auth_client, user):
    n = _make(user)
    res = auth_client.patch(f"/api/v1/notifications/{n.id}/read/")
    assert res.status_code == 200
    assert res.data["is_read"] is True
    n.refresh_from_db()
    assert n.is_read is True
    assert n.read_at is not None


def test_mark_all_read(auth_client, user):
    _make(user)
    _make(user)
    _make(user, is_read=True)
    res = auth_client.post("/api/v1/notifications/mark-all-read/")
    assert res.status_code == 200
    assert res.data["updated"] == 2


def test_unread_count(auth_client, user):
    _make(user)
    _make(user)
    res = auth_client.get("/api/v1/notifications/unread-count/")
    assert res.data["count"] == 2
