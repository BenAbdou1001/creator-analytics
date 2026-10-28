import os
from typing import Any

import psycopg
from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from . import db

app = FastAPI(title="Creator Analytics API")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https?://(localhost|127\.0\.0\.1)(:\d+)?"),
    allow_methods=["*"],
    allow_headers=["*"],
)


def _error(status: int, exc: Exception) -> JSONResponse:
    diag = getattr(exc, "diag", None)
    detail = (diag and (diag.message_detail or diag.message_primary)) or str(exc)
    return JSONResponse({"detail": detail}, status_code=status)


app.add_exception_handler(db.NotFound, lambda r, e: _error(404, e))
app.add_exception_handler(ValueError, lambda r, e: _error(400, e))
app.add_exception_handler(psycopg.IntegrityError, lambda r, e: _error(409, e))
app.add_exception_handler(psycopg.Error, lambda r, e: _error(400, e))

_PAGING = {"limit", "offset", "order_by", "desc"}


@app.get("/api/health")
def health():
    db.query("SELECT 1")
    return {"ok": True}


@app.get("/api/schema")
def get_schema():
    return db.schema()


# --- generic CRUD -----------------------------------------------------------
@app.get("/api/tables/{table}")
def list_rows(table: str, request: Request, limit: int = 100, offset: int = 0,
              order_by: str | None = None, desc: bool = True):
    filters = {k: v for k, v in request.query_params.items() if k not in _PAGING}
    return db.list_rows(table, filters, limit, offset, order_by, desc)


@app.post("/api/tables/{table}", status_code=201)
def create_rows(table: str, body: dict[str, Any] | list[dict[str, Any]]):
    rows = db.create_rows(table, body if isinstance(body, list) else [body])
    return rows if isinstance(body, list) else rows[0]


@app.patch("/api/tables/{table}")
def update_row(table: str, request: Request, body: dict[str, Any]):
    return db.update_row(table, dict(request.query_params), body)


@app.delete("/api/tables/{table}")
def delete_row(table: str, request: Request):
    return db.delete_row(table, dict(request.query_params))


# --- sync -----------------------------------------------------------------
class Source(BaseModel):
    source_kind: str = "gui_manual"
    source_label: str = "manual sync"


class ContentSync(Source):
    account_id: int
    items: list[dict[str, Any]]
    full_snapshot: bool = False
    period_kind: str = "lifetime"
    default_content_type: str | None = None


class AccountMetricsSync(Source):
    account_id: int
    rows: list[dict[str, Any]]
    scope: str = "account"


class RelationshipsSync(Source):
    account_id: int
    relation: str
    people: list[dict[str, Any]]
    full_snapshot: bool = True


@app.post("/api/sync/content")
def sync_content(b: ContentSync):
    return db.sync_content(**b.model_dump())


@app.post("/api/sync/account-metrics")
def sync_account_metrics(b: AccountMetricsSync):
    return db.sync_account_metrics(**b.model_dump())


@app.post("/api/sync/relationships")
def sync_relationships(b: RelationshipsSync):
    return db.sync_relationships(**b.model_dump())


@app.post("/api/import/csv")
def import_csv(file: UploadFile = File(...), account_id: int = Form(...), kind: str = Form(...),
               default_content_type: str | None = Form(None), period_kind: str = Form("day")):
    return db.import_csv(account_id, kind, file.file.read(), file.filename,
                         default_content_type or None, period_kind)


# --- dashboard -------------------------------------------------------------
@app.get("/api/dashboard/overview")
def overview():
    return db.overview()


@app.get("/api/dashboard/timeseries")
def timeseries(account_id: int, metric_key: str, start: str | None = None, end: str | None = None,
               period_kind: str = "day"):
    return db.timeseries(account_id, metric_key, start, end, period_kind)
