"""Core masters URL routes (mounted under /api/v1/)."""
from rest_framework.routers import DefaultRouter

from .views import AttachmentViewSet, TaxRuleViewSet


router = DefaultRouter()
router.register("tax-rules", TaxRuleViewSet, basename="tax-rule")
router.register("attachments", AttachmentViewSet, basename="attachment")

urlpatterns = router.urls
