"""Read-only views. Their SQL lives in the migrations; these Table objects let SQLAlchemy query them."""

import sqlalchemy as sa

from app.creator.model.types import content_type_t, period_kind_t, platform_t, relation_t
from common.model import view

_num = sa.Numeric(asdecimal=False)
_ts = sa.TIMESTAMP(timezone=True)

# Latest captured value per content metric
v_content_latest_metrics = view(
    'v_content_latest_metrics',
    sa.Column('account_id', sa.BigInteger), sa.Column('content_id', sa.BigInteger), sa.Column('title', sa.Text),
    sa.Column('content_type', content_type_t), sa.Column('published_at', _ts), sa.Column('metric_key', sa.Text),
    sa.Column('label', sa.Text), sa.Column('period_kind', period_kind_t), sa.Column('period_start', sa.Date),
    sa.Column('period_end', sa.Date), sa.Column('value', _num), sa.Column('captured_at', _ts),
)

# Wide per-post summary with platform-neutral names (LinkedIn reactions -> likes, reposts -> shares...)
v_content_summary = view(
    'v_content_summary',
    sa.Column('content_id', sa.BigInteger), sa.Column('account_id', sa.BigInteger), sa.Column('platform', platform_t),
    sa.Column('content_type', content_type_t), sa.Column('title', sa.Text), sa.Column('published_at', _ts),
    *(sa.Column(m, _num) for m in ('views', 'impressions', 'likes', 'comments', 'shares', 'saves', 'engagements')),
)

# People you followed/connected that disappeared between snapshots
v_inferred_unfollows = view(
    'v_inferred_unfollows',
    sa.Column('account_id', sa.BigInteger), sa.Column('platform', platform_t), sa.Column('handle', sa.Text),
    sa.Column('display_name', sa.Text), sa.Column('relation', relation_t),
    sa.Column('first_observed_at', _ts), sa.Column('ended_inferred_at', _ts),
)

# Metrics that expire soon: where you must archive first
v_expiring_metrics = view(
    'v_expiring_metrics',
    sa.Column('platform', platform_t), sa.Column('label', sa.Text), sa.Column('retention_days', sa.Integer),
    sa.Column('gui_path', sa.Text),
)
