"""Step 04c: Global search endpoint."""
from __future__ import annotations

import time

from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from .search import registry, search


class SearchThrottle(UserRateThrottle):
    scope = "search"

    def get_rate(self):
        # Read live from Django settings so tests that set the rate to None
        # via the conftest fixture take effect even though
        # SimpleRateThrottle.THROTTLE_RATES is bound at import time.
        from django.conf import settings as dj_settings

        rates = getattr(dj_settings, "REST_FRAMEWORK", {}).get(
            "DEFAULT_THROTTLE_RATES", {}
        )
        return rates.get(self.scope, "30/min")

    def __init__(self):
        rate = self.get_rate()
        if rate is None:
            self.rate = None
            self.num_requests = None
            self.duration = None
            return
        super().__init__()

    def allow_request(self, request, view):
        if self.rate is None:
            return True
        return super().allow_request(request, view)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([SearchThrottle])
def global_search(request):
    q = (request.query_params.get("q") or "").strip()
    if len(q) < 2:
        return Response({"detail": "q must be at least 2 characters"}, status=400)

    raw_types = request.query_params.get("type")
    types = [t.strip() for t in raw_types.split(",")] if raw_types else None
    if types:
        unknown = [t for t in types if t not in registry.entries]
        if unknown:
            return Response(
                {"detail": f"unknown type(s): {','.join(unknown)}", "supported": list(registry.entries.keys())},
                status=400,
            )

    try:
        limit = int(request.query_params.get("limit") or 8)
    except ValueError:
        return Response({"detail": "limit must be an integer"}, status=400)

    started = time.perf_counter()
    results = search(request.user, q, types=types, limit=limit)
    took_ms = int((time.perf_counter() - started) * 1000)
    return Response({"results": results, "took_ms": took_ms})
