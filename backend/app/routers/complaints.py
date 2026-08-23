import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_current_resident, get_current_user, get_db
from app.models.complaint import Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus
from app.models.complaint_history import ComplaintStatusHistory
from app.models.user import User, UserRole
from app.schemas.complaint import (
    ComplaintListItem,
    ComplaintOut,
    ComplaintPriorityUpdate,
    ComplaintStatusUpdate,
)
from app.services.email import send_complaint_status_email
from app.services.settings_service import get_overdue_threshold_days
from app.services.storage import upload_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/complaints", tags=["Complaints"])



@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    category: str = Form(..., description="Category: Plumbing, Electrical, Cleanliness, Security, Parking, Other"),
    description: str = Form(..., description="Detailed description (minimum 10 characters)"),
    priority: Optional[str] = Form(ComplaintPriority.LOW.value, description="Priority: Low, Medium, High"),
    photo: Optional[UploadFile] = File(None, description="Optional photo file (jpg, png, webp)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_resident),
):
    """
    Create a new complaint (Resident only).
    Accepts multipart/form-data with optional photo upload.
    Initial status is set to Open and initial status history is recorded.
    """
    cleaned_desc = description.strip() if description else ""
    if len(cleaned_desc) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description must be at least 10 characters long.",
        )

    # Validate category enum
    matched_category: Optional[ComplaintCategory] = None
    for cat in ComplaintCategory:
        if cat.value.lower() == category.strip().lower():
            matched_category = cat
            break

    if matched_category is None:
        valid_cats = [c.value for c in ComplaintCategory]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category '{category}'. Allowed categories: {', '.join(valid_cats)}",
        )

    # Validate priority enum
    matched_priority = ComplaintPriority.LOW
    if priority:
        for prio in ComplaintPriority:
            if prio.value.lower() == priority.strip().lower():
                matched_priority = prio
                break

    photo_url: Optional[str] = None
    if photo and photo.filename:
        photo_url = await upload_image(photo)

    complaint = Complaint(
        resident_id=current_user.id,
        category=matched_category,
        description=cleaned_desc,
        photo_url=photo_url,
        status=ComplaintStatus.OPEN,
        priority=matched_priority,
    )
    db.add(complaint)
    db.flush()

    # Automatically insert initial history entry
    initial_history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=None,
        new_status=ComplaintStatus.OPEN,
        changed_by=current_user.id,
        note="Complaint raised",
    )
    db.add(initial_history)
    db.commit()
    db.refresh(complaint)

    threshold_days = get_overdue_threshold_days(db)
    complaint.is_overdue = complaint.calculate_is_overdue(threshold_days)

    return complaint


@router.get("/me", response_model=List[ComplaintListItem])
def get_my_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_resident),
):
    """
    Get all complaints created by the current resident, newest first.
    """
    threshold_days = get_overdue_threshold_days(db)
    complaints = (
        db.query(Complaint)
        .filter(Complaint.resident_id == current_user.id)
        .order_by(Complaint.created_at.desc())
        .all()
    )
    for c in complaints:
        c.is_overdue = c.calculate_is_overdue(threshold_days)

    return complaints


@router.get("/{id}", response_model=ComplaintOut)
def get_complaint_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get details of a single complaint, including full ordered audit history.
    Residents can only access their own complaints (404 otherwise).
    Admins can access any complaint.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # If the user is a resident, check ownership
    is_resident = current_user.role == UserRole.RESIDENT or current_user.role == "resident"
    is_admin = current_user.role == UserRole.ADMIN or current_user.role == "admin"

    if is_resident and complaint.resident_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    if not is_resident and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden",
        )

    threshold_days = get_overdue_threshold_days(db)
    complaint.is_overdue = complaint.calculate_is_overdue(threshold_days)

    return complaint


@router.patch("/{id}/status", response_model=ComplaintOut)
def update_complaint_status(
    id: int,
    status_update: ComplaintStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Update status of a complaint (Admin only).
    Enforces valid transition sequence: Open -> In Progress -> Resolved.
    Resolved status is terminal (rejects with 400 error).
    Triggers an asynchronous email notification to the resident in the background.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    # Terminal check
    if complaint.status == ComplaintStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint is closed. No further status changes are allowed.",
        )

    # Valid transitions: Open -> In Progress -> Resolved
    allowed_transitions = {
        ComplaintStatus.OPEN: ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.IN_PROGRESS: ComplaintStatus.RESOLVED,
    }

    expected_next = allowed_transitions.get(complaint.status)
    if status_update.new_status != expected_next:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{complaint.status.value}' to '{status_update.new_status.value}'. Allowed progression is Open -> In Progress -> Resolved.",
        )

    old_status = complaint.status
    complaint.status = status_update.new_status

    if status_update.new_status == ComplaintStatus.RESOLVED:
        complaint.resolved_at = datetime.now(timezone.utc)

    # Record audit history entry
    history_entry = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=status_update.new_status,
        changed_by=current_user.id,
        note=status_update.note or f"Status updated from {old_status.value} to {status_update.new_status.value}",
    )
    db.add(history_entry)
    db.commit()
    db.refresh(complaint)

    threshold_days = get_overdue_threshold_days(db)
    complaint.is_overdue = complaint.calculate_is_overdue(threshold_days)

    logger.info(
        f"[STATUS EVENT] Complaint ID {complaint.id} status changed from '{old_status.value}' to '{status_update.new_status.value}' by Admin '{current_user.name}' (User ID: {current_user.id}). Note: {status_update.note}"
    )

    # Trigger background email to resident
    if complaint.resident and complaint.resident.email:
        background_tasks.add_task(
            send_complaint_status_email,
            resident_email=complaint.resident.email,
            resident_name=complaint.resident.name,
            complaint_id=complaint.id,
            category=complaint.category.value,
            old_status=old_status.value if old_status else None,
            new_status=status_update.new_status.value,
            note=status_update.note,
        )

    return complaint



@router.patch("/{id}/priority", response_model=ComplaintOut)
def update_complaint_priority(
    id: int,
    priority_in: ComplaintPriorityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Update the priority of a complaint (Admin only).
    Does not insert a status history record, but logs the change.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )

    old_priority = complaint.priority
    complaint.priority = priority_in.priority
    db.commit()
    db.refresh(complaint)

    threshold_days = get_overdue_threshold_days(db)
    complaint.is_overdue = complaint.calculate_is_overdue(threshold_days)

    logger.info(
        f"[PRIORITY EVENT] Complaint ID {complaint.id} priority updated from '{old_priority.value}' to '{priority_in.priority.value}' by Admin '{current_user.name}' (User ID: {current_user.id})"
    )

    return complaint
