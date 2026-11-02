from datetime import date, datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.creator import enums
from app.creator.model.types import source_kind_t
from common.model import NOW, MappedBase


class ImportBatch(MappedBase):
    """Provenance: every import / manual capture."""

    __tablename__ = 'import_batches'

    batch_id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int | None] = mapped_column(sa.ForeignKey('accounts.account_id', ondelete='CASCADE'))
    source_kind: Mapped[enums.SourceKind] = mapped_column(source_kind_t)
    source_label: Mapped[str]  # e.g. 'YouTube Advanced Mode > Export current view'
    gui_path: Mapped[str | None]  # exact navigation path used
    file_name: Mapped[str | None]
    file_sha256: Mapped[str | None]
    range_start: Mapped[date | None]
    range_end: Mapped[date | None]
    row_count: Mapped[int | None] = mapped_column(sa.Integer)
    imported_at: Mapped[datetime] = mapped_column(server_default=NOW)
    notes: Mapped[str | None]
