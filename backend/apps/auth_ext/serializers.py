"""DRF serializers for auth_ext."""
from __future__ import annotations

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import (
    AuditLog,
    AuthSession,
    Permission,
    Role,
    RolePermission,
    User,
    UserRoleMapping,
)


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "mobile",
            "employee_code",
            "department",
            "designation",
            "profile_photo",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
            "roles",
        )
        read_only_fields = ("id", "is_superuser", "date_joined", "last_login", "roles")

    def get_roles(self, obj: User) -> list[str]:
        return list(
            obj.role_mappings.filter(role__is_active=True).values_list("role__code", flat=True)
        )


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    role_codes = serializers.ListField(
        child=serializers.CharField(), required=False, write_only=True
    )

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "mobile",
            "employee_code",
            "department",
            "designation",
            "is_active",
            "password",
            "role_codes",
        )
        read_only_fields = ("id",)

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data: dict) -> User:
        password = validated_data.pop("password")
        role_codes = validated_data.pop("role_codes", [])
        if not validated_data.get("username"):
            validated_data["username"] = validated_data["email"]
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        if role_codes:
            roles = Role.objects.filter(code__in=role_codes, is_active=True)
            for role in roles:
                UserRoleMapping.objects.create(user=user, role=role)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    role_codes = serializers.ListField(
        child=serializers.CharField(), required=False, write_only=True
    )

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "mobile",
            "employee_code",
            "department",
            "designation",
            "profile_photo",
            "is_active",
            "role_codes",
        )

    def update(self, instance: User, validated_data: dict) -> User:
        role_codes = validated_data.pop("role_codes", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if role_codes is not None:
            instance.role_mappings.all().delete()
            roles = Role.objects.filter(code__in=role_codes, is_active=True)
            for role in roles:
                UserRoleMapping.objects.create(user=instance, role=role)
        return instance


# ---------------------------------------------------------------------------
# Role + Permission
# ---------------------------------------------------------------------------
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("id", "module", "action", "code", "description")


class RoleSerializer(serializers.ModelSerializer):
    permission_codes = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = (
            "id",
            "name",
            "code",
            "description",
            "is_system_role",
            "is_active",
            "permission_codes",
        )
        read_only_fields = ("id", "is_system_role", "permission_codes")

    def get_permission_codes(self, obj: Role) -> list[str]:
        return list(obj.role_permissions.values_list("permission__code", flat=True))


class RolePermissionMatrixSerializer(serializers.Serializer):
    permission_codes = serializers.ListField(child=serializers.CharField())

    def validate_permission_codes(self, value: list[str]) -> list[str]:
        existing = set(Permission.objects.filter(code__in=value).values_list("code", flat=True))
        unknown = sorted(set(value) - existing)
        if unknown:
            raise serializers.ValidationError(f"Unknown permission codes: {unknown}")
        return value


# ---------------------------------------------------------------------------
# Auth — login / refresh / logout / passwords / 2FA
# ---------------------------------------------------------------------------
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs: dict) -> dict:
        email = attrs["email"].strip().lower()
        password = attrs["password"]
        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid credentials."})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "Account is inactive."})
        attrs["user"] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value: str) -> str:
        validate_password(value)
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value: str) -> str:
        validate_password(value)
        return value


class TwoFAEnableResponseSerializer(serializers.Serializer):
    secret = serializers.CharField()
    otpauth_url = serializers.CharField()
    qr_svg = serializers.CharField()


class TwoFAConfirmSerializer(serializers.Serializer):
    code = serializers.CharField()


class TwoFADisableSerializer(serializers.Serializer):
    password = serializers.CharField()


class OtpVerifySerializer(serializers.Serializer):
    otp_token = serializers.CharField()
    code = serializers.CharField(required=False, allow_blank=True)
    recovery_code = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs: dict) -> dict:
        if not attrs.get("code") and not attrs.get("recovery_code"):
            raise serializers.ValidationError("Provide `code` or `recovery_code`.")
        return attrs


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------
class AuthSessionSerializer(serializers.ModelSerializer):
    is_current = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = AuthSession
        fields = (
            "id",
            "device",
            "user_agent",
            "ip_address",
            "location",
            "created_at",
            "last_seen_at",
            "is_current",
        )


# ---------------------------------------------------------------------------
# Audit log (read-only)
# ---------------------------------------------------------------------------
class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "user",
            "user_email",
            "module",
            "action",
            "entity_type",
            "entity_id",
            "old_data",
            "new_data",
            "ip_address",
            "performed_at",
        )
