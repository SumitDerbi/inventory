"""CSV / XLSX (and stub PDF) streaming exports for any list endpoint.

A viewset opts in by:

* mixing in `ListExportMixin`
* declaring `export_columns = [("field_path", "Header Label"), ...]`

Then a list request with `?format=csv` or `?format=xlsx` streams the
filtered queryset through `tablib`. `?format=pdf` returns 501 until
`weasyprint` is wired in step 04.
"""
from __future__ import annotations

from typing import Iterable

import tablib
from django.http import HttpResponse
from rest_framework.response import Response


class ListExportMixin:
    export_columns: list[tuple[str, str]] | None = None

    def list(self, request, *args, **kwargs):
        fmt = (request.query_params.get("format") or "").lower()
        if fmt in ("csv", "xlsx", "pdf"):
            return self._export(request, fmt)
        return super().list(request, *args, **kwargs)

    # ------------------------------------------------------------------
    def _export(self, request, fmt: str) -> HttpResponse:
        if not self.export_columns:
            return Response({"detail": "Export not configured."}, status=400)

        qs = self.filter_queryset(self.get_queryset())
        ids = request.query_params.get("ids")
        if ids:
            qs = qs.filter(pk__in=[i for i in ids.split(",") if i])

        headers = [label for _, label in self.export_columns]
        dataset = tablib.Dataset(headers=headers)
        for obj in qs.iterator():
            dataset.append([_resolve(obj, path) for path, _ in self.export_columns])

        filename = f"{self.basename}.{fmt}" if hasattr(self, "basename") else f"export.{fmt}"

        if fmt == "csv":
            return _stream(dataset.export("csv"), "text/csv", filename)
        if fmt == "xlsx":
            return _stream(
                dataset.export("xlsx"),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename,
            )
        # pdf — TODO: weasyprint wired in step 04. Return 501 for now.
        return Response({"detail": "PDF export not yet implemented."}, status=501)


def _resolve(obj, path: str):
    cur = obj
    for part in path.split("."):
        if cur is None:
            return ""
        cur = getattr(cur, part, None)
        if callable(cur):
            cur = cur()
    return "" if cur is None else cur


def _stream(payload, content_type: str, filename: str) -> HttpResponse:
    if isinstance(payload, str):
        payload = payload.encode("utf-8")
    resp = HttpResponse(payload, content_type=content_type)
    resp["Content-Disposition"] = f'attachment; filename="{filename}"'
    return resp


def export_columns_for(*pairs: Iterable[tuple[str, str]]) -> list[tuple[str, str]]:
    """Tiny helper for readability when wiring `export_columns` at class level."""
    return list(pairs)
