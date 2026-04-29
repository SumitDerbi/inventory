"""Step 04b: settings & approvals URL routes mounted under /api/v1/."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import approvals_views
from .settings_views import (
    CompanyProfileView,
    EmailTemplateViewSet,
    IntegrationViewSet,
    NotificationChannelDefaultViewSet,
    NumberSeriesViewSet,
    PaymentTermViewSet,
)


settings_router = DefaultRouter()
settings_router.register("numbering-series", NumberSeriesViewSet, basename="numbering-series")
settings_router.register("payment-terms", PaymentTermViewSet, basename="payment-term")
settings_router.register("integrations", IntegrationViewSet, basename="integration")
settings_router.register("notification-channels", NotificationChannelDefaultViewSet, basename="notification-channel")
settings_router.register("email-templates", EmailTemplateViewSet, basename="email-template")


settings_urlpatterns = [
    path("settings/company/", CompanyProfileView.as_view(), name="settings-company"),
    path("settings/", include(settings_router.urls)),
]


approvals_urlpatterns = [
    path("approvals/inbox/", approvals_views.inbox, name="approvals-inbox"),
    path("approvals/history/", approvals_views.history, name="approvals-history"),
    path("approvals/kpis/", approvals_views.kpis, name="approvals-kpis"),
    path("approvals/bulk-approve/", approvals_views.bulk_approve, name="approvals-bulk-approve"),
    path("approvals/bulk-reject/", approvals_views.bulk_reject, name="approvals-bulk-reject"),
    path("approvals/<str:kind>/<int:pk>/approve/", approvals_views.approve, name="approvals-approve"),
    path("approvals/<str:kind>/<int:pk>/reject/", approvals_views.reject, name="approvals-reject"),
]


urlpatterns = settings_urlpatterns + approvals_urlpatterns
