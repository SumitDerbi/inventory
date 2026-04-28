"""Auth_ext URL routes — mounted under /api/."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register("users", views.UserViewSet, basename="user")
router.register("roles", views.RoleViewSet, basename="role")
router.register("permissions", views.PermissionViewSet, basename="permission")


auth_patterns = [
    path("login", views.LoginView.as_view(), name="auth-login"),
    path("login/verify-otp", views.LoginOtpVerifyView.as_view(), name="auth-login-otp"),
    path("refresh", TokenRefreshView.as_view(), name="auth-refresh"),
    path("logout", views.LogoutView.as_view(), name="auth-logout"),
    path("me", views.MeView.as_view(), name="auth-me"),
    path("change-password", views.ChangePasswordView.as_view(), name="auth-change-password"),
    path("forgot", views.ForgotPasswordView.as_view(), name="auth-forgot"),
    path("reset", views.ResetPasswordView.as_view(), name="auth-reset"),
    path("sessions", views.SessionsView.as_view(), name="auth-sessions"),
    path("sessions/<int:pk>/logout", views.SessionLogoutView.as_view(), name="auth-session-logout"),
    path("sessions/logout-others", views.LogoutOthersView.as_view(), name="auth-logout-others"),
    path("2fa/status", views.TwoFAStatusView.as_view(), name="auth-2fa-status"),
    path("2fa/enable", views.TwoFAEnableView.as_view(), name="auth-2fa-enable"),
    path("2fa/confirm", views.TwoFAConfirmView.as_view(), name="auth-2fa-confirm"),
    path("2fa/disable", views.TwoFADisableView.as_view(), name="auth-2fa-disable"),
    path("2fa/recovery-codes", views.RecoveryCodesView.as_view(), name="auth-2fa-codes"),
    path(
        "2fa/recovery-codes/regenerate",
        views.RecoveryCodesView.as_view(),
        name="auth-2fa-codes-regen",
    ),
]


urlpatterns = [
    path("auth/", include(auth_patterns)),
    path("", include(router.urls)),
]
