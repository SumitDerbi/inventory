"""Step 04b: seed default numbering series, notification channel defaults, and email templates."""
from django.db import migrations


NUMBERING = [
    {"code": "INQ", "prefix": "INQ", "pad_width": 5},
    {"code": "QUO", "prefix": "QUO", "pad_width": 5},
    {"code": "SO", "prefix": "SO", "pad_width": 5},
    {"code": "DC", "prefix": "DC", "pad_width": 5},
    {"code": "INV", "prefix": "INV", "pad_width": 5},
    {"code": "JOB", "prefix": "JOB", "pad_width": 5},
    {"code": "SR", "prefix": "SR", "pad_width": 5},
    {"code": "CRT", "prefix": "CRT", "pad_width": 5},
]

CHANNELS = [
    {"kind": "inquiry_assigned", "in_app": True, "email": True},
    {"kind": "quotation_pending_approval", "in_app": True, "email": True},
    {"kind": "order_dispatched", "in_app": True, "email": True, "whatsapp": True},
    {"kind": "invoice_overdue", "in_app": True, "email": True},
    {"kind": "service_job_scheduled", "in_app": True, "email": True, "sms": True},
    {"kind": "purchase_approval_pending", "in_app": True, "email": True},
    {"kind": "stock_reorder_alert", "in_app": True, "email": True},
]

TEMPLATES = [
    {
        "slug": "quotation_sent",
        "subject": "Your quotation {{quotation_number}} is ready",
        "body_text": "Dear {{customer_name}},\n\nPlease find quotation {{quotation_number}} attached.\n\nRegards,\n{{sender_name}}",
        "body_html": "<p>Dear {{customer_name}},</p><p>Please find quotation <b>{{quotation_number}}</b> attached.</p><p>Regards,<br/>{{sender_name}}</p>",
        "variables": ["customer_name", "quotation_number", "sender_name"],
    },
    {
        "slug": "order_dispatched",
        "subject": "Order {{order_number}} dispatched",
        "body_text": "Hi {{customer_name}},\n\nYour order {{order_number}} was dispatched on {{dispatch_date}}.",
        "body_html": "<p>Hi {{customer_name}},</p><p>Your order <b>{{order_number}}</b> was dispatched on {{dispatch_date}}.</p>",
        "variables": ["customer_name", "order_number", "dispatch_date"],
    },
    {
        "slug": "invoice_reminder",
        "subject": "Reminder: Invoice {{invoice_number}}",
        "body_text": "Dear {{customer_name}},\n\nInvoice {{invoice_number}} of {{amount}} is due.",
        "body_html": "<p>Dear {{customer_name}},</p><p>Invoice <b>{{invoice_number}}</b> of {{amount}} is due.</p>",
        "variables": ["customer_name", "invoice_number", "amount"],
    },
    {
        "slug": "approval_pending",
        "subject": "Approval pending: {{entity_label}}",
        "body_text": "Hi {{approver_name}},\n\n{{entity_label}} is awaiting your approval.",
        "body_html": "<p>Hi {{approver_name}},</p><p>{{entity_label}} is awaiting your approval.</p>",
        "variables": ["approver_name", "entity_label"],
    },
    {
        "slug": "password_reset",
        "subject": "Reset your password",
        "body_text": "Hi {{user_name}},\n\nUse this link to reset: {{reset_link}}",
        "body_html": "<p>Hi {{user_name}},</p><p>Use this link to reset: <a href='{{reset_link}}'>{{reset_link}}</a></p>",
        "variables": ["user_name", "reset_link"],
    },
]


def seed(apps, schema_editor):
    NumberSeries = apps.get_model("core", "NumberSeries")
    NotificationChannelDefault = apps.get_model("core", "NotificationChannelDefault")
    EmailTemplate = apps.get_model("core", "EmailTemplate")

    for row in NUMBERING:
        NumberSeries.objects.get_or_create(code=row["code"], defaults=row)
    for row in CHANNELS:
        NotificationChannelDefault.objects.get_or_create(kind=row["kind"], defaults=row)
    for row in TEMPLATES:
        EmailTemplate.objects.get_or_create(slug=row["slug"], defaults=row)


def unseed(apps, schema_editor):
    apps.get_model("core", "NumberSeries").objects.filter(code__in=[r["code"] for r in NUMBERING]).delete()
    apps.get_model("core", "NotificationChannelDefault").objects.filter(kind__in=[r["kind"] for r in CHANNELS]).delete()
    apps.get_model("core", "EmailTemplate").objects.filter(slug__in=[r["slug"] for r in TEMPLATES]).delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0001_settings_models")]
    operations = [migrations.RunPython(seed, unseed)]
