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
from app.models.email_log import EmailLog
from app.models.notice import Notice
from app.models.setting import AppSetting
from app.models.user import User, UserRole


def seed_demo_data():
    """Seed comprehensive administrator, residents, historical and active complaints, notices, and audit logs."""
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

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
        else:
            setting.value = "7"
            print("[OK] App Setting verified: overdue_threshold_days = 7")

        # 2. Seed Administrator
        admin_email = "admin@society.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                name="Society Secretary (Admin)",
                hashed_password=get_password_hash("adminpassword123"),
                role=UserRole.ADMIN,
                flat_no="Clubhouse Office",
                created_at=now - timedelta(days=90),
            )
            db.add(admin)
            db.flush()
            print(f"[OK] Created Administrator: {admin_email} (password: adminpassword123)")
        else:
            admin.role = UserRole.ADMIN
            admin.name = "Society Secretary (Admin)"
            admin.flat_no = "Clubhouse Office"
            admin.hashed_password = get_password_hash("adminpassword123")
            print(f"[OK] Verified Administrator: {admin_email}")

        # 3. Seed Resident Users
        residents_data = [
            ("resident@society.com", "Alice Resident", "residentpassword123", "Flat A-402", 90),
            ("agnikhil9897@gmail.com", "Nikhil Agrawal", "residentpassword123", "Flat B-304", 85),
            ("rahul.sharma@society.com", "Rahul Sharma", "residentpassword123", "Flat A-102", 80),
            ("priya.patel@society.com", "Priya Patel", "residentpassword123", "Flat B-201", 75),
            ("vikram.mehta@society.com", "Vikram Mehta", "residentpassword123", "Flat C-104", 70),
            ("sunita.rao@society.com", "Sunita Rao", "residentpassword123", "Flat D-305", 65),
            ("kavita.singh@society.com", "Kavita Singh", "residentpassword123", "Flat C-502", 60),
            ("arjun.nair@society.com", "Arjun Nair", "residentpassword123", "Flat B-601", 55),
        ]

        user_map = {"admin": admin}
        for email, name, pwd, flat, days_ago in residents_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    email=email,
                    name=name,
                    hashed_password=get_password_hash(pwd),
                    role=UserRole.RESIDENT,
                    flat_no=flat,
                    created_at=now - timedelta(days=days_ago),
                )
                db.add(u)
                db.flush()
                print(f"[OK] Created Resident: {email} ({flat})")
            else:
                u.name = name
                u.flat_no = flat
                u.hashed_password = get_password_hash(pwd)
                print(f"[OK] Updated Resident: {email} ({flat})")
            user_map[email] = u

        alice = user_map["resident@society.com"]
        nikhil = user_map["agnikhil9897@gmail.com"]
        rahul = user_map["rahul.sharma@society.com"]
        priya = user_map["priya.patel@society.com"]
        vikram = user_map["vikram.mehta@society.com"]
        sunita = user_map["sunita.rao@society.com"]
        kavita = user_map["kavita.singh@society.com"]
        arjun = user_map["arjun.nair@society.com"]

        # 4. Seed Notices (Historical & Active)
        notices_to_seed = [
            {
                "title": "Gym Equipment Maintenance & New Treadmill Calibration Completed",
                "body": "All cardio machines and free weights in the society fitness center have been serviced and recalibrated for resident use. Sanitization stations have been replenished.",
                "is_important": False,
                "days_ago": 1,
            },
            {
                "title": "Annual General Meeting (AGM) - This Sunday",
                "body": "The AGM will be held on Sunday at 10:00 AM in the clubhouse main hall. Agenda includes annual financial audit presentation, vendor contracts renewal, and election of committee members.",
                "is_important": True,
                "days_ago": 3,
            },
            {
                "title": "Pest Control & Fogging Drive Across All Towers",
                "body": "Society-wide pest control and mosquito fogging is scheduled for Saturday between 3:00 PM and 6:00 PM. Please keep balcony doors and windows closed during fogging.",
                "is_important": False,
                "days_ago": 6,
            },
            {
                "title": "Fire Drill & Emergency Evacuation Simulation Protocol",
                "body": "A mandatory fire safety drill conducted with city fire department personnel will take place on Saturday at 11:00 AM. Emergency sirens will sound for 3 minutes.",
                "is_important": True,
                "days_ago": 11,
            },
            {
                "title": "Semi-Annual Overhead Water Tank Cleaning Schedule",
                "body": "Overhead and underground water tanks for Towers A, B, C, and D will undergo chemical cleaning and UV disinfection. Water supply will remain suspended between 9:00 AM and 2:00 PM on Tuesday.",
                "is_important": True,
                "days_ago": 18,
            },
            {
                "title": "Electric Vehicle (EV) Charging Station Guidelines & Slot Allocations",
                "body": "Phase 1 of dedicated EV charging stations in basement B-1 is now operational. Residents can register their vehicles with the security office to obtain smart RFID access tags.",
                "is_important": False,
                "days_ago": 25,
            },
            {
                "title": "Security Advisory: Mandatory Visitor Registration on SocioSphere App",
                "body": "For enhanced perimeter security, all guest vehicles, delivery executives, and service personnel must be pre-approved via visitor entry tokens on the SocioSphere portal.",
                "is_important": True,
                "days_ago": 32,
            },
            {
                "title": "Monsoon Preparedness & Drainage Pre-cleaning Drive",
                "body": "Basement sump pumps, storm water drains, and terrace rain conduits have been desilted and cleared ahead of heavy monsoon forecasts. Contact maintenance for sandbag requests.",
                "is_important": False,
                "days_ago": 45,
            },
            {
                "title": "Clubhouse & Swimming Pool Timings Extended for Summer",
                "body": "The swimming pool will remain open from 6:00 AM - 11:00 AM and 4:30 PM - 9:30 PM daily. Certified lifeguards will be on duty during all operational slots.",
                "is_important": False,
                "days_ago": 60,
            },
            {
                "title": "Independence Day Flag Hoisting & Cultural Program",
                "body": "Residents are cordially invited to celebrate Independence Day at the central lawn. Flag hoisting will commence at 8:30 AM followed by sweets distribution and children's performances.",
                "is_important": True,
                "days_ago": 9,
            },
        ]

        existing_titles = {n.title for n in db.query(Notice.title).all()}
        for n_data in notices_to_seed:
            if n_data["title"] not in existing_titles:
                notice = Notice(
                    title=n_data["title"],
                    body=n_data["body"],
                    is_important=n_data["is_important"],
                    posted_by=admin.id,
                    created_at=now - timedelta(days=n_data["days_ago"]),
                )
                db.add(notice)
                db.flush()
                print(f"[OK] Seeded Notice: {n_data['title']}")
                # Add sample email log for important notices
                if n_data["is_important"]:
                    for res_email in [alice.email, nikhil.email, rahul.email, priya.email]:
                        db.add(EmailLog(
                            to_email=res_email,
                            subject=f"Important Notice: {n_data['title']}",
                            related_notice_id=notice.id,
                            status="sent",
                            sent_at=notice.created_at,
                        ))

        # 5. Seed Historical and Current Complaints
        # Structure: (resident, category, priority, status, days_ago, resolved_days_ago, description, history_steps)
        complaints_dataset = [
            # ── Alice's Complaints (Flat A-402) ──────────────────────────────
            (
                alice,
                ComplaintCategory.PLUMBING,
                ComplaintPriority.HIGH,
                ComplaintStatus.OPEN,
                12,  # 12 days ago -> Overdue!
                None,
                "Persistent water leakage from kitchen overhead concealed pipeline dripping onto lower cabinet.",
                [
                    (None, ComplaintStatus.OPEN, alice.id, 12, "Complaint raised by Alice Resident (Flat A-402)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.OPEN, admin.id, 10, "Maintenance ticket acknowledged. Plumber visit scheduled."),
                    (ComplaintStatus.OPEN, ComplaintStatus.OPEN, admin.id, 8, "SLA Breach alert: vendor parts delayed. Escalated to head plumber."),
                ]
            ),
            (
                alice,
                ComplaintCategory.ELECTRICAL,
                ComplaintPriority.MEDIUM,
                ComplaintStatus.IN_PROGRESS,
                4,
                None,
                "Master bedroom air conditioner power socket sparking and tripping the miniature circuit breaker (MCB).",
                [
                    (None, ComplaintStatus.OPEN, alice.id, 4, "Complaint raised by Alice Resident (Flat A-402)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 2, "Assigned to licensed electrician Rajesh Kumar. Inspection in progress."),
                ]
            ),
            (
                alice,
                ComplaintCategory.CLEANLINESS,
                ComplaintPriority.LOW,
                ComplaintStatus.RESOLVED,
                25,
                23,
                "Spill of oily liquid on 4th floor corridor near elevator landing creating slip hazard.",
                [
                    (None, ComplaintStatus.OPEN, alice.id, 25, "Complaint raised by Alice Resident (Flat A-402)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 24, "Housekeeping team dispatched with floor scrubbing equipment."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 23, "Floor scrubbed, dried, and non-slip safety warning sign removed."),
                ]
            ),
            (
                alice,
                ComplaintCategory.SECURITY,
                ComplaintPriority.HIGH,
                ComplaintStatus.RESOLVED,
                40,
                38,
                "Main gate visitor intercom handset dead in apartment A-402. Delivery personnel unable to buzz flat.",
                [
                    (None, ComplaintStatus.OPEN, alice.id, 40, "Complaint raised by Alice Resident (Flat A-402)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 39, "Intercom technician inspected internal wiring conduit."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 38, "Damaged patch cable replaced in duct. Sound and video buzz verified with resident."),
                ]
            ),
            (
                alice,
                ComplaintCategory.PARKING,
                ComplaintPriority.LOW,
                ComplaintStatus.RESOLVED,
                55,
                54,
                "Unauthorized white hatchback parked in allotted parking bay A-402.",
                [
                    (None, ComplaintStatus.OPEN, alice.id, 55, "Complaint raised by Alice Resident (Flat A-402)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 54.5, "Security team cross-referenced license plate in visitor registry."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 54, "Owner identified as guest of Flat C-102. Car relocated to visitor parking area."),
                ]
            ),
            (
                alice,
                ComplaintCategory.OTHER,
                ComplaintPriority.LOW,
                ComplaintStatus.OPEN,
                1,
                None,
                "Clubhouse library air conditioner remote missing from the cradle.",
                [
                    (None, ComplaintStatus.OPEN, alice.id, 1, "Complaint raised by Alice Resident (Flat A-402)"),
                ]
            ),

            # ── Nikhil's Complaints (Flat B-304) ──────────────────────────────
            (
                nikhil,
                ComplaintCategory.PLUMBING,
                ComplaintPriority.MEDIUM,
                ComplaintStatus.RESOLVED,
                15,
                14,
                "Bathroom shower mixer cartridge jammed, resulting in scalding hot water without cold water mix.",
                [
                    (None, ComplaintStatus.OPEN, nikhil.id, 15, "Complaint raised by Nikhil Agrawal (Flat B-304)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 14.5, "Plumber inspected cartridge and procured replacement ceramic valve."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 14, "Ceramic cartridge replaced. Hot/cold water temperature mixing tested successfully."),
                ]
            ),
            (
                nikhil,
                ComplaintCategory.ELECTRICAL,
                ComplaintPriority.HIGH,
                ComplaintStatus.OPEN,
                16,  # 16 days ago -> Overdue!
                None,
                "Phase line drop causing voltage fluctuations in Flat B-304; refrigerator and inverter beeping continuously.",
                [
                    (None, ComplaintStatus.OPEN, nikhil.id, 16, "Complaint raised by Nikhil Agrawal (Flat B-304)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.OPEN, admin.id, 12, "Notice forwarded to city electricity board substation engineer."),
                    (ComplaintStatus.OPEN, ComplaintStatus.OPEN, admin.id, 9, "Awaiting transformer tap-changer calibration by power company."),
                ]
            ),
            (
                nikhil,
                ComplaintCategory.SECURITY,
                ComplaintPriority.HIGH,
                ComplaintStatus.IN_PROGRESS,
                3,
                None,
                "Basement B-2 fire exit door magnetic latch failed and remains unlocked from parking lot side.",
                [
                    (None, ComplaintStatus.OPEN, nikhil.id, 3, "Complaint raised by Nikhil Agrawal (Flat B-304)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 1.5, "Security supervisor installed temporary guard and ordered 12V electromagnetic lock."),
                ]
            ),
            (
                nikhil,
                ComplaintCategory.PARKING,
                ComplaintPriority.MEDIUM,
                ComplaintStatus.RESOLVED,
                35,
                33,
                "Water dripping onto car hood from overhead drainage expansion joint above slot B-304 in basement.",
                [
                    (None, ComplaintStatus.OPEN, nikhil.id, 35, "Complaint raised by Nikhil Agrawal (Flat B-304)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 34, "Civil maintenance team injected polyurethane sealing foam into ceiling fissure."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 33, "Fissure sealed, drip tray installed as secondary safeguard. Resident confirmed dry slot."),
                ]
            ),
            (
                nikhil,
                ComplaintCategory.CLEANLINESS,
                ComplaintPriority.LOW,
                ComplaintStatus.RESOLVED,
                65,
                64,
                "Garbage chute flap on 3rd floor Tower B stuck half-open causing unpleasant odors in lobby.",
                [
                    (None, ComplaintStatus.OPEN, nikhil.id, 65, "Complaint raised by Nikhil Agrawal (Flat B-304)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.RESOLVED, admin.id, 64, "Sanitization staff cleared stuck cardboard carton from chute and lubricated hinge springs."),
                ]
            ),
            (
                nikhil,
                ComplaintCategory.OTHER,
                ComplaintPriority.LOW,
                ComplaintStatus.OPEN,
                2,
                None,
                "Children's playground swing chain link worn out and needs replacement before weekend.",
                [
                    (None, ComplaintStatus.OPEN, nikhil.id, 2, "Complaint raised by Nikhil Agrawal (Flat B-304)"),
                ]
            ),

            # ── Rahul Sharma (Flat A-102) ────────────────────────────────────
            (
                rahul,
                ComplaintCategory.PLUMBING,
                ComplaintPriority.HIGH,
                ComplaintStatus.RESOLVED,
                18,
                16,
                "Main line pressure pump vibration causing loud rattling sound in ground floor bathroom pipes.",
                [
                    (None, ComplaintStatus.OPEN, rahul.id, 18, "Complaint raised by Rahul Sharma (Flat A-102)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 17, "Hydropneumatic pump rubber dampers inspected in basement plant room."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 16, "Anti-vibration rubber pads replaced on booster pump base. Noise eliminated."),
                ]
            ),
            (
                rahul,
                ComplaintCategory.ELECTRICAL,
                ComplaintPriority.HIGH,
                ComplaintStatus.OPEN,
                10,  # 10 days ago -> Overdue!
                None,
                "Tower A entrance ramp LED floodlights not turning on automatically at dusk.",
                [
                    (None, ComplaintStatus.OPEN, rahul.id, 10, "Complaint raised by Rahul Sharma (Flat A-102)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.OPEN, admin.id, 8, "Photocell sensor scheduled for replacement."),
                ]
            ),
            (
                rahul,
                ComplaintCategory.CLEANLINESS,
                ComplaintPriority.MEDIUM,
                ComplaintStatus.RESOLVED,
                48,
                46,
                "Stagnant water near garden sprinkler valve attracting insects and mosquitoes.",
                [
                    (None, ComplaintStatus.OPEN, rahul.id, 48, "Complaint raised by Rahul Sharma (Flat A-102)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 47, "Gardener re-graded soil and cleaned valve chamber drain."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 46, "Drainage channel connected to rainwater percolation pit. Area dry."),
                ]
            ),

            # ── Priya Patel (Flat B-201) ─────────────────────────────────────
            (
                priya,
                ComplaintCategory.SECURITY,
                ComplaintPriority.HIGH,
                ComplaintStatus.IN_PROGRESS,
                2,
                None,
                "CCTV camera #08 at Tower B elevator lobby displaying static screen and lost video feed.",
                [
                    (None, ComplaintStatus.OPEN, priya.id, 2, "Complaint raised by Priya Patel (Flat B-201)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 1, "CCTV technician checking PoE network switch port."),
                ]
            ),
            (
                priya,
                ComplaintCategory.PLUMBING,
                ComplaintPriority.MEDIUM,
                ComplaintStatus.OPEN,
                14,  # 14 days ago -> Overdue!
                None,
                "Balcony rainwater downpipe joint cracked during thunderstorm, leaking onto exterior facade.",
                [
                    (None, ComplaintStatus.OPEN, priya.id, 14, "Complaint raised by Priya Patel (Flat B-201)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.OPEN, admin.id, 11, "Scaffolding contractor requested for external pipe replacement."),
                ]
            ),
            (
                priya,
                ComplaintCategory.PARKING,
                ComplaintPriority.MEDIUM,
                ComplaintStatus.RESOLVED,
                28,
                27,
                "EV charging socket in parking bay B-201 displaying ground fault indicator red light.",
                [
                    (None, ComplaintStatus.OPEN, priya.id, 28, "Complaint raised by Priya Patel (Flat B-201)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 27.5, "Electrician checked earth resistance value."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 27, "Earthing connection tightened at DB box. Charging station green light verified."),
                ]
            ),

            # ── Vikram Mehta (Flat C-104) ────────────────────────────────────
            (
                vikram,
                ComplaintCategory.ELECTRICAL,
                ComplaintPriority.HIGH,
                ComplaintStatus.RESOLVED,
                52,
                50,
                "Elevator #1 in Tower C sudden jerking stops and floor alignment off by 2 inches.",
                [
                    (None, ComplaintStatus.OPEN, vikram.id, 52, "Complaint raised by Vikram Mehta (Flat C-104)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 51, "Otis lift engineer dispatched for drive calibration."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 50, "Variable frequency drive tuned, leveling sensors cleaned. Multi-floor test passed."),
                ]
            ),
            (
                vikram,
                ComplaintCategory.CLEANLINESS,
                ComplaintPriority.LOW,
                ComplaintStatus.RESOLVED,
                38,
                36,
                "Pigeon droppings accumulated on external air conditioner ledge of Tower C 1st floor.",
                [
                    (None, ComplaintStatus.OPEN, vikram.id, 38, "Complaint raised by Vikram Mehta (Flat C-104)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 37, "Deep cleaning and sanitization team scheduled."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 36, "Area pressure-washed and bird spikes installed on AC ledge."),
                ]
            ),
            (
                vikram,
                ComplaintCategory.OTHER,
                ComplaintPriority.MEDIUM,
                ComplaintStatus.IN_PROGRESS,
                3,
                None,
                "Gym treadmill #2 belt slipping under load and displaying error code E-04.",
                [
                    (None, ComplaintStatus.OPEN, vikram.id, 3, "Complaint raised by Vikram Mehta (Flat C-104)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 1, "Fitness equipment technician booked for motor belt tension adjustment."),
                ]
            ),

            # ── Sunita Rao (Flat D-305) ──────────────────────────────────────
            (
                sunita,
                ComplaintCategory.SECURITY,
                ComplaintPriority.HIGH,
                ComplaintStatus.RESOLVED,
                22,
                20,
                "West boundary wall solar perimeter fence alarm triggered false beeps due to tree branch contact.",
                [
                    (None, ComplaintStatus.OPEN, sunita.id, 22, "Complaint raised by Sunita Rao (Flat D-305)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 21, "Horticulture staff trimmed foliage touching high-voltage fence wire."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 20, "Perimeter security fence tested. False alarm cleared."),
                ]
            ),
            (
                sunita,
                ComplaintCategory.PLUMBING,
                ComplaintPriority.LOW,
                ComplaintStatus.RESOLVED,
                70,
                68,
                "Low water flow from kitchen RO purifier connection line.",
                [
                    (None, ComplaintStatus.OPEN, sunita.id, 70, "Complaint raised by Sunita Rao (Flat D-305)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.RESOLVED, admin.id, 68, "Plumber cleared sediment filter mesh in riser line."),
                ]
            ),
            (
                sunita,
                ComplaintCategory.CLEANLINESS,
                ComplaintPriority.HIGH,
                ComplaintStatus.OPEN,
                20,  # 20 days ago -> Overdue!
                None,
                "Garbage compactor in central waste segregation yard creating foul odor across Tower D.",
                [
                    (None, ComplaintStatus.OPEN, sunita.id, 20, "Complaint raised by Sunita Rao (Flat D-305)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.OPEN, admin.id, 15, "Municipal waste management authority contacted for compactor maintenance."),
                ]
            ),

            # ── Kavita Singh (Flat C-502) ────────────────────────────────────
            (
                kavita,
                ComplaintCategory.ELECTRICAL,
                ComplaintPriority.MEDIUM,
                ComplaintStatus.RESOLVED,
                32,
                30,
                "Solar water heater heating element inoperative on cloudy mornings for 5th floor units.",
                [
                    (None, ComplaintStatus.OPEN, kavita.id, 32, "Complaint raised by Kavita Singh (Flat C-502)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 31, "Solar contractor inspected terrace heating coil."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 30, "3kW backup electric heating element replaced with 1-year warranty."),
                ]
            ),
            (
                kavita,
                ComplaintCategory.PARKING,
                ComplaintPriority.LOW,
                ComplaintStatus.RESOLVED,
                14,
                13,
                "Oil stain left by previous visitor vehicle in parking space C-502.",
                [
                    (None, ComplaintStatus.OPEN, kavita.id, 14, "Complaint raised by Kavita Singh (Flat C-502)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.RESOLVED, admin.id, 13, "Degreaser chemical applied and floor pressure washed."),
                ]
            ),
            (
                kavita,
                ComplaintCategory.OTHER,
                ComplaintPriority.LOW,
                ComplaintStatus.OPEN,
                1,
                None,
                "Swimming pool changing room shower hook broken.",
                [
                    (None, ComplaintStatus.OPEN, kavita.id, 1, "Complaint raised by Kavita Singh (Flat C-502)"),
                ]
            ),

            # ── Arjun Nair (Flat B-601) ──────────────────────────────────────
            (
                arjun,
                ComplaintCategory.PLUMBING,
                ComplaintPriority.HIGH,
                ComplaintStatus.RESOLVED,
                80,
                78,
                "Terrace rainwater outlet blocked causing 3 inches water pooling on top roof slab.",
                [
                    (None, ComplaintStatus.OPEN, arjun.id, 80, "Complaint raised by Arjun Nair (Flat B-601)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 79, "Civil maintenance team cleared accumulated debris and leaf mesh."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 78, "Heavy-duty dome drain strainer installed to prevent future clogging."),
                ]
            ),
            (
                arjun,
                ComplaintCategory.SECURITY,
                ComplaintPriority.MEDIUM,
                ComplaintStatus.RESOLVED,
                60,
                58,
                "Visitor RFID barrier arm descent speed too fast, tapped rear bumper of sedan.",
                [
                    (None, ComplaintStatus.OPEN, arjun.id, 60, "Complaint raised by Arjun Nair (Flat B-601)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 59, "Automation vendor recalibrated pneumatic deceleration dampers."),
                    (ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, admin.id, 58, "Barrier arm descent speed calibrated to 4.2 seconds safety standard."),
                ]
            ),
            (
                arjun,
                ComplaintCategory.ELECTRICAL,
                ComplaintPriority.HIGH,
                ComplaintStatus.IN_PROGRESS,
                1,
                None,
                "Terrace rooftop solar inverter displaying red alarm code Grid-Fail 09.",
                [
                    (None, ComplaintStatus.OPEN, arjun.id, 1, "Complaint raised by Arjun Nair (Flat B-601)"),
                    (ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS, admin.id, 0.5, "Solar technician on-site inspecting net-metering synchronization."),
                ]
            ),
        ]

        # Insert complaints and their status history
        existing_descs = {c.description for c in db.query(Complaint.description).all()}
        seeded_complaints_count = 0

        for resident_user, cat, prio, stat, days_ago, res_days_ago, desc, hist_steps in complaints_dataset:
            if desc in existing_descs:
                continue

            created_time = now - timedelta(days=days_ago)
            resolved_time = now - timedelta(days=res_days_ago) if (stat == ComplaintStatus.RESOLVED and res_days_ago is not None) else None

            comp = Complaint(
                resident_id=resident_user.id,
                category=cat,
                priority=prio,
                status=stat,
                description=desc,
                created_at=created_time,
                resolved_at=resolved_time,
                updated_at=resolved_time if resolved_time else created_time,
            )
            db.add(comp)
            db.flush()

            # Add detailed timeline history for this complaint
            for old_st, new_st, changed_by_id, step_days_ago, note in hist_steps:
                h_time = now - timedelta(days=step_days_ago)
                db.add(ComplaintStatusHistory(
                    complaint_id=comp.id,
                    old_status=old_st,
                    new_status=new_st,
                    changed_by=changed_by_id,
                    note=note,
                    changed_at=h_time,
                ))

            # Add email log if resolved or in-progress
            if stat in [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED]:
                db.add(EmailLog(
                    to_email=resident_user.email,
                    subject=f"Complaint #{comp.id} Status Update: {stat.value}",
                    related_complaint_id=comp.id,
                    status="sent",
                    sent_at=resolved_time if resolved_time else (created_time + timedelta(hours=6)),
                ))

            seeded_complaints_count += 1

        db.commit()

        total_users = db.query(User).count()
        total_complaints = db.query(Complaint).count()
        total_notices = db.query(Notice).count()
        total_history = db.query(ComplaintStatusHistory).count()
        total_emails = db.query(EmailLog).count()

        print("\n=======================================================")
        print(" Demo & Historical Data Successfully Seeded / Imported!")
        print(f" Total Users:       {total_users}")
        print(f" Total Complaints:  {total_complaints} (+{seeded_complaints_count} new)")
        print(f" Total History:     {total_history}")
        print(f" Total Notices:     {total_notices}")
        print(f" Total Email Logs:  {total_emails}")
        print("-------------------------------------------------------")
        print(" Administrator: admin@society.com / adminpassword123")
        print(" Resident Demo: resident@society.com / residentpassword123")
        print(" Resident User: agnikhil9897@gmail.com / residentpassword123")
        print("=======================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed seeding demo data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
