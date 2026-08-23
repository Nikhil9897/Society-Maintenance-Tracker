from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_current_user, get_db
from app.models.notice import Notice
from app.models.user import User, UserRole
from app.schemas.notice import NoticeCreate, NoticeOut
from app.services.email import send_important_notice_emails

router = APIRouter(prefix="/notices", tags=["Notices"])


@router.post("", response_model=NoticeOut, status_code=status.HTTP_201_CREATED)
def create_notice(
    notice_in: NoticeCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Create a new society notice (Admin only).
    If marked important (is_important=True), sends email notifications to all residents in the background.
    """
    notice = Notice(
        title=notice_in.title.strip(),
        body=notice_in.body.strip(),
        is_important=notice_in.is_important,
        posted_by=current_user.id,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    # If marked important, batch email all residents asynchronously
    if notice.is_important:
        residents = db.query(User).filter(
            (User.role == UserRole.RESIDENT) | (User.role == "resident")
        ).all()
        resident_emails = [r.email for r in residents if r.email]
        if resident_emails:
            background_tasks.add_task(
                send_important_notice_emails,
                resident_emails=resident_emails,
                notice_id=notice.id,
                notice_title=notice.title,
                notice_body=notice.body,
            )

    return notice


@router.get("", response_model=List[NoticeOut])
def get_notices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all society notices (Resident and Admin).
    Pinned notices (is_important=True) appear first, sorted newest-first within each group.
    """
    notices = (
        db.query(Notice)
        .order_by(Notice.is_important.desc(), Notice.created_at.desc())
        .all()
    )
    return notices
