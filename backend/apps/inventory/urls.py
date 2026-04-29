"""Inventory app masters URL routes (full Inventory slice lands in step 08)."""
from rest_framework.routers import DefaultRouter

from .masters_api import BrandViewSet, ProductCategoryViewSet


router = DefaultRouter()
router.register("product-categories", ProductCategoryViewSet, basename="product-category")
router.register("brands", BrandViewSet, basename="brand")

urlpatterns = router.urls
