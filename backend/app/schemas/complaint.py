from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.complaint import ComplaintCategory, ComplaintPriority, ComplaintStatus


class ComplaintCreate(BaseModel):
    category: ComplaintCategory
    description: str = Field(..., min_length=10, description="Detailed description of the complaint (min 10 chars)")
    priority: Optional[ComplaintPriority] = ComplaintPriority.LOW


class ComplaintStatusHistoryOut(BaseModel):
    id: int
    complaint_id: int
    old_status: Optional[ComplaintStatus] = None
    new_status: ComplaintStatus
    changed_by: Optional[int] = None
    changed_by_name: Optional[str] = None
    note: Optional[str] = None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintStatusUpdate(BaseModel):
    new_status: ComplaintStatus
    note: Optional[str] = None


class ComplaintPriorityUpdate(BaseModel):
    priority: ComplaintPriority


class ComplaintOut(BaseModel):
    id: int
    resident_id: int
    resident_name: Optional[str] = None
    category: ComplaintCategory
    description: str
    photo_url: Optional[str] = None
    status: ComplaintStatus
    priority: ComplaintPriority
    is_overdue: bool = False
    created_at: datetime
    resolved_at: Optional[datetime] = None
    updated_at: datetime
    history: List[ComplaintStatusHistoryOut] = []

    model_config = ConfigDict(from_attributes=True)


class ComplaintListItem(BaseModel):
    id: int
    resident_id: int
    resident_name: Optional[str] = None
    category: ComplaintCategory
    status: ComplaintStatus
    priority: ComplaintPriority
    is_overdue: bool = False
    photo_url: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedComplaintsOut(BaseModel):
    items: List[ComplaintOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminDashboardOut(BaseModel):
    total_complaints: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    overdue_count: int

