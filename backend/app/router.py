from fastapi import APIRouter

from app.creator.api.router import v1 as creator_v1

router = APIRouter()

router.include_router(creator_v1)
