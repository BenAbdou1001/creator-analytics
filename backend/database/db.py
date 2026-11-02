from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from core.conf import settings

async_engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URL,
    connect_args={'options': f'-c search_path={settings.DATABASE_SCHEMA},public'},
    pool_pre_ping=True,
)
async_db_session = async_sessionmaker(async_engine, autoflush=False, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_db_session() as session:
        yield session


async def get_db_transaction() -> AsyncGenerator[AsyncSession, None]:
    """One transaction per request: committed when the endpoint returns (before the response is
    sent, so commit-time errors such as deferred FKs still reach the client), rolled back on error."""
    async with async_db_session.begin() as session:
        yield session


CurrentSession = Annotated[AsyncSession, Depends(get_db)]
CurrentSessionTransaction = Annotated[AsyncSession, Depends(get_db_transaction, scope='function')]
