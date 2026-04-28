"""Production settings — DEBUG off, MySQL via DATABASE_URL, strict CORS."""
from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False

# Refuse to boot with the insecure default secret in prod.
SECRET_KEY = env("SECRET_KEY")
if "insecure" in SECRET_KEY:
    raise RuntimeError(
        "Refusing to start prod with an insecure SECRET_KEY. "
        "Set SECRET_KEY in inventory.env."
    )

ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# Logging — JSON formatted for log aggregation.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "format": '{"ts":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "json"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}

# Hardening
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
