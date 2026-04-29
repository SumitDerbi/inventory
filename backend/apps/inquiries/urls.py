"""Inquiries app masters URL routes (full Inquiry slice lands in step 05)."""
from rest_framework.routers import DefaultRouter

from .masters_api import InquirySourceViewSet


router = DefaultRouter()
router.register("inquiry-sources", InquirySourceViewSet, basename="inquiry-source")

urlpatterns = router.urls
