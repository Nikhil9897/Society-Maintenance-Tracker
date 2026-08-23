import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base


class ComplaintCategory(str, enum.Enum):
    PLUMBING = "Plumbing"
    ELECTRICAL = "Electrical"
    CLEANLINESS = "Cleanliness"
    SECURITY = "Security"
    PARKING = "Parking"
    OTHER = "Other"


class ComplaintStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"


class ComplaintPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    resident_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(
        SQLEnum(ComplaintCategory, values_callable=lambda x: [e.value for e in x], name="complaintcategory"),
        nullable=False,
    )
    description = Column(Text, nullable=False)
    photo_url = Column(String(500), nullable=True)
    status = Column(
        SQLEnum(ComplaintStatus, values_callable=lambda x: [e.value for e in x], name="complaintstatus"),
        default=ComplaintStatus.OPEN,
        nullable=False,
    )
    priority = Column(
        SQLEnum(ComplaintPriority, values_callable=lambda x: [e.value for e in x], name="complaintpriority"),
        default=ComplaintPriority.LOW,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    resident = relationship("User", back_populates="complaints")
    history = relationship(
        "ComplaintStatusHistory",
        back_populates="complaint",
        cascade="all, delete-orphan",
        order_by="ComplaintStatusHistory.changed_at",
    )

    @property
    def resident_name(self) -> str | None:
        return self.resident.name if self.resident else None

    @property
    def is_overdue(self) -> bool:
        if hasattr(self, "_is_overdue_override") and self._is_overdue_override is not None:
            return self._is_overdue_override
        return self.calculate_is_overdue()

    @is_overdue.setter
    def is_overdue(self, value: bool) -> None:
        self._is_overdue_override = value

    def calculate_is_overdue(self, threshold_days: int = 7) -> bool:
        if self.status == ComplaintStatus.RESOLVED or self.status == "Resolved":
            return False
        if not self.created_at:
            return False
        created = self.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        return (now - created).total_seconds() > (threshold_days * 86400)



