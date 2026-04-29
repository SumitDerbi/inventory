"""Notifications API: per-user read-only feed + mark-read actions."""
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id",
            "type",
            "title",
            "message",
            "entity_type",
            "entity_id",
            "is_read",
            "sent_at",
            "read_at",
        )
        read_only_fields = fields


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    filterset_fields = ("type", "entity_type", "is_read")
    search_fields = ("title", "message")
    ordering_fields = ("sent_at",)

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-sent_at")

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_read(self, request, pk=None):
        n = self.get_queryset().filter(pk=pk).first()
        if not n:
            return Response({"detail": "Not found."}, status=404)
        if not n.is_read:
            n.is_read = True
            n.read_at = timezone.now()
            n.save(update_fields=["is_read", "read_at"])
        return Response(NotificationSerializer(n).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        now = timezone.now()
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True, read_at=now
        )
        return Response({"updated": updated})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        return Response(
            {"count": self.get_queryset().filter(is_read=False).count()}
        )
