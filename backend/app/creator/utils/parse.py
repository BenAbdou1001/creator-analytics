from datetime import UTC, date, datetime

# formats the platform exports use besides ISO 8601 (YouTube: "Oct 2, 2026", LinkedIn: "6/20/2026")
_FORMATS = ('%b %d, %Y', '%B %d, %Y', '%m/%d/%Y', '%d %b %Y', '%Y/%m/%d')


def num(v: str | None) -> float | None:
    """'1,200' / '12%' / '' -> 1200.0 / 12.0 / None"""
    v = (v or '').replace(',', '').replace('%', '').strip()
    try:
        return float(v)
    except ValueError:
        return None


def parse_datetime(v: str | date) -> datetime:
    """ISO or export-style date/time -> aware datetime (naive values are UTC, like the DB session)."""
    if isinstance(v, datetime):
        dt = v
    elif isinstance(v, date):
        dt = datetime(v.year, v.month, v.day)
    else:
        s = str(v).strip()
        try:
            dt = datetime.fromisoformat(s)
        except ValueError:
            for fmt in _FORMATS:
                try:
                    dt = datetime.strptime(s, fmt)
                    break
                except ValueError:
                    continue
            else:
                raise ValueError(f'unrecognised date {v!r}') from None
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def parse_date(v: str | date | None) -> date | None:
    if v is None or v == '':
        return None
    if isinstance(v, date) and not isinstance(v, datetime):
        return v
    return parse_datetime(v).date()


def us_date(s: str) -> str:
    """'6/20/2026' -> '2026-06-20'"""
    return datetime.strptime(s.strip(), '%m/%d/%Y').date().isoformat()


if __name__ == '__main__':
    assert parse_date('Oct 2, 2026') == date(2026, 10, 2)
    assert parse_date('2026-10-01') == date(2026, 10, 1)
    assert parse_date('6/20/2026') == date(2026, 6, 20)
    assert parse_datetime('2026-10-01T12:00:00Z') == datetime(2026, 10, 1, 12, tzinfo=UTC)
    assert parse_datetime('Oct 1, 2026').tzinfo is UTC
    assert num('1,200') == 1200 and num('12%') == 12 and num('') is None
    print('ok')
