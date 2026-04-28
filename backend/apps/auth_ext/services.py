"""Auth helper services — 2FA, recovery codes, password reset tokens."""
from __future__ import annotations

import hashlib
import io
import secrets
from datetime import timedelta

import pyotp
import qrcode
import qrcode.image.svg
from django.conf import settings
from django.utils import timezone

from .models import PasswordResetToken, User, User2FA


# ---------------------------------------------------------------------------
# 2FA
# ---------------------------------------------------------------------------
def generate_totp_secret() -> str:
    return pyotp.random_base32()


def totp_uri(user: User, secret: str) -> str:
    issuer = getattr(settings, "TWO_FACTOR_ISSUER", "Inventory BPA")
    return pyotp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=issuer)


def qr_svg(uri: str) -> str:
    factory = qrcode.image.svg.SvgPathImage
    img = qrcode.make(uri, image_factory=factory, box_size=8)
    buf = io.BytesIO()
    img.save(buf)
    return buf.getvalue().decode("utf-8")


def verify_totp(secret: str, code: str) -> bool:
    if not secret or not code:
        return False
    return pyotp.TOTP(secret).verify(code, valid_window=1)


def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def generate_recovery_codes(count: int = 8) -> tuple[list[str], list[str]]:
    """Return (plain_codes, hashed_codes). Plain shown once to user."""
    plain = [f"{secrets.token_hex(2)}-{secrets.token_hex(3)}" for _ in range(count)]
    hashed = [hash_code(c) for c in plain]
    return plain, hashed


def consume_recovery_code(two_fa: User2FA, code: str) -> bool:
    h = hash_code(code.strip())
    codes = list(two_fa.recovery_codes or [])
    if h in codes:
        codes.remove(h)
        two_fa.recovery_codes = codes
        two_fa.save(update_fields=["recovery_codes"])
        return True
    return False


# ---------------------------------------------------------------------------
# Password reset tokens
# ---------------------------------------------------------------------------
RESET_TTL_SECONDS = 60 * 60  # 1 hour


def issue_password_reset(user: User) -> str:
    raw = secrets.token_urlsafe(32)
    PasswordResetToken.objects.create(
        user=user,
        token_hash=hash_code(raw),
        expires_at=timezone.now() + timedelta(seconds=RESET_TTL_SECONDS),
    )
    return raw


def consume_password_reset(token: str) -> User | None:
    h = hash_code(token)
    row = PasswordResetToken.objects.filter(token_hash=h, used_at__isnull=True).first()
    if not row:
        return None
    if row.expires_at < timezone.now():
        return None
    row.used_at = timezone.now()
    row.save(update_fields=["used_at"])
    return row.user
