"""Inventory lookup masters API (ProductCategory, Brand). Full Inventory slice lands in step 08."""
from rest_framework import serializers

from apps.core.views import AuditModelViewSet

from .models import Brand, ProductCategory


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = (
            "id",
            "name",
            "parent_category",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = (
            "id",
            "name",
            "country_of_origin",
            "is_active",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class ProductCategoryViewSet(AuditModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    filterset_fields = ("is_active", "parent_category")
    search_fields = ("name", "description")
    ordering_fields = ("name",)


class BrandViewSet(AuditModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    filterset_fields = ("is_active",)
    search_fields = ("name", "country_of_origin")
    ordering_fields = ("name",)
