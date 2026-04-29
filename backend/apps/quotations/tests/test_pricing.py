"""Pricing engine unit tests (Step 06a)."""
from decimal import Decimal

import pytest

from apps.quotations.pricing import calculate


@pytest.mark.parametrize(
    "lines,freight,other,expected",
    [
        # base: 1 line, 10 qty * 100 price, 18% gst, no discount, no freight
        (
            [{"quantity": 10, "unit_price": 100, "tax_percent": 18}],
            0,
            0,
            {"subtotal": "1000.00", "total_tax": "180.00", "grand_total": "1180.00"},
        ),
        # discount %
        (
            [{"quantity": 10, "unit_price": 100, "discount_percent": 10, "tax_percent": 18}],
            0,
            0,
            {"subtotal": "900.00", "total_discount": "100.00", "total_tax": "162.00", "grand_total": "1062.00"},
        ),
        # discount amount higher than %
        (
            [{"quantity": 10, "unit_price": 100, "discount_percent": 5, "discount_amount": 200, "tax_percent": 18}],
            0,
            0,
            {"subtotal": "800.00", "total_discount": "200.00", "total_tax": "144.00"},
        ),
        # freight + other
        (
            [{"quantity": 1, "unit_price": 1000, "tax_percent": 18}],
            500,
            100,
            {"subtotal": "1000.00", "total_tax": "180.00", "grand_total": "1780.00"},
        ),
        # exempt (0% tax)
        (
            [{"quantity": 5, "unit_price": 200, "tax_percent": 0}],
            0,
            0,
            {"subtotal": "1000.00", "total_tax": "0.00", "grand_total": "1000.00"},
        ),
        # multi-line different tax rates
        (
            [
                {"quantity": 1, "unit_price": 1000, "tax_percent": 18},
                {"quantity": 1, "unit_price": 500, "tax_percent": 5},
            ],
            0,
            0,
            {"subtotal": "1500.00", "total_tax": "205.00", "grand_total": "1705.00"},
        ),
        # margin: cost 80, price 100 → 20% margin
        (
            [{"quantity": 10, "unit_price": 100, "unit_cost": 80, "tax_percent": 18}],
            0,
            0,
            {"subtotal": "1000.00", "gross_margin_percent": "20.00"},
        ),
        # rounding: 1/3 case
        (
            [{"quantity": 3, "unit_price": Decimal("33.33"), "tax_percent": 18}],
            0,
            0,
            {"subtotal": "99.99", "total_tax": "18.00"},
        ),
        # discount cap (cannot exceed gross)
        (
            [{"quantity": 1, "unit_price": 100, "discount_amount": 9999, "tax_percent": 18}],
            0,
            0,
            {"subtotal": "0.00", "total_discount": "100.00", "total_tax": "0.00"},
        ),
        # empty
        ([], 0, 0, {"subtotal": "0.00", "grand_total": "0.00"}),
    ],
)
def test_calculate_scenarios(lines, freight, other, expected):
    result = calculate(lines, freight_amount=freight, other_charges=other)
    for key, val in expected.items():
        actual = result[key]
        if val is None:
            assert actual is None
        else:
            assert str(actual) == str(val), f"{key}: {actual} != {val}"


def test_tax_breakup_groups_by_rate():
    result = calculate(
        [
            {"quantity": 1, "unit_price": 1000, "tax_percent": 18},
            {"quantity": 1, "unit_price": 500, "tax_percent": 18},
            {"quantity": 1, "unit_price": 200, "tax_percent": 5},
        ]
    )
    rates = {str(b["rate"]): b for b in result["tax_breakup"]}
    assert "18.00" in rates and "5.00" in rates
    assert str(rates["18.00"]["base"]) == "1500.00"
    assert str(rates["18.00"]["tax"]) == "270.00"
    assert str(rates["5.00"]["base"]) == "200.00"
    assert str(rates["5.00"]["tax"]) == "10.00"


def test_per_line_results_returned():
    result = calculate([{"quantity": 2, "unit_price": 100, "tax_percent": 18}])
    assert len(result["lines"]) == 1
    line = result["lines"][0]
    assert str(line["line_subtotal"]) == "200.00"
    assert str(line["tax_amount"]) == "36.00"
    assert str(line["line_total"]) == "236.00"
