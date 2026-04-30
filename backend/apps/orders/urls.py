"""Sales orders URL routes."""
from rest_framework.routers import DefaultRouter

from .views import SalesOrderItemViewSet, SalesOrderViewSet


router = DefaultRouter()
router.register("orders/items", SalesOrderItemViewSet, basename="sales-order-item")
router.register("orders", SalesOrderViewSet, basename="sales-order")

urlpatterns = router.urls
