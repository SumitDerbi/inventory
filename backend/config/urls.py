"""Project-level URL configuration.

Module-specific routers will be plugged in under `/api/v1/<module>/` from
their respective app `urls.py` as steps 03+ land.
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


def health(_request):
    return JsonResponse({"status": "ok", "service": "inventory-bpa-api", "version": "0.1.0"})


api_v1_patterns = [
    # Module routes registered in steps 03+
    # path("auth/", include("apps.auth_ext.urls")),
    # path("inquiries/", include("apps.inquiries.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    # Staff JWT endpoints — full auth flow lands in step 03; baseline pair
    # included now so smoke tests can mint tokens.
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/", include((api_v1_patterns, "v1"))),
    # OpenAPI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
