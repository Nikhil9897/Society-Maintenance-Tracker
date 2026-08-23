import math
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, case, func
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_db
from app.models.complaint import Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus
from app.models.user import User
from app.schemas.complaint import AdminDashboardOut, PaginatedComplaintsOut
from app.schemas.setting import AdminSettingsOut, AdminSettingsUpdate
from app.services.settings_service import get_overdue_threshold_days, update_overdue_threshold_days

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/settings", response_model=AdminSettingsOut)
def get_admin_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Get application settings, including overdue threshold days (Admin only).
    """
    threshold_days = get_overdue_threshold_days(db)
    return AdminSettingsOut(overdue_threshold_days=threshold_days)


@router.patch("/settings", response_model=AdminSettingsOut)
def update_admin_settings(
    settings_in: AdminSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Update application settings such as overdue threshold days (Admin only).
    """
    updated_days = update_overdue_threshold_days(db, settings_in.overdue_threshold_days)
    return AdminSettingsOut(overdue_threshold_days=updated_days)


@router.get("/dashboard", response_model=AdminDashboardOut)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Retrieve admin dashboard aggregate statistics (Admin only).
    Uses single efficient SQL aggregations:
    - total_complaints: func.count(Complaint.id)
    - by_status: GROUP BY Complaint.status
    - by_category: GROUP BY Complaint.category
    - overdue_count: single COUNT query with non-resolved & created_at < cutoff WHERE clause
    """
    threshold_days = get_overdue_threshold_days(db)
    cutoff = datetime.now(timezone.utc) - timedelta(days=threshold_days)

    # 1. Total complaints
    total_complaints = db.query(func.count(Complaint.id)).scalar() or 0

    # 2. Status aggregation
    by_status = {st.value: 0 for st in ComplaintStatus}
    status_counts = (
        db.query(Complaint.status, func.count(Complaint.id))
        .group_by(Complaint.status)
        .all()
    )
    for st, count in status_counts:
        key = st.value if isinstance(st, ComplaintStatus) else str(st)
        by_status[key] = count

    # 3. Category aggregation
    by_category = {cat.value: 0 for cat in ComplaintCategory}
    category_counts = (
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .all()
    )
    for cat, count in category_counts:
        key = cat.value if isinstance(cat, ComplaintCategory) else str(cat)
        by_category[key] = count

    # 4. Overdue count (single query with WHERE filter)
    overdue_count = (
        db.query(func.count(Complaint.id))
        .filter(
            Complaint.status != ComplaintStatus.RESOLVED,
            Complaint.created_at <= cutoff,
        )
        .scalar()
        or 0
    )

    return AdminDashboardOut(
        total_complaints=total_complaints,
        by_status=by_status,
        by_category=by_category,
        overdue_count=overdue_count,
    )


@router.get("/complaints", response_model=PaginatedComplaintsOut)
def get_admin_complaints(
    category: Optional[ComplaintCategory] = Query(None, description="Filter by complaint category"),
    status: Optional[ComplaintStatus] = Query(None, description="Filter by status (Open, In Progress, Resolved)"),
    date_from: Optional[datetime] = Query(None, description="Filter complaints created on or after date/time"),
    date_to: Optional[datetime] = Query(None, description="Filter complaints created on or before date/time"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Retrieve all complaints with multi-criteria filtering and pagination (Admin only).
    Sorted by: Overdue complaints first -> Priority (High > Medium > Low) -> Newest first.
    """
    threshold_days = get_overdue_threshold_days(db)
    query = db.query(Complaint)

    if category:
        query = query.filter(Complaint.category == category)
    if status:
        query = query.filter(Complaint.status == status)
    if date_from:
        query = query.filter(Complaint.created_at >= date_from)
    if date_to:
        query = query.filter(Complaint.created_at <= date_to)

    # Sorting logic:
    # 1. Overdue first (status != Resolved AND created_at < cutoff)
    # 2. Priority: High (1) > Medium (2) > Low (3)
    # 3. Newest first (created_at desc)
    cutoff = datetime.now(timezone.utc) - timedelta(days=threshold_days)
    is_overdue_expr = case(
        (and_(Complaint.status != ComplaintStatus.RESOLVED, Complaint.created_at <= cutoff), 0),
        else_=1,
    )
    priority_expr = case(
        (Complaint.priority == ComplaintPriority.HIGH, 1),
        (Complaint.priority == ComplaintPriority.MEDIUM, 2),
        (Complaint.priority == ComplaintPriority.LOW, 3),
        else_=4,
    )

    query = query.order_by(is_overdue_expr.asc(), priority_expr.asc(), Complaint.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    for item in items:
        item.is_overdue = item.calculate_is_overdue(threshold_days)

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PaginatedComplaintsOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
