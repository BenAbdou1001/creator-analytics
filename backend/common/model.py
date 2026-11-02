from datetime import date, datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase

from core.conf import settings

# Postgres' own default names, so the models line up with constraints created by plain DDL.
NAMING_CONVENTION = {
    'pk': '%(table_name)s_pkey',
    'uq': '%(table_name)s_%(column_0_N_name)s_key',
    'fk': '%(table_name)s_%(column_0_name)s_fkey',
    'ix': '%(table_name)s_%(column_0_N_name)s_idx',
    'ck': '%(table_name)s_%(constraint_name)s_check',
}


class MappedBase(AsyncAttrs, DeclarativeBase):
    """Declarative base for every model; all tables live in the `creator` schema."""

    metadata = sa.MetaData(schema=settings.DATABASE_SCHEMA, naming_convention=NAMING_CONVENTION)

    type_annotation_map = {
        int: sa.BigInteger(),
        float: sa.Numeric(asdecimal=False),  # JSON-friendly numbers
        str: sa.Text(),
        bool: sa.Boolean(),
        date: sa.Date(),
        datetime: sa.TIMESTAMP(timezone=True),
        dict[str, Any]: JSONB(),
        list[Any]: JSONB(),
    }


def pg_enum(enum_cls, name: str) -> sa.Enum:
    """Postgres enum type (in the creator schema) storing the members' values."""
    return sa.Enum(enum_cls, name=name, values_callable=lambda e: [m.value for m in e], metadata=MappedBase.metadata)


NOW = sa.text('now()')

# Deferred so an account delete can cascade through content -> facts before the batch FK is checked.
BATCH_FK = dict(ondelete=None, deferrable=True, initially='DEFERRED')


def view(name: str, *columns: sa.Column) -> sa.Table:
    """A read-only view. Created by migrations (SQL), skipped by Alembic autogenerate."""
    return sa.Table(name, MappedBase.metadata, *columns, info={'is_view': True})
