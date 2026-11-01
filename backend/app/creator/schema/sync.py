from typing import Any

from pydantic import BaseModel, Field


class SyncSourceParam(BaseModel):
    source_kind: str = Field('gui_manual', description='import_source_t value')
    source_label: str = Field('manual sync', description='Shown in import history')


class SyncContentParam(SyncSourceParam):
    account_id: int
    items: list[dict[str, Any]] = Field(description='content_items columns + optional "metrics" / "period"')
    full_snapshot: bool = Field(False, description='Mark content missing from items as deleted')
    period_kind: str = 'lifetime'
    default_content_type: str | None = None


class SyncAccountMetricsParam(SyncSourceParam):
    account_id: int
    rows: list[dict[str, Any]] = Field(description='{"metric", "value", "period_start", "period_end"?, "period_kind"?}')
    scope: str = 'account'


class SyncRelationshipsParam(SyncSourceParam):
    account_id: int
    relation: str
    people: list[dict[str, Any]] = Field(description='{"handle", "display_name"?, "headline"?, "relation_since"?}')
    full_snapshot: bool = Field(True, description='Flag people missing from this list as ended (inferred unfollow)')


class SyncContentResult(BaseModel):
    batch_id: int
    content_upserted: int
    facts_inserted: int
    unknown_metrics: list[str]
    marked_deleted: int


class SyncAccountMetricsResult(BaseModel):
    batch_id: int
    facts_inserted: int
    unknown_metrics: list[str]


class SyncRelationshipsResult(BaseModel):
    batch_id: int
    observed: int
    new: int
    ended_inferred: int
