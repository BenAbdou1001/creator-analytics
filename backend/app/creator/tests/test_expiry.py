from datetime import date

from app.creator.utils.expiry import days_left, expiry_row, sort_key

TODAY = date(2026, 11, 1)


def row(**kw):
    return {'label': 'Views', 'retention_days': 365, 'first_day': None, 'last_day': None, 'days_saved': 0, 'facts': 0, **kw}


def test_days_left():
    assert days_left(date(2026, 10, 28), 365, TODAY) == 362  # the real LinkedIn export
    assert days_left(TODAY, 90, TODAY) == 91
    assert days_left(date(2026, 8, 2), 90, TODAY) == 0  # the first unsaved day is leaving today
    assert days_left(date(2026, 1, 1), 90, TODAY) < 0  # already losing days


def test_saved_as():
    daily = expiry_row(row(days_saved=3, facts=3, last_day=date(2026, 10, 28)), TODAY)
    assert (daily['saved_as'], daily['days_left']) == ('days', 362)
    assert (r := expiry_row(row(facts=2), TODAY))['saved_as'] == 'totals' and r['days_left'] is None
    assert (r := expiry_row(row(), TODAY))['saved_as'] == 'nothing' and r['days_left'] is None


def test_most_urgent_first():
    rows = [expiry_row(r, TODAY) for r in (row(facts=1, label='a'), row(label='b'),
                                           row(days_saved=1, facts=1, last_day=date(2026, 10, 1), label='c'),
                                           row(days_saved=1, facts=1, last_day=date(2025, 1, 1), label='d'))]
    assert [r['label'] for r in sorted(rows, key=sort_key)] == ['d', 'c', 'b', 'a']
