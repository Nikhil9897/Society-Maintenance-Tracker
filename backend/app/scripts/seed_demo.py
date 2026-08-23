import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.core.db import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.complaint import Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus
from app.models.complaint_history import ComplaintStatusHistory
from app.models.notice import Notice
from app.models.setting import AppSetting
from app.models.user import User, UserRole


def seed_demo_data():
    """Seed initial administrator, resident, complaints, and notices."""
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed or update App Settings
        setting = db.query(AppSetting).filter(AppSetting.key == "overdue_threshold_days").first()
        if not setting:
            setting = AppSetting(
                key="overdue_threshold_days",
                value="7",
                description="Number of days before an unresolved complaint is marked overdue",
            )
            db.add(setting)
            print("[OK] App Setting seeded: overdue_threshold_days = 7")

        # 2. Seed Admin User
        admin_email = "admin@society.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                name="Society Secretary (Admin)",
                hashed_password=get_password_hash("adminpassword123"),
                role=UserRole.ADMIN,
            )
            db.add(admin)
            db.flush()
            print(f"[OK] Created Administrator: {admin_email} (password: adminpassword123)")
        else:
            admin.role = UserRole.ADMIN
            admin.name = "Society Secretary (Admin)"
            admin.hashed_password = get_password_hash("adminpassword123")
            print(f"[OK] Updated Administrator: {admin_email} (password reset to: adminpassword123)")

        # 3. Seed Resident User
        resident_email = "resident@society.com"
        resident = db.query(User).filter(User.email == resident_email).first()
        if not resident:
            resident = User(
                email=resident_email,
                name="Alice Resident (Flat A-402)",
                hashed_password=get_password_hash("residentpassword123"),
                role=UserRole.RESIDENT,
            )
            db.add(resident)
            db.flush()
            print(f"[OK] Created Resident: {resident_email} (password: residentpassword123)")
        else:
            resident.role = UserRole.RESIDENT
            resident.hashed_password = get_password_hash("residentpassword123")
            print(f"[OK] Updated Resident: {resident_email} (password reset to: residentpassword123)")


        # 4. Seed Notices if none exist
        if db.query(Notice).count() == 0:
            notice_important = Notice(
                title="Annual General Meeting (AGM) - This Sunday",
                body="The AGM will be held on Sunday at 10:00 AM in the clubhouse. All flat owners are requested to attend.",
                is_important=True,
                posted_by=admin.id,
                created_at=datetime.now(timezone.utc) - timedelta(days=2),
            )
            notice_normal = Notice(
                title="Gym Equipment Maintenance Completed",
                body="Treadmills and free weights have been serviced and calibrated for resident use.",
                is_important=False,
                posted_by=admin.id,
                created_at=datetime.now(timezone.utc) - timedelta(hours=5),
            )
            db.add_all([notice_important, notice_normal])
            print("[OK] Seeded sample notices (Important & Regular)")

        # 5. Seed Complaints if none exist
        if db.query(Complaint).count() == 0:
            now = datetime.now(timezone.utc)

            # C1: Plumbing (Open, Overdue)
            c1 = Complaint(
                resident_id=resident.id,
                category=ComplaintCategory.PLUMBING,
                description="Water leak from the kitchen overhead pipeline dripping onto floor.",
                status=ComplaintStatus.OPEN,
                priority=ComplaintPriority.HIGH,
                created_at=now - timedelta(days=10),
            )
            db.add(c1)
            db.flush()
            db.add(ComplaintStatusHistory(
                complaint_id=c1.id,
                old_status=None,
                new_status=ComplaintStatus.OPEN,
                changed_by=resident.id,
                note="Complaint raised",
                changed_at=now - timedelta(days=10),
            ))

            # C2: Electrical (In Progress)
            c2 = Complaint(
                resident_id=resident.id,
                category=ComplaintCategory.ELECTRICAL,
                description="Master bedroom switchboard sparking when turning on air conditioner.",
                status=ComplaintStatus.IN_PROGRESS,
                priority=ComplaintPriority.HIGH,
                created_at=now - timedelta(days=3),
            )
            db.add(c2)
            db.flush()
            db.add(ComplaintStatusHistory(
                complaint_id=c2.id,
                old_status=None,
                new_status=ComplaintStatus.OPEN,
                changed_by=resident.id,
                note="Complaint raised",
                changed_at=now - timedelta(days=3),
            ))
            db.add(ComplaintStatusHistory(
                complaint_id=c2.id,
                old_status=ComplaintStatus.OPEN,
                new_status=ComplaintStatus.IN_PROGRESS,
                changed_by=admin.id,
                note="Electrician assigned to visit between 3 PM - 5 PM.",
                changed_at=now - timedelta(days=1),
            ))

            # C3: Cleanliness (Resolved)
            c3 = Complaint(
                resident_id=resident.id,
                category=ComplaintCategory.CLEANLINESS,
                description="Spill in corridor near elevator 2 on 4th floor.",
                status=ComplaintStatus.RESOLVED,
                priority=ComplaintPriority.LOW,
                created_at=now - timedelta(days=5),
                resolved_at=now - timedelta(days=4),
            )
            db.add(c3)
            db.flush()
            db.add(ComplaintStatusHistory(
                complaint_id=c3.id,
                old_status=None,
                new_status=ComplaintStatus.OPEN,
                changed_by=resident.id,
                note="Complaint raised",
                changed_at=now - timedelta(days=5),
            ))
            db.add(ComplaintStatusHistory(
                complaint_id=c3.id,
                old_status=ComplaintStatus.OPEN,
                new_status=ComplaintStatus.IN_PROGRESS,
                changed_by=admin.id,
                note="Housekeeping staff notified.",
                changed_at=now - timedelta(days=5, hours=-2),
            ))
            db.add(ComplaintStatusHistory(
                complaint_id=c3.id,
                old_status=ComplaintStatus.IN_PROGRESS,
                new_status=ComplaintStatus.RESOLVED,
                changed_by=admin.id,
                note="Floor cleaned and sanitized.",
                changed_at=now - timedelta(days=4),
            ))

            print("[OK] Seeded sample complaints (Open Overdue, In Progress, Resolved)")

        db.commit()
        print("\n=======================================================")
        print(" Demo Data Successfully Seeded!")
        print(" Admin Login:    admin@society.com / adminpassword123")
        print(" Resident Login: resident@society.com / residentpassword123")
        print("=======================================================")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed seeding demo data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
