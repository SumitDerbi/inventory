"""Project-level URL configuration."""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def health(_request):
    return JsonResponse({"status": "ok", "service": "inventory-bpa-api", "version": "0.1.0"})


api_v1_patterns = [
    path("", include("apps.customers.urls")),
    path("", include("apps.core.urls")),
    path("", include("apps.inquiries.urls")),
    path("", include("apps.inventory.urls")),
    path("", include("apps.notifications.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    # Auth + users + roles + permissions (step 03)
    path("api/", include("apps.auth_ext.urls")),
    path("api/v1/", include((api_v1_patterns, "v1"))),
    # OpenAPI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
