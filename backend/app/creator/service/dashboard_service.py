from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.creator.crud.crud_dashboard import dashboard_dao


class DashboardService:
    @staticmethod
    async def overview(*, db: AsyncSession) -> list[dict]:
        return await dashboard_dao.overview(db)

    @staticmethod
    async def timeseries(*, db: AsyncSession, account_id: int, metric_key: str, start: date | None = None,
                         end: date | None = None, period_kind: str = 'day') -> list[dict]:
        return await dashboard_dao.timeseries(db, account_id, metric_key, start, end, period_kind)


dashboard_service = DashboardService()
