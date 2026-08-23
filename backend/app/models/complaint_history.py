from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Text, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.complaint import ComplaintStatus


class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status = Column(
        SQLEnum(ComplaintStatus, values_callable=lambda x: [e.value for e in x], name="complaintstatus"),
        nullable=True,
    )
    new_status = Column(
        SQLEnum(ComplaintStatus, values_callable=lambda x: [e.value for e in x], name="complaintstatus"),
        nullable=False,
    )
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note = Column(Text, nullable=True)
    changed_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    complaint = relationship("Complaint", back_populates="history")
    user = relationship("User")

    @property
    def changed_by_name(self) -> str | None:
        return self.user.name if self.user else None
