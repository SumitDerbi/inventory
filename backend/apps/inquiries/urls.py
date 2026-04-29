"""Inquiries URL routes."""
from rest_framework.routers import DefaultRouter

from .masters_api import InquirySourceViewSet
from .views import InquiryFollowUpViewSet, InquiryItemViewSet, InquiryViewSet


router = DefaultRouter()
router.register("inquiry-sources", InquirySourceViewSet, basename="inquiry-source")
router.register("inquiries/follow-ups", InquiryFollowUpViewSet, basename="inquiry-follow-up")
router.register("inquiries/items", InquiryItemViewSet, basename="inquiry-item")
router.register("inquiries", InquiryViewSet, basename="inquiry")

urlpatterns = router.urls
