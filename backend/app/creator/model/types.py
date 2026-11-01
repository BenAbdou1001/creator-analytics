"""The Postgres enum types, one shared object each so Alembic creates every type once."""

from app.creator import enums
from common.model import pg_enum

platform_t = pg_enum(enums.Platform, 'platform_t')
account_type_t = pg_enum(enums.AccountType, 'account_type_t')
content_type_t = pg_enum(enums.ContentType, 'content_type_t')
visibility_t = pg_enum(enums.Visibility, 'visibility_t')
metric_scope_t = pg_enum(enums.MetricScope, 'metric_scope_t')
value_semantics_t = pg_enum(enums.ValueSemantics, 'value_semantics_t')
period_kind_t = pg_enum(enums.PeriodKind, 'period_kind_t')
verification_t = pg_enum(enums.Verification, 'verification_t')
dimension_t = pg_enum(enums.Dimension, 'dimension_t')
relation_t = pg_enum(enums.Relation, 'relation_t')
comment_status_t = pg_enum(enums.CommentStatus, 'comment_status_t')
interaction_t = pg_enum(enums.Interaction, 'interaction_t')
source_kind_t = pg_enum(enums.SourceKind, 'source_kind_t')
