"""Auth flow tests — login, refresh, logout, me, change/forgot/reset."""
import pytest


pytestmark = pytest.mark.django_db


def test_login_returns_access_and_refresh(api_client, user):
    res = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    assert res.status_code == 200
    assert "access" in res.data and "refresh" in res.data
    assert res.data["user"]["email"] == user.email


def test_login_wrong_password_returns_400_no_enumeration(api_client, user):
    res = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": "wrong"},
        format="json",
    )
    assert res.status_code == 400
    assert "Invalid credentials" in str(res.data)


def test_login_inactive_user_blocked(api_client, user):
    user.is_active = False
    user.save()
    res = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    assert res.status_code == 400


def test_me_requires_auth(api_client):
    assert api_client.get("/api/auth/me").status_code == 401


def test_me_returns_user(auth_client, user):
    res = auth_client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.data["email"] == user.email


def test_me_patch_updates_profile(auth_client):
    res = auth_client.patch("/api/auth/me", {"first_name": "Alicia"}, format="json")
    assert res.status_code == 200
    assert res.data["first_name"] == "Alicia"


def test_logout_blacklists_refresh(auth_client, api_client):
    refresh = auth_client.refresh_token
    res = auth_client.post("/api/auth/logout", {"refresh": refresh}, format="json")
    assert res.status_code == 204
    # Refresh again should fail
    res2 = api_client.post("/api/auth/refresh", {"refresh": refresh}, format="json")
    assert res2.status_code == 401


def test_change_password_requires_old(auth_client):
    res = auth_client.post(
        "/api/auth/change-password",
        {"old_password": "wrong", "new_password": "NewStr0ng!Pw"},
        format="json",
    )
    assert res.status_code == 400


def test_change_password_success(auth_client, user, api_client):
    res = auth_client.post(
        "/api/auth/change-password",
        {"old_password": "StrongP@ssw0rd!", "new_password": "NewStr0ng!Pw"},
        format="json",
    )
    assert res.status_code == 200
    # Old password no longer works
    bad = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    assert bad.status_code == 400


def test_forgot_then_reset_flow(api_client, user, settings):
    settings.DEBUG = True
    res = api_client.post("/api/auth/forgot", {"email": user.email}, format="json")
    assert res.status_code == 200
    token = res.data["token"]
    res2 = api_client.post(
        "/api/auth/reset",
        {"token": token, "new_password": "Reset3d!Pw"},
        format="json",
    )
    assert res2.status_code == 200
    # Token cannot be reused
    res3 = api_client.post(
        "/api/auth/reset",
        {"token": token, "new_password": "Anoth3r!Pw"},
        format="json",
    )
    assert res3.status_code == 400


def test_forgot_unknown_email_returns_generic(api_client):
    res = api_client.post("/api/auth/forgot", {"email": "nobody@x.com"}, format="json")
    assert res.status_code == 200
    assert "token" not in res.data
