from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from app.creator import enums
from app.creator.model.types import content_type_t, metric_scope_t, platform_t, value_semantics_t, verification_t
from common.model import MappedBase


class MetricDefinition(MappedBase):
    """The metric catalogue: everything the dashboards show, keyed by (platform, scope, metric_key)."""

    __tablename__ = 'metric_definitions'
    __table_args__ = (sa.UniqueConstraint('platform', 'scope', 'metric_key'),)

    metric_id: Mapped[int] = mapped_column(sa.Integer, primary_key=True)
    platform: Mapped[enums.Platform] = mapped_column(platform_t)
    scope: Mapped[enums.MetricScope] = mapped_column(metric_scope_t)
    metric_key: Mapped[str]  # stable snake_case key
    label: Mapped[str]  # label exactly as shown in the GUI
    definition: Mapped[str | None]
    unit: Mapped[str] = mapped_column(server_default='count')  # count|seconds|hours|percent|ratio|currency
    semantics: Mapped[enums.ValueSemantics] = mapped_column(value_semantics_t, server_default='period')
    applies_to: Mapped[list[Any] | None] = mapped_column(postgresql.ARRAY(content_type_t))  # NULL = all
    requires: Mapped[str | None]  # eligibility (YPP, 100+ reached, Premium...)
    retention_days: Mapped[int | None] = mapped_column(sa.Integer)  # how long the dashboard keeps it
    gui_path: Mapped[str | None]
    verification: Mapped[enums.Verification] = mapped_column(verification_t, server_default='verified_official')
