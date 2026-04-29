"""Seed a Postman admin user. Idempotent."""
from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.contrib.auth import get_user_model

EMAIL = "postman-admin@example.com"
PASSWORD = "PostmanP@ss123!"

User = get_user_model()
u, created = User.objects.get_or_create(
    email=EMAIL,
    defaults={"username": EMAIL, "is_staff": True, "is_superuser": True},
)
if created or not u.check_password(PASSWORD):
    u.set_password(PASSWORD)
    u.is_staff = True
    u.is_superuser = True
    u.save()
print(f"admin_user_id={u.id}")
