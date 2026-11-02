import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.enums import Platform
from app.creator.model import Account
from common.exception import errors


class CRUDAccount:
    @staticmethod
    async def get_platform(db: AsyncSession, account_id: int) -> Platform:
        platform = await db.scalar(sa.select(Account.platform).where(Account.account_id == account_id))
        if platform is None:
            raise errors.NotFoundError(msg=f'no account {account_id}')
        return platform


account_dao = CRUDAccount()
