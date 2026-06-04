from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import datetime


class HistoryItem(BaseModel):
    id: str
    type: Literal["conversation", "diary"]
    preview: str
    created_at: datetime
    item_count: int


class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int
    page: int
    page_size: int
    has_more: bool
