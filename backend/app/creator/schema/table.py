from typing import Any

from pydantic import BaseModel


class GetRowPage(BaseModel):
    rows: list[dict[str, Any]]
    total: int
