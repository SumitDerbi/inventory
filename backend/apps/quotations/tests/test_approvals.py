"""Approval engine tests (Step 06a)."""
from decimal import Decimal

import pytest

from apps.quotations.approvals import determine_requirements, resolve_approver_ids


def _roles(reqs):
    return [r.role for r in reqs]


def test_no_approvals_when_below_thresholds():
    reqs = determine_requirements(
        discount_percent=5, gross_margin_percent=20, grand_total=100000
    )
    assert reqs == []


def test_manager_required_when_discount_above_10():
    reqs = determine_requirements(discount_percent=12, grand_total=100000)
    assert _roles(reqs) == ["manager"]


def test_director_required_when_discount_above_25():
    reqs = determine_requirements(discount_percent=30, grand_total=100000)
    assert _roles(reqs) == ["manager", "director"]


def test_manager_required_when_grand_total_above_5L():
    reqs = determine_requirements(discount_percent=0, grand_total=600000)
    assert _roles(reqs) == ["manager"]


def test_director_required_when_grand_total_above_25L():
    reqs = determine_requirements(discount_percent=0, grand_total=3000000)
    assert _roles(reqs) == ["manager", "director"]


def test_low_margin_triggers_manager():
    reqs = determine_requirements(discount_percent=0, gross_margin_percent=10, grand_total=100000)
    assert _roles(reqs) == ["manager"]


def test_dedup_manager_when_multiple_triggers():
    reqs = determine_requirements(
        discount_percent=15, gross_margin_percent=10, grand_total=600000
    )
    assert _roles(reqs) == ["manager"]


@pytest.mark.django_db
def test_resolve_approver_ids_uses_staff_for_manager_and_super_for_director(django_user_model):
    mgr = django_user_model.objects.create_user(
        username="mgr@x.com", email="mgr@x.com", password="x", is_staff=True
    )
    director = django_user_model.objects.create_superuser(
        username="dir@x.com", email="dir@x.com", password="x"
    )
    reqs = determine_requirements(discount_percent=30, grand_total=3000000)
    pairs = resolve_approver_ids(reqs)
    assert len(pairs) == 2
    assert pairs[0][0] == mgr.id
    assert pairs[1][0] == director.id


@pytest.mark.django_db
def test_resolve_falls_back_to_super_when_no_manager(django_user_model):
    sup = django_user_model.objects.create_superuser(
        username="sup@x.com", email="sup@x.com", password="x"
    )
    reqs = determine_requirements(discount_percent=12, grand_total=100000)
    pairs = resolve_approver_ids(reqs)
    assert len(pairs) == 1
    assert pairs[0][0] == sup.id
