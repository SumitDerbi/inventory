"""Development settings — DEBUG on, sqlite by default, permissive CORS."""
from .base import *  # noqa: F401,F403
from .base import env  # explicit re-import for type-checkers

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "*"]

# Allow dev to run without a .env present.
SECRET_KEY = env("SECRET_KEY", default="django-insecure-dev-only-key")

# Vite dev origin
CORS_ALLOWED_ORIGINS = env(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://127.0.0.1:5173"],
)
