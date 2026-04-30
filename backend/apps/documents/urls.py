"""Customer invoice URL routes (Module 7 slice)."""
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import InvoiceItemViewSet, InvoiceViewSet, OrderInvoicesViewSet


router = DefaultRouter()
router.register(
    "customer-invoices/items", InvoiceItemViewSet, basename="customer-invoice-item"
)
router.register("customer-invoices", InvoiceViewSet, basename="customer-invoice")


urlpatterns = router.urls + [
    path(
        "orders/<int:order_pk>/customer-invoices/",
        OrderInvoicesViewSet.as_view({"get": "list", "post": "create"}),
        name="order-customer-invoices",
    ),
]
