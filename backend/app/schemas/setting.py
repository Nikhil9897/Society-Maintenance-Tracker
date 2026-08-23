from pydantic import BaseModel, Field


class AdminSettingsOut(BaseModel):
    overdue_threshold_days: int


class AdminSettingsUpdate(BaseModel):
    overdue_threshold_days: int = Field(..., ge=0, le=365, description="Overdue threshold in days (0-365)")
