from datetime import date, datetime

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
