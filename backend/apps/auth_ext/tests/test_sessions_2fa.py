"""Sessions + 2FA tests."""
import pyotp
import pytest

from apps.auth_ext.models import AuthSession, User2FA


pytestmark = pytest.mark.django_db


def test_sessions_list_includes_current(auth_client, user):
    res = auth_client.get("/api/auth/sessions")
    assert res.status_code == 200
    assert len(res.data) == 1
    assert res.data[0]["is_current"] is True


def test_logout_others_revokes_all_but_current(api_client, user):
    # Login twice — two sessions
    r1 = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    r2 = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {r2.data['access']}")
    res = api_client.post("/api/auth/sessions/logout-others", format="json")
    assert res.status_code == 200
    assert res.data["revoked"] == 1
    assert AuthSession.objects.filter(user=user).count() == 1


def test_session_logout_current_session_rejected(auth_client, user):
    session = AuthSession.objects.filter(user=user).first()
    res = auth_client.post(f"/api/auth/sessions/{session.id}/logout", format="json")
    assert res.status_code == 400


def test_2fa_enable_confirm_and_login_flow(auth_client, user, api_client):
    res = auth_client.post("/api/auth/2fa/enable", format="json")
    assert res.status_code == 200
    secret = res.data["secret"]
    assert "<svg" in res.data["qr_svg"]

    code = pyotp.TOTP(secret).now()
    res2 = auth_client.post("/api/auth/2fa/confirm", {"code": code}, format="json")
    assert res2.status_code == 200
    rec_codes = res2.data["recovery_codes"]
    assert len(rec_codes) == 8

    # Now login flow returns requires_otp
    api_client.credentials()  # clear auth
    r3 = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    assert r3.status_code == 200
    assert r3.data.get("requires_otp") is True
    otp_token = r3.data["otp_token"]

    # Bad code → 401
    bad = api_client.post(
        "/api/auth/login/verify-otp",
        {"otp_token": otp_token, "code": "000000"},
        format="json",
    )
    assert bad.status_code == 401

    # Recovery code consumed (single use)
    used = rec_codes[0]
    ok = api_client.post(
        "/api/auth/login/verify-otp",
        {"otp_token": otp_token, "recovery_code": used},
        format="json",
    )
    assert ok.status_code == 200
    assert "access" in ok.data
    tfa = User2FA.objects.get(user=user)
    assert len(tfa.recovery_codes) == 7


def test_2fa_disable_requires_password(auth_client):
    auth_client.post("/api/auth/2fa/enable", format="json")
    res = auth_client.post("/api/auth/2fa/disable", {"password": "wrong"}, format="json")
    assert res.status_code == 403
    res2 = auth_client.post(
        "/api/auth/2fa/disable", {"password": "StrongP@ssw0rd!"}, format="json"
    )
    assert res2.status_code == 204
