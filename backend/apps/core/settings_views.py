"""Step 04b: Settings & Admin Config viewsets — all admin-gated."""
from __future__ import annotations

from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.auth_ext.permissions import IsAdminRole

from .masters import (
    CompanyProfile,
    EmailTemplate,
    Integration,
    NotificationChannelDefault,
    NumberSeries,
    PaymentTerm,
)
from .numbering import preview_next
from .settings_serializers import (
    CompanyProfileSerializer,
    EmailRenderRequestSerializer,
    EmailSendTestSerializer,
    EmailTemplateSerializer,
    IntegrationSerializer,
    IntegrationTestSerializer,
    NotificationChannelDefaultSerializer,
    NumberSeriesSerializer,
    PaymentTermSerializer,
    render_template,
)


class _AdminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]


class CompanyProfileView(APIView):
    """Singleton GET / PUT at `/api/v1/settings/company/`."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        obj = CompanyProfile.get_solo()
        return Response(CompanyProfileSerializer(obj).data)

    def put(self, request):
        obj = CompanyProfile.get_solo()
        ser = CompanyProfileSerializer(obj, data=request.data, partial=False)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def patch(self, request):
        obj = CompanyProfile.get_solo()
        ser = CompanyProfileSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class NumberSeriesViewSet(_AdminViewSet):
    queryset = NumberSeries.objects.all()
    serializer_class = NumberSeriesSerializer

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        series = self.get_object()
        # Pure preview — does not mutate `last_number`.
        previews = preview_next(series, count=3)
        return Response({"series": series.code, "next": previews, "current_seq": series.last_number})


class PaymentTermViewSet(_AdminViewSet):
    queryset = PaymentTerm.objects.all()
    serializer_class = PaymentTermSerializer


class IntegrationViewSet(_AdminViewSet):
    queryset = Integration.objects.all()
    serializer_class = IntegrationSerializer

    @action(detail=True, methods=["post"], url_path="test")
    def test_connection(self, request, pk=None):
        integ = self.get_object()
        ok = True
        message = "OK"
        try:
            if integ.kind == Integration.Kind.SMTP:
                # Smoke check: send a no-op message via configured backend.
                # In tests, locmem backend captures it.
                send_mail(
                    subject="[Smoke] Integration Test",
                    message="Smoke test — please ignore.",
                    from_email=integ.config.get("from_email", "noreply@example.com"),
                    recipient_list=[integ.config.get("test_recipient", "test@example.com")],
                    fail_silently=False,
                )
            elif integ.kind in (Integration.Kind.WHATSAPP, Integration.Kind.SMS, Integration.Kind.S3, Integration.Kind.PAYMENT_GATEWAY):
                # Stubbed: assume config presence == OK.
                if not integ.config:
                    ok = False
                    message = "Empty config"
            else:
                ok = False
                message = f"Unknown integration kind: {integ.kind}"
        except Exception as exc:  # pragma: no cover - defensive
            ok = False
            message = str(exc)

        integ.last_tested_at = timezone.now()
        integ.last_test_status = "ok" if ok else "failed"
        integ.last_test_message = message
        integ.save(update_fields=["last_tested_at", "last_test_status", "last_test_message"])
        return Response(
            {"ok": ok, "status": integ.last_test_status, "message": message, "tested_at": integ.last_tested_at}
        )


class NotificationChannelDefaultViewSet(_AdminViewSet):
    queryset = NotificationChannelDefault.objects.all()
    serializer_class = NotificationChannelDefaultSerializer


class EmailTemplateViewSet(_AdminViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer

    @action(detail=True, methods=["post"])
    def preview(self, request, pk=None):
        template = self.get_object()
        ser = EmailRenderRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        rendered = render_template(template, ser.validated_data["variables"])
        return Response(rendered)

    @action(detail=True, methods=["post"], url_path="send-test")
    def send_test(self, request, pk=None):
        template = self.get_object()
        ser = EmailSendTestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        rendered = render_template(template, ser.validated_data["variables"])
        send_mail(
            subject=rendered["subject"],
            message=rendered["body_text"] or rendered["body_html"],
            from_email="noreply@example.com",
            recipient_list=[ser.validated_data["to"]],
            html_message=rendered["body_html"] or None,
            fail_silently=False,
        )
        return Response({"sent": True, "to": ser.validated_data["to"]})
