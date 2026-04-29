"""Quotations URL routes."""
from rest_framework.routers import DefaultRouter

from .views import QuotationItemViewSet, QuotationViewSet


router = DefaultRouter()
router.register("quotations/items", QuotationItemViewSet, basename="quotation-item")
router.register("quotations", QuotationViewSet, basename="quotation")

urlpatterns = router.urls
