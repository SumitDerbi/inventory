"""Numbering preview + atomic generator (used by domain modules in steps 05+)."""
from __future__ import annotations

from datetime import date

from django.db import transaction

from .masters import NumberSeries


def _current_fy() -> str:
    """Indian FY label like '2526' for Apr-2025..Mar-2026."""
    today = date.today()
    if today.month >= 4:
        start = today.year
    else:
        start = today.year - 1
    return f"{start % 100:02d}{(start + 1) % 100:02d}"


def render_token(series: NumberSeries, seq: int, fy: str) -> str:
    sep = series.separator or "/"
    pad = max(int(series.pad_width or 4), 1)
    return (
        series.pattern
        .replace("{prefix}", series.prefix or series.code)
        .replace("{fy}", fy)
        .replace("{sep}", sep)
        .replace("{seq}", f"{seq:0{pad}d}")
    )


def preview_next(series: NumberSeries, count: int = 3) -> list[str]:
    fy = series.current_fy if not series.fy_reset else _current_fy()
    if series.fy_reset and series.fiscal_year and series.fiscal_year != fy:
        # FY rolled over; preview starts from 1.
        next_seq = 1
    else:
        next_seq = (series.last_number or 0) + 1
    return [render_token(series, next_seq + i, fy) for i in range(count)]


@transaction.atomic
def consume_next(code: str) -> str:
    """Atomically bump and return the next number for a given series code."""
    series = NumberSeries.objects.select_for_update().get(code=code)
    fy = _current_fy()
    if series.fy_reset and series.fiscal_year != fy:
        series.fiscal_year = fy
        series.last_number = 0
    series.last_number = (series.last_number or 0) + 1
    series.save(update_fields=["fiscal_year", "last_number"])
    return render_token(series, series.last_number, series.fiscal_year)


# Convenience for the API.
def get_current_fy() -> str:
    return _current_fy()
