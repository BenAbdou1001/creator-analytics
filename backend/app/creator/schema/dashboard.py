from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

from app.creator.enums import AccountType, Platform


class GetAccountOverview(BaseModel):
    account_id: int
    platform: Platform
    handle: str
    display_name: str | None
    account_type: AccountType
    followers: float | None
    content_count: int
    total_views: float | None
    total_impressions: float | None
    total_engagements: float | None
    last_import: datetime | None


class GetMetricPoint(BaseModel):
    period_start: date
    period_end: date
    value: float
    captured_at: datetime
    batch_id: int | None


class GetExpiringMetric(BaseModel):
    account_id: int
    platform: Platform
    handle: str
    metric_key: str
    label: str
    gui_path: str | None
    retention_days: int
    first_day: date | None
    last_day: date | None
    days_saved: int
    saved_as: Literal['days', 'totals', 'nothing']
    days_left: int | None
