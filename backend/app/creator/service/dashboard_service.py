from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.crud.crud_dashboard import dashboard_dao
from app.creator.utils.expiry import expiry_row, sort_key


class DashboardService:
    @staticmethod
    async def overview(*, db: AsyncSession) -> list[dict]:
        return await dashboard_dao.overview(db)

    @staticmethod
    async def timeseries(*, db: AsyncSession, account_id: int, metric_key: str, start: date | None = None,
                         end: date | None = None, period_kind: str = 'day') -> list[dict]:
        return await dashboard_dao.timeseries(db, account_id, metric_key, start, end, period_kind)

    @staticmethod
    async def expiring(*, db: AsyncSession, today: date | None = None) -> list[dict]:
        rows = [expiry_row(r, today or date.today()) for r in await dashboard_dao.saved_history(db)]
        return sorted(rows, key=sort_key)


dashboard_service = DashboardService()
