"""Pytest config — common fixtures + DB enable."""
import pytest
from django.conf import settings


@pytest.fixture(autouse=True)
def _enable_db(db):
    """Auto-enable DB for every test in this app."""
    yield


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        username="alice@example.com",
        email="alice@example.com",
        password="StrongP@ssw0rd!",
        first_name="Alice",
    )


@pytest.fixture
def admin_user(django_user_model):
    return django_user_model.objects.create_superuser(
        username="admin@example.com",
        email="admin@example.com",
        password="StrongP@ssw0rd!",
    )


@pytest.fixture
def auth_client(api_client, user):
    res = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    api_client.refresh_token = res.data["refresh"]  # type: ignore[attr-defined]
    return api_client


@pytest.fixture(autouse=True)
def _disable_throttle(settings):
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_RATES": {"anon": None, "user": None},
    }
