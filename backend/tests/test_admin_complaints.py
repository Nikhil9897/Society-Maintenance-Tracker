from datetime import datetime, timedelta, timezone
import pytest
from app.models.complaint import Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus
from tests.test_complaints import get_auth_token


def test_admin_settings_get_and_patch(client):
    adm_token = get_auth_token(client, "admin_set@example.com", "pass123", role="admin")
    res_token = get_auth_token(client, "res_set@example.com", "pass123", role="resident")

    adm_headers = {"Authorization": f"Bearer {adm_token}"}
    res_headers = {"Authorization": f"Bearer {res_token}"}

    # 1. Admin gets current threshold
    get_res = client.get("/admin/settings", headers=adm_headers)
    assert get_res.status_code == 200
    assert get_res.json()["overdue_threshold_days"] == 7

    # 2. Admin updates threshold to 14 days
    patch_res = client.patch(
        "/admin/settings",
        json={"overdue_threshold_days": 14},
        headers=adm_headers
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["overdue_threshold_days"] == 14

    # 3. Verify get reflects the updated value
    get_again = client.get("/admin/settings", headers=adm_headers)
    assert get_again.status_code == 200
    assert get_again.json()["overdue_threshold_days"] == 14

    # 4. Resident forbidden
    res_get = client.get("/admin/settings", headers=res_headers)
    assert res_get.status_code == 403


def test_overdue_detection_open_vs_resolved(client, db_session):
    res_token = get_auth_token(client, "res_overdue@example.com", "pass123", role="resident")
    adm_token = get_auth_token(client, "adm_overdue@example.com", "pass123", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # 1. Create complaint (Open)
    create_res = client.post(
        "/complaints",
        data={"category": "Plumbing", "description": "Persistent leakage in flat bathroom"},
        headers=res_headers
    )
    complaint_id = create_res.json()["id"]

    # Initially not overdue (< 7 days old)
    get_init = client.get(f"/complaints/{complaint_id}", headers=res_headers)
    assert get_init.status_code == 200
    assert get_init.json()["is_overdue"] is False

    # Simulate complaint created 10 days ago (older than threshold of 7 days)
    comp_db = db_session.query(Complaint).filter(Complaint.id == complaint_id).first()
    comp_db.created_at = datetime.now(timezone.utc) - timedelta(days=10)
    db_session.commit()

    # Now complaint should be overdue on read
    get_overdue = client.get(f"/complaints/{complaint_id}", headers=res_headers)
    assert get_overdue.status_code == 200
    assert get_overdue.json()["is_overdue"] is True

    # Transition Open -> In Progress -> Resolved
    client.patch(f"/complaints/{complaint_id}/status", json={"new_status": "In Progress"}, headers=adm_headers)
    client.patch(f"/complaints/{complaint_id}/status", json={"new_status": "Resolved"}, headers=adm_headers)

    # After being resolved, is_overdue must be False regardless of age
    get_resolved = client.get(f"/complaints/{complaint_id}", headers=res_headers)
    assert get_resolved.status_code == 200
    assert get_resolved.json()["status"] == "Resolved"
    assert get_resolved.json()["is_overdue"] is False


def test_admin_complaints_filtering(client, db_session):
    res_token = get_auth_token(client, "res_filter@example.com", "pass123", role="resident")
    adm_token = get_auth_token(client, "adm_filter@example.com", "pass123", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # Create 3 complaints with different categories
    c1 = client.post("/complaints", data={"category": "Plumbing", "description": "Bathroom sink broken"}, headers=res_headers).json()
    c2 = client.post("/complaints", data={"category": "Electrical", "description": "Sparking corridor outlet"}, headers=res_headers).json()
    c3 = client.post("/complaints", data={"category": "Cleanliness", "description": "Staircase dusting required"}, headers=res_headers).json()

    # Transition c2 to In Progress
    client.patch(f"/complaints/{c2['id']}/status", json={"new_status": "In Progress"}, headers=adm_headers)

    # Filter by category = Plumbing
    res_cat = client.get("/admin/complaints?category=Plumbing", headers=adm_headers)
    assert res_cat.status_code == 200
    data_cat = res_cat.json()
    assert data_cat["total"] == 1
    assert data_cat["items"][0]["category"] == "Plumbing"

    # Filter by status = In Progress
    res_stat = client.get("/admin/complaints?status=In Progress", headers=adm_headers)
    assert res_stat.status_code == 200
    data_stat = res_stat.json()
    assert data_stat["total"] == 1
    assert data_stat["items"][0]["id"] == c2["id"]

    # Filter by date_from in the past
    past_date = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    res_date = client.get("/admin/complaints", params={"date_from": past_date}, headers=adm_headers)
    assert res_date.status_code == 200
    assert res_date.json()["total"] == 3


def test_admin_complaints_overdue_first_sorting(client, db_session):
    res_token = get_auth_token(client, "res_sort@example.com", "pass123", role="resident")
    adm_token = get_auth_token(client, "adm_sort@example.com", "pass123", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # Create 4 complaints
    # C1: Created 15 days ago, Low priority (Overdue)
    r1 = client.post("/complaints", data={"category": "Cleanliness", "description": "Overdue Low Priority 1", "priority": "Low"}, headers=res_headers).json()
    # C2: Created 20 days ago, High priority (Overdue)
    r2 = client.post("/complaints", data={"category": "Security", "description": "Overdue High Priority 2", "priority": "High"}, headers=res_headers).json()
    # C3: Created 1 day ago, High priority (Not Overdue)
    r3 = client.post("/complaints", data={"category": "Electrical", "description": "Recent High Priority 3", "priority": "High"}, headers=res_headers).json()
    # C4: Created 2 days ago, Medium priority (Not Overdue)
    r4 = client.post("/complaints", data={"category": "Plumbing", "description": "Recent Medium Priority 4", "priority": "Medium"}, headers=res_headers).json()

    # Modify created_at dates directly in DB
    now = datetime.now(timezone.utc)
    c1_db = db_session.query(Complaint).filter(Complaint.id == r1["id"]).first()
    c1_db.created_at = now - timedelta(days=15)

    c2_db = db_session.query(Complaint).filter(Complaint.id == r2["id"]).first()
    c2_db.created_at = now - timedelta(days=20)

    c3_db = db_session.query(Complaint).filter(Complaint.id == r3["id"]).first()
    c3_db.created_at = now - timedelta(days=1)

    c4_db = db_session.query(Complaint).filter(Complaint.id == r4["id"]).first()
    c4_db.created_at = now - timedelta(days=2)

    db_session.commit()

    # Query GET /admin/complaints
    response = client.get("/admin/complaints", headers=adm_headers)
    assert response.status_code == 200
    data = response.json()
    items = data["items"]
    assert len(items) == 4

    # Expected order:
    # 1. C2: Overdue (is_overdue=True) + High Priority
    # 2. C1: Overdue (is_overdue=True) + Low Priority
    # 3. C3: Not Overdue (is_overdue=False) + High Priority
    # 4. C4: Not Overdue (is_overdue=False) + Medium Priority
    assert items[0]["id"] == r2["id"]
    assert items[0]["is_overdue"] is True
    assert items[0]["priority"] == "High"

    assert items[1]["id"] == r1["id"]
    assert items[1]["is_overdue"] is True
    assert items[1]["priority"] == "Low"

    assert items[2]["id"] == r3["id"]
    assert items[2]["is_overdue"] is False
    assert items[2]["priority"] == "High"

    assert items[3]["id"] == r4["id"]
    assert items[3]["is_overdue"] is False
    assert items[3]["priority"] == "Medium"


def test_admin_priority_update(client):
    res_token = get_auth_token(client, "res_prio@example.com", "pass123", role="resident")
    adm_token = get_auth_token(client, "adm_prio@example.com", "pass123", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    create_res = client.post(
        "/complaints",
        data={"category": "Parking", "description": "Unauthorized car blocking my slot", "priority": "Low"},
        headers=res_headers
    )
    complaint_id = create_res.json()["id"]
    assert create_res.json()["priority"] == "Low"
    assert len(create_res.json()["history"]) == 1

    # Admin updates priority to High
    patch_res = client.patch(
        f"/complaints/{complaint_id}/priority",
        json={"priority": "High"},
        headers=adm_headers
    )
    assert patch_res.status_code == 200
    p_data = patch_res.json()
    assert p_data["priority"] == "High"
    # Status history remains untouched (only status changes are tracked in history)
    assert len(p_data["history"]) == 1

    # Resident cannot update priority -> 403 Forbidden
    res_patch = client.patch(
        f"/complaints/{complaint_id}/priority",
        json={"priority": "Medium"},
        headers=res_headers
    )
    assert res_patch.status_code == 403
    assert res_patch.json()["detail"] == "Admin access required"


def test_non_admin_forbidden_on_all_admin_routes(client):
    res_token = get_auth_token(client, "res_forbid_admin@example.com", "pass123", role="resident")
    res_headers = {"Authorization": f"Bearer {res_token}"}

    # 1. GET /admin/settings
    r1 = client.get("/admin/settings", headers=res_headers)
    assert r1.status_code == 403

    # 2. PATCH /admin/settings
    r2 = client.patch("/admin/settings", json={"overdue_threshold_days": 10}, headers=res_headers)
    assert r2.status_code == 403

    # 3. GET /admin/complaints
    r3 = client.get("/admin/complaints", headers=res_headers)
    assert r3.status_code == 403

    # 4. GET /admin/dashboard
    r4 = client.get("/admin/dashboard", headers=res_headers)
    assert r4.status_code == 403

    # 5. Unauthenticated requests
    r5 = client.get("/admin/complaints")
    assert r5.status_code == 401


def test_admin_dashboard_aggregation(client, db_session):
    res_token = get_auth_token(client, "res_dash@example.com", "pass123", role="resident")
    adm_token = get_auth_token(client, "adm_dash@example.com", "pass123", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # 1. Seed complaints across various categories and statuses
    # C1: Plumbing, Open, 10 days ago -> Overdue
    c1 = client.post("/complaints", data={"category": "Plumbing", "description": "Plumbing leak under kitchen sink"}, headers=res_headers).json()
    # C2: Electrical, Open, 1 day ago -> Not Overdue
    c2 = client.post("/complaints", data={"category": "Electrical", "description": "Flickering hallway lightbulb"}, headers=res_headers).json()
    # C3: Cleanliness, In Progress, 12 days ago -> Overdue
    c3 = client.post("/complaints", data={"category": "Cleanliness", "description": "Lobby floor needs scrubbing"}, headers=res_headers).json()
    # C4: Security, In Progress, 2 days ago -> Not Overdue
    c4 = client.post("/complaints", data={"category": "Security", "description": "Intercom audio not clear"}, headers=res_headers).json()
    # C5: Parking, Resolved, 15 days ago -> Resolved (NOT overdue)
    c5 = client.post("/complaints", data={"category": "Parking", "description": "Car parked in wrong bay slot"}, headers=res_headers).json()
    # C6: Other, Resolved, 3 days ago -> Resolved (NOT overdue)
    c6 = client.post("/complaints", data={"category": "Other", "description": "Gym AC remote control missing"}, headers=res_headers).json()

    # Move C3 and C4 to In Progress
    client.patch(f"/complaints/{c3['id']}/status", json={"new_status": "In Progress"}, headers=adm_headers)
    client.patch(f"/complaints/{c4['id']}/status", json={"new_status": "In Progress"}, headers=adm_headers)

    # Move C5 and C6 to Resolved (via Open -> In Progress -> Resolved)
    client.patch(f"/complaints/{c5['id']}/status", json={"new_status": "In Progress"}, headers=adm_headers)
    client.patch(f"/complaints/{c5['id']}/status", json={"new_status": "Resolved"}, headers=adm_headers)

    client.patch(f"/complaints/{c6['id']}/status", json={"new_status": "In Progress"}, headers=adm_headers)
    client.patch(f"/complaints/{c6['id']}/status", json={"new_status": "Resolved"}, headers=adm_headers)

    # Update created_at timestamps in DB
    now = datetime.now(timezone.utc)
    for comp_id, days_ago in [(c1["id"], 10), (c2["id"], 1), (c3["id"], 12), (c4["id"], 2), (c5["id"], 15), (c6["id"], 3)]:
        comp_obj = db_session.query(Complaint).filter(Complaint.id == comp_id).first()
        comp_obj.created_at = now - timedelta(days=days_ago)
    db_session.commit()

    # 2. Fetch dashboard aggregations
    dash_res = client.get("/admin/dashboard", headers=adm_headers)
    assert dash_res.status_code == 200
    data = dash_res.json()

    # Total complaints = 6
    assert data["total_complaints"] == 6

    # by_status check: Open: 2, In Progress: 2, Resolved: 2
    assert data["by_status"]["Open"] == 2
    assert data["by_status"]["In Progress"] == 2
    assert data["by_status"]["Resolved"] == 2

    # by_category check: 1 in each of the 6 categories
    assert data["by_category"]["Plumbing"] == 1
    assert data["by_category"]["Electrical"] == 1
    assert data["by_category"]["Cleanliness"] == 1
    assert data["by_category"]["Security"] == 1
    assert data["by_category"]["Parking"] == 1
    assert data["by_category"]["Other"] == 1

    # overdue_count check: C1 (Plumbing, Open, 10d) + C3 (Cleanliness, In Progress, 12d) = 2
    assert data["overdue_count"] == 2


def test_overdue_threshold_boundary_precision(client, db_session):
    res_token = get_auth_token(client, "res_bound@example.com", "pass123", role="resident")
    adm_token = get_auth_token(client, "adm_bound@example.com", "pass123", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # Set threshold to 5 days
    client.patch("/admin/settings", json={"overdue_threshold_days": 5}, headers=adm_headers)

    now = datetime.now(timezone.utc)

    # C_just_overdue: created 5 days and 10 seconds ago -> Overdue
    c1 = client.post("/complaints", data={"category": "Plumbing", "description": "Pipe leaking in bathroom ceiling"}, headers=res_headers).json()
    # C_just_not_overdue: created 4 days, 23 hours, 59 mins ago -> NOT Overdue
    c2 = client.post("/complaints", data={"category": "Electrical", "description": "Dim light in basement car park"}, headers=res_headers).json()

    db_c1 = db_session.query(Complaint).filter(Complaint.id == c1["id"]).first()
    db_c1.created_at = now - timedelta(days=5, seconds=10)

    db_c2 = db_session.query(Complaint).filter(Complaint.id == c2["id"]).first()
    db_c2.created_at = now - timedelta(days=4, hours=23, minutes=59)

    db_session.commit()

    # Query admin complaints
    res = client.get("/admin/complaints", headers=adm_headers)
    items = res.json()["items"]

    c1_item = next(i for i in items if i["id"] == c1["id"])
    c2_item = next(i for i in items if i["id"] == c2["id"])

    assert c1_item["is_overdue"] is True
    assert c2_item["is_overdue"] is False


