"""How long until a platform starts dropping days we have not saved."""

from datetime import date, timedelta


def days_left(last_day: date, retention_days: int, today: date) -> int:
    """Days until the first unsaved day leaves a rolling window; 0 or less means days are being lost now.

    Assumes the platform keeps a rolling window of `retention_days`. The first day we lack is
    `last_day + 1`, and it stays available until `retention_days` after that.
    """
    return (last_day + timedelta(days=1 + retention_days) - today).days


def expiry_row(row: dict, today: date) -> dict:
    """Adds `saved_as` ('days' | 'totals' | 'nothing') and `days_left` (only saved daily history has one)."""
    saved_as = 'days' if row['days_saved'] else 'totals' if row['facts'] else 'nothing'
    left = days_left(row['last_day'], row['retention_days'], today) if saved_as == 'days' else None
    return {**row, 'saved_as': saved_as, 'days_left': left}


def sort_key(row: dict) -> tuple:
    """Most urgent first, then never saved, then saved as totals only."""
    return (('days', 'nothing', 'totals').index(row['saved_as']), row['days_left'] or 0, row['label'])
