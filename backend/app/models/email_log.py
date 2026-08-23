from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from app.models.base import Base


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    to_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    related_complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True, index=True)
    related_notice_id = Column(Integer, ForeignKey("notices.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(20), nullable=False)  # "sent" or "failed"
    error_message = Column(Text, nullable=True)
    sent_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
