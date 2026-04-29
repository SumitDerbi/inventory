from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    label = "core"

    def ready(self) -> None:  # noqa: D401
        # Register search registry defaults once apps are loaded.
        from .search import register_defaults

        register_defaults()
