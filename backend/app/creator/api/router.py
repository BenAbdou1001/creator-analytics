from fastapi import APIRouter

from app.creator.api.v1 import router as creator_router
from core.conf import settings

v1 = APIRouter(prefix=settings.FASTAPI_API_V1_PATH)

v1.include_router(creator_router)
