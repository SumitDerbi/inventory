"""Auth + users + roles + sessions + 2FA views."""
from __future__ import annotations

import secrets

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from . import services
from .models import AuthSession, Permission, Role, RolePermission, User, User2FA
from .permissions import IsAdminRole
from .serializers import (
    AuthSessionSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    OtpVerifySerializer,
    PermissionSerializer,
    ResetPasswordSerializer,
    RolePermissionMatrixSerializer,
    RoleSerializer,
    TwoFAConfirmSerializer,
    TwoFADisableSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


OTP_TOKEN_TTL = 5 * 60  # 5 min
OTP_TOKEN_PREFIX = "otp:"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _client_ip(request) -> str:
    return request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))[:50]


def _issue_tokens(user: User, request) -> dict:
    refresh = RefreshToken.for_user(user)
    refresh["email"] = user.email
    AuthSession.objects.create(
        user=user,
        refresh_jti=str(refresh["jti"]),
        ip_address=_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
    )
    user.last_login = timezone.now()
    user.save(update_fields=["last_login"])
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    }


# ---------------------------------------------------------------------------
# Login / refresh / logout
# ---------------------------------------------------------------------------
class LoginView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (AnonRateThrottle,)

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user: User = ser.validated_data["user"]
        two_fa = User2FA.objects.filter(user=user, enrolled_at__isnull=False).first()
        if two_fa:
            otp_token = secrets.token_urlsafe(32)
            cache.set(OTP_TOKEN_PREFIX + otp_token, user.id, OTP_TOKEN_TTL)
            return Response({"requires_otp": True, "otp_token": otp_token})
        return Response(_issue_tokens(user, request))


class LoginOtpVerifyView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (AnonRateThrottle,)

    def post(self, request):
        ser = OtpVerifySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        token = ser.validated_data["otp_token"]
        cache_key = OTP_TOKEN_PREFIX + token
        user_id = cache.get(cache_key)
        if not user_id:
            return Response({"detail": "OTP token expired."}, status=401)
        user = User.objects.filter(id=user_id, is_active=True).first()
        if not user:
            return Response({"detail": "User not found."}, status=401)
        two_fa = User2FA.objects.filter(user=user, enrolled_at__isnull=False).first()
        if not two_fa:
            return Response({"detail": "2FA not enrolled."}, status=400)
        code = (ser.validated_data.get("code") or "").strip()
        rec = (ser.validated_data.get("recovery_code") or "").strip()
        ok = False
        if code:
            ok = services.verify_totp(two_fa.secret, code)
        elif rec:
            ok = services.consume_recovery_code(two_fa, rec)
        if not ok:
            return Response({"detail": "Invalid 2FA code."}, status=401)
        cache.delete(cache_key)
        two_fa.last_used_at = timezone.now()
        two_fa.save(update_fields=["last_used_at"])
        return Response(_issue_tokens(user, request))


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        refresh_str = request.data.get("refresh")
        if not refresh_str:
            return Response({"detail": "refresh required."}, status=400)
        try:
            token = RefreshToken(refresh_str)
            jti = str(token["jti"])
            token.blacklist()
            AuthSession.objects.filter(user=request.user, refresh_jti=jti).delete()
        except TokenError:
            return Response({"detail": "Invalid refresh."}, status=400)
        return Response(status=204)


# ---------------------------------------------------------------------------
# Me + change password
# ---------------------------------------------------------------------------
class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        ser = UserUpdateSerializer(request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_classes = (UserRateThrottle,)

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if not request.user.check_password(ser.validated_data["old_password"]):
            return Response({"detail": "Old password is incorrect."}, status=400)
        request.user.set_password(ser.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password updated."})


# ---------------------------------------------------------------------------
# Forgot / reset
# ---------------------------------------------------------------------------
class ForgotPasswordView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (AnonRateThrottle,)

    def post(self, request):
        ser = ForgotPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            token = services.issue_password_reset(user)
            # Production: email link. Dev: surface token if DEBUG.
            if settings.DEBUG:
                return Response({"detail": "Reset token issued.", "token": token})
        return Response({"detail": "If the email exists, a reset link has been sent."})


class ResetPasswordView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (AnonRateThrottle,)

    def post(self, request):
        ser = ResetPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = services.consume_password_reset(ser.validated_data["token"])
        if not user:
            return Response({"detail": "Invalid or expired token."}, status=400)
        user.set_password(ser.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset."})


# ---------------------------------------------------------------------------
# Users CRUD (admin only)
# ---------------------------------------------------------------------------
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("email")
    permission_classes = (IsAuthenticated, IsAdminRole)
    filterset_fields = ("is_active", "department")
    search_fields = ("email", "username", "first_name", "last_name", "employee_code")
    ordering_fields = ("email", "date_joined", "last_login")

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        return UserSerializer

    def perform_destroy(self, instance: User) -> None:
        # Soft-disable instead of hard delete.
        instance.is_active = False
        instance.save(update_fields=["is_active"])


# ---------------------------------------------------------------------------
# Roles + permission matrix
# ---------------------------------------------------------------------------
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by("name")
    serializer_class = RoleSerializer
    permission_classes = (IsAuthenticated, IsAdminRole)
    search_fields = ("name", "code")

    @action(detail=True, methods=["get", "put"], url_path="permissions")
    def permissions_matrix(self, request, pk=None):
        role = self.get_object()
        if request.method == "GET":
            codes = list(role.role_permissions.values_list("permission__code", flat=True))
            return Response({"role": role.code, "permission_codes": codes})

        ser = RolePermissionMatrixSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        codes = ser.validated_data["permission_codes"]
        perms = Permission.objects.filter(code__in=codes)
        role.role_permissions.all().delete()
        RolePermission.objects.bulk_create(
            [RolePermission(role=role, permission=p) for p in perms]
        )
        return Response({"role": role.code, "permission_codes": codes})


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all().order_by("module", "action")
    serializer_class = PermissionSerializer
    permission_classes = (IsAuthenticated,)
    filterset_fields = ("module",)
    search_fields = ("code", "module", "action")


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------
class SessionsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        sessions = AuthSession.objects.filter(user=request.user)
        current_jti = request.auth.get("jti") if request.auth else None  # access JTI != refresh JTI
        # Mark "current" by matching most recent — simple heuristic for now.
        latest = sessions.order_by("-last_seen_at").first()
        data = []
        for s in sessions:
            d = AuthSessionSerializer(s).data
            d["is_current"] = bool(latest and s.id == latest.id)
            data.append(d)
        return Response(data)


class SessionLogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk: int):
        session = AuthSession.objects.filter(id=pk, user=request.user).first()
        if not session:
            return Response({"detail": "Not found."}, status=404)
        # Cannot revoke the current session via this endpoint — heuristic: latest row is current.
        latest = AuthSession.objects.filter(user=request.user).order_by("-last_seen_at").first()
        if latest and latest.id == session.id:
            return Response(
                {"detail": "Use /api/auth/logout for the current session."}, status=400
            )
        session.delete()
        return Response(status=204)


class LogoutOthersView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        latest = AuthSession.objects.filter(user=request.user).order_by("-last_seen_at").first()
        qs = AuthSession.objects.filter(user=request.user)
        if latest:
            qs = qs.exclude(id=latest.id)
        count = qs.count()
        qs.delete()
        return Response({"revoked": count})


# ---------------------------------------------------------------------------
# 2FA
# ---------------------------------------------------------------------------
class TwoFAStatusView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        tfa = User2FA.objects.filter(user=request.user).first()
        if not tfa or not tfa.enrolled_at:
            return Response({"enabled": False, "method": "totp", "enrolled_at": None})
        return Response({"enabled": True, "method": "totp", "enrolled_at": tfa.enrolled_at})


class TwoFAEnableView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        existing = User2FA.objects.filter(user=request.user, enrolled_at__isnull=False).first()
        if existing:
            return Response({"detail": "2FA already enabled."}, status=400)
        secret = services.generate_totp_secret()
        User2FA.objects.update_or_create(
            user=request.user,
            defaults={"secret": secret, "enrolled_at": None, "recovery_codes": []},
        )
        uri = services.totp_uri(request.user, secret)
        return Response({"secret": secret, "otpauth_url": uri, "qr_svg": services.qr_svg(uri)})


class TwoFAConfirmView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        ser = TwoFAConfirmSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        tfa = User2FA.objects.filter(user=request.user).first()
        if not tfa:
            return Response({"detail": "Start enrolment first."}, status=400)
        if tfa.enrolled_at:
            return Response({"detail": "Already enrolled."}, status=400)
        if not services.verify_totp(tfa.secret, ser.validated_data["code"]):
            return Response({"detail": "Invalid code."}, status=400)
        plain, hashed = services.generate_recovery_codes()
        tfa.enrolled_at = timezone.now()
        tfa.recovery_codes = hashed
        tfa.save(update_fields=["enrolled_at", "recovery_codes"])
        return Response({"recovery_codes": plain})


class TwoFADisableView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        ser = TwoFADisableSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if not request.user.check_password(ser.validated_data["password"]):
            return Response({"detail": "Wrong password."}, status=403)
        User2FA.objects.filter(user=request.user).delete()
        return Response(status=204)


class RecoveryCodesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        tfa = User2FA.objects.filter(user=request.user, enrolled_at__isnull=False).first()
        if not tfa:
            return Response({"detail": "2FA not enabled."}, status=400)
        return Response({"masked_count": len(tfa.recovery_codes or [])})

    def post(self, request):
        # /regenerate
        password = request.data.get("password", "")
        if not request.user.check_password(password):
            return Response({"detail": "Wrong password."}, status=403)
        tfa = User2FA.objects.filter(user=request.user, enrolled_at__isnull=False).first()
        if not tfa:
            return Response({"detail": "2FA not enabled."}, status=400)
        plain, hashed = services.generate_recovery_codes()
        tfa.recovery_codes = hashed
        tfa.save(update_fields=["recovery_codes"])
        return Response({"recovery_codes": plain})
