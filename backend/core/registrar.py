from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.router import router
from common.exception.exception_handler import register_exception
from core.conf import settings


def register_app() -> FastAPI:
    app = FastAPI(title=settings.FASTAPI_TITLE)
    register_middleware(app)
    register_router(app)
    register_exception(app)
    return app


def register_middleware(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=settings.CORS_ORIGIN_REGEX,
        allow_methods=['*'],
        allow_headers=['*'],
    )


def register_router(app: FastAPI) -> None:
    app.include_router(router)
