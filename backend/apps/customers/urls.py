"""Customers app URL routes — mounted under /api/v1/."""
from rest_framework.routers import DefaultRouter

from .views import AddressViewSet, ContactViewSet, CustomerViewSet


router = DefaultRouter()
router.register("customers", CustomerViewSet, basename="customer")
router.register("contacts", ContactViewSet, basename="contact")
router.register("addresses", AddressViewSet, basename="address")

urlpatterns = router.urls
