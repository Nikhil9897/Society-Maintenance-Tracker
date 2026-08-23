from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class NoticeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Title of the notice")
    body: str = Field(..., min_length=1, description="Body content of the notice")
    is_important: bool = Field(False, description="Flag indicating if the notice should be pinned at the top")


class NoticeOut(BaseModel):
    id: int
    title: str
    body: str
    is_important: bool
    posted_by: int
    posted_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
