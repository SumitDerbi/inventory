"""Users + roles + permission matrix tests."""
import pytest

from apps.auth_ext.models import Permission, Role, RolePermission, User, UserRoleMapping


pytestmark = pytest.mark.django_db


@pytest.fixture
def admin_client(api_client, admin_user):
    res = api_client.post(
        "/api/auth/login",
        {"email": admin_user.email, "password": "StrongP@ssw0rd!"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    return api_client


def test_users_list_denied_for_non_admin(auth_client):
    assert auth_client.get("/api/users/").status_code == 403


def test_users_list_admin(admin_client):
    res = admin_client.get("/api/users/")
    assert res.status_code == 200


def test_users_create_with_role(admin_client):
    Role.objects.create(name="Sales", code="sales")
    res = admin_client.post(
        "/api/users/",
        {
            "email": "bob@example.com",
            "username": "bob",
            "first_name": "Bob",
            "password": "StrongP@ssw0rd!",
            "role_codes": ["sales"],
        },
        format="json",
    )
    assert res.status_code == 201, res.data
    bob = User.objects.get(email="bob@example.com")
    assert bob.role_mappings.filter(role__code="sales").exists()


def test_users_delete_soft_disables(admin_client, user):
    res = admin_client.delete(f"/api/users/{user.id}/")
    assert res.status_code == 204
    user.refresh_from_db()
    assert user.is_active is False


def test_role_crud(admin_client):
    res = admin_client.post(
        "/api/roles/",
        {"name": "Engineer", "code": "engineer", "description": "Field eng."},
        format="json",
    )
    assert res.status_code == 201
    rid = res.data["id"]
    res2 = admin_client.get(f"/api/roles/{rid}/")
    assert res2.data["code"] == "engineer"


def test_role_permission_matrix_put_validates_unknown(admin_client):
    role = Role.objects.create(name="Sales", code="sales")
    res = admin_client.put(
        f"/api/roles/{role.id}/permissions/",
        {"permission_codes": ["ghost.action"]},
        format="json",
    )
    assert res.status_code == 400


def test_role_permission_matrix_get_put(admin_client):
    role = Role.objects.create(name="Sales", code="sales")
    Permission.objects.create(module="quotation", action="approve", code="quotation.approve")
    Permission.objects.create(module="quotation", action="view", code="quotation.view")
    res = admin_client.put(
        f"/api/roles/{role.id}/permissions/",
        {"permission_codes": ["quotation.approve", "quotation.view"]},
        format="json",
    )
    assert res.status_code == 200
    assert RolePermission.objects.filter(role=role).count() == 2
    res2 = admin_client.get(f"/api/roles/{role.id}/permissions/")
    assert sorted(res2.data["permission_codes"]) == ["quotation.approve", "quotation.view"]


def test_permissions_list(auth_client):
    Permission.objects.create(module="order", action="create", code="order.create")
    res = auth_client.get("/api/permissions/")
    assert res.status_code == 200
    assert res.data["count"] >= 1
