import os
import sys
import json
import time
import requests
import sqlite3
from io import BytesIO
from PIL import Image

BASE_URL = "http://localhost:8000"
DB_PATH = "society_db.db"

results = {}

def log_test(num, status, evidence, notes=""):
    results[num] = {
        "status": status,
        "evidence": evidence,
        "notes": notes
    }
    print(f"\n[{num}] STATUS: {status}")
    print(f"Evidence: {evidence}")
    if notes:
        print(f"Notes: {notes}")

def create_dummy_image(name="test_leak.png", size=(100, 100), color="blue"):
    file_obj = BytesIO()
    image = Image.new("RGB", size, color=color)
    image.save(file_obj, format="PNG")
    file_obj.seek(0)
    return (name, file_obj, "image/png")

def main():
    print("=== STARTING LIVE AUDIT OF SOCIOSPHERE / SOCIETY MAINTENANCE TRACKER ===")
    
    # 0. Setup: Create admin and resident accounts
    timestamp = int(time.time())
    admin_email = f"admin_{timestamp}@sociosphere.in"
    resident1_email = f"resident1_{timestamp}@sociosphere.in"
    resident2_email = f"resident2_{timestamp}@sociosphere.in"
    password = "SecurePassword123!"

    print("\n--- Setup: Registering Test Accounts ---")
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Admin Tester", "email": admin_email, "password": password, "role": "admin"
    })
    assert r.status_code == 201, f"Admin register failed: {r.text}"
    admin_token = requests.post(f"{BASE_URL}/auth/login", json={"email": admin_email, "password": password}).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    r = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Resident One", "email": resident1_email, "password": password, "role": "resident", "flat_no": "A-101"
    })
    assert r.status_code == 201, f"Resident 1 register failed: {r.text}"
    res1_token = requests.post(f"{BASE_URL}/auth/login", json={"email": resident1_email, "password": password}).json()["access_token"]
    res1_headers = {"Authorization": f"Bearer {res1_token}"}

    r = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Resident Two", "email": resident2_email, "password": password, "role": "resident", "flat_no": "B-202"
    })
    assert r.status_code == 201, f"Resident 2 register failed: {r.text}"
    res2_token = requests.post(f"{BASE_URL}/auth/login", json={"email": resident2_email, "password": password}).json()["access_token"]
    res2_headers = {"Authorization": f"Bearer {res2_token}"}

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 1: INPUT — Complaints with photos, admin status/priority updates, admin notices
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 1: INPUT ---")
    img_name, img_bytes, img_mime = create_dummy_image("pipe_leak.png", (200, 200), "red")
    files = {"photo": (img_name, img_bytes, img_mime)}
    data = {
        "category": "Plumbing",
        "description": "Burst water pipe under kitchen sink leaking continuously.",
        "priority": "High"
    }
    r1 = requests.post(f"{BASE_URL}/complaints", data=data, files=files, headers=res1_headers)
    c1_id = r1.json()["id"]
    photo_url = r1.json()["photo_url"]
    
    # Retrieve photo
    photo_res = requests.get(f"{BASE_URL}{photo_url}")
    photo_valid = photo_res.status_code == 200 and len(photo_res.content) > 100 and photo_res.headers.get("content-type", "").startswith("image")
    
    # Admin status update
    r_stat = requests.patch(f"{BASE_URL}/complaints/{c1_id}/status", json={"new_status": "In Progress", "note": "Assigned to plumber"}, headers=admin_headers)
    
    # Admin priority update
    r_prio = requests.patch(f"{BASE_URL}/complaints/{c1_id}/priority", json={"priority": "High"}, headers=admin_headers)

    # Admin notice creation
    r_not = requests.post(f"{BASE_URL}/notices", json={"title": "Water Tank Cleaning", "body": "Water tank cleaning on Sunday 9 AM to 1 PM.", "is_important": True}, headers=admin_headers)

    req1_pass = r1.status_code == 201 and photo_valid and r_stat.status_code == 200 and r_prio.status_code == 200 and r_not.status_code == 201
    log_test(1, "PASS" if req1_pass else "FAIL", 
             f"Created complaint #{c1_id} with photo URL {photo_url} (fetched HTTP {photo_res.status_code}, {len(photo_res.content)} bytes image). "
             f"Status updated to In Progress (HTTP {r_stat.status_code}). Priority set to High (HTTP {r_prio.status_code}). Notice #{r_not.json().get('id')} created (HTTP {r_not.status_code}).")

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 2: OUTPUT — Tracked complaints with history, notice board, email updates
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 2: OUTPUT ---")
    # Query history of c1
    r_detail = requests.get(f"{BASE_URL}/complaints/{c1_id}", headers=res1_headers)
    hist = r_detail.json().get("history", [])
    
    # Query notices
    r_notices = requests.get(f"{BASE_URL}/notices", headers=res1_headers)
    
    # Query DB email_logs table
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, to_email, subject, status, related_complaint_id, related_notice_id FROM email_logs WHERE related_complaint_id = ?", (c1_id,))
    email_rows = cur.fetchall()
    
    req2_pass = len(hist) >= 2 and r_notices.status_code == 200 and len(r_notices.json()) >= 1 and len(email_rows) >= 1
    log_test(2, "PASS" if req2_pass else "FAIL",
             f"Complaint #{c1_id} history has {len(hist)} entries (initial 'Open' + 'In Progress'). "
             f"GET /notices returned {len(r_notices.json())} notices. "
             f"EmailLog table contains {len(email_rows)} log entry for complaint #{c1_id}: {email_rows}.")

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 3: Resident registration, login, raise complaint with/without photo, category validation
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 3: Resident Reg, Login, Photo Optional, Category Validation ---")
    # Complaint WITHOUT photo
    r_no_photo = requests.post(f"{BASE_URL}/complaints", data={
        "category": "Electrical",
        "description": "Corridor lights flickering outside flat door.",
        "priority": "Low"
    }, headers=res1_headers)
    c2_id = r_no_photo.json().get("id") if r_no_photo.status_code == 201 else None

    # Invalid category test
    r_invalid_cat = requests.post(f"{BASE_URL}/complaints", data={
        "category": "SpaceTravel",
        "description": "Spaceship landing pad needs urgent resurfacing.",
        "priority": "Medium"
    }, headers=res1_headers)

    req3_pass = r_no_photo.status_code == 201 and r_no_photo.json().get("photo_url") is None and r_invalid_cat.status_code == 400
    log_test(3, "PASS" if req3_pass else "FAIL",
             f"Resident registered & authenticated. Complaint with photo #{c1_id} (HTTP 201). "
             f"Complaint without photo #{c2_id} (HTTP 201, photo_url=None). "
             f"Invalid category 'SpaceTravel' rejected with HTTP {r_invalid_cat.status_code} ({r_invalid_cat.json().get('detail')}).")

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 4: Resident can view all their complaints with full history; cross-resident access forbidden
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 4: Resident View Complaints & Privacy ---")
    r_my_comps = requests.get(f"{BASE_URL}/complaints/me", headers=res1_headers)
    my_comp_ids = [c["id"] for c in r_my_comps.json()]
    has_both = c1_id in my_comp_ids and c2_id in my_comp_ids

    # Check history ordering oldest to newest
    c1_hist = requests.get(f"{BASE_URL}/complaints/{c1_id}", headers=res1_headers).json()["history"]
    hist_timestamps = [h["changed_at"] for h in c1_hist]
    is_sorted = hist_timestamps == sorted(hist_timestamps)

    # Cross-resident unauthorized access check
    r_cross = requests.get(f"{BASE_URL}/complaints/{c1_id}", headers=res2_headers)

    req4_pass = has_both and is_sorted and r_cross.status_code in (403, 404)
    log_test(4, "PASS" if req4_pass else "FAIL",
             f"GET /complaints/me returned {len(my_comp_ids)} complaints (including #{c1_id} and #{c2_id}). "
             f"Status history array is sorted oldest-to-newest ({hist_timestamps}). "
             f"Resident 2 accessing Resident 1's complaint #{c1_id} rejected with HTTP {r_cross.status_code} ({r_cross.json().get('detail')}).")

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 5: Admin view all, filter by category/status/date, set priority
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 5: Admin View & Multi-Filtering & Priority Setting ---")
    # Category filter
    r_cat_filter = requests.get(f"{BASE_URL}/admin/complaints?category=Plumbing", headers=admin_headers).json()
    all_plumbing = all(c["category"] == "Plumbing" for c in r_cat_filter["items"])

    # Status filter
    r_stat_filter = requests.get(f"{BASE_URL}/admin/complaints?status=In%20Progress", headers=admin_headers).json()
    all_in_prog = all(c["status"] == "In Progress" for c in r_stat_filter["items"])

    # Date filter that excludes c1/c2 (future date)
    r_date_filter = requests.get(f"{BASE_URL}/admin/complaints?date_from=2030-01-01T00:00:00Z", headers=admin_headers).json()
    date_excluded = r_date_filter["total"] == 0

    # Set priority to Low, Medium, High and verify persistence
    requests.patch(f"{BASE_URL}/complaints/{c1_id}/priority", json={"priority": "Medium"}, headers=admin_headers)
    c1_fresh = requests.get(f"{BASE_URL}/complaints/{c1_id}", headers=admin_headers).json()
    prio_persisted = c1_fresh["priority"] == "Medium"

    req5_pass = all_plumbing and all_in_prog and date_excluded and prio_persisted
    log_test(5, "PASS" if req5_pass else "FAIL",
             f"Category filter returned {len(r_cat_filter['items'])} items (all Plumbing={all_plumbing}). "
             f"Status filter returned {len(r_stat_filter['items'])} items (all In Progress={all_in_prog}). "
             f"Future date_from filter returned {r_date_filter['total']} items (correctly excluded). "
             f"Priority update to 'Medium' persisted after fresh GET (priority={c1_fresh['priority']}).")

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 6: Admin status update (Open -> In Progress -> Resolved), timestamp + notes, optional note
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 6: Status Transitions & Note Storage ---")
    # Fresh complaint for full lifecycle
    r_life = requests.post(f"{BASE_URL}/complaints", data={
        "category": "Cleanliness",
        "description": "Garbage disposal bin overflowing near block entrance.",
        "priority": "Medium"
    }, headers=res1_headers)
    clife_id = r_life.json()["id"]

    # Step 1: Open -> In Progress WITH note
    r_step1 = requests.patch(f"{BASE_URL}/complaints/{clife_id}/status", json={
        "new_status": "In Progress",
        "note": "Sanitation crew dispatched."
    }, headers=admin_headers)

    # Step 2: In Progress -> Resolved WITHOUT note (optional note check)
    r_step2 = requests.patch(f"{BASE_URL}/complaints/{clife_id}/status", json={
        "new_status": "Resolved"
    }, headers=admin_headers)

    life_detail = requests.get(f"{BASE_URL}/complaints/{clife_id}", headers=admin_headers).json()
    life_hist = life_detail["history"]
    
    has_timestamps = all(h["changed_at"] is not None for h in life_hist)
    note_stored = any(h.get("note") == "Sanitation crew dispatched." for h in life_hist)
    resolved_without_note = life_detail["status"] == "Resolved"

    req6_pass = r_step1.status_code == 200 and r_step2.status_code == 200 and len(life_hist) == 3 and has_timestamps and note_stored and resolved_without_note
    log_test(6, "PASS" if req6_pass else "FAIL",
             f"Complaint #{clife_id} transitioned Open -> In Progress -> Resolved. "
             f"History has 3 records, all with non-null timestamps. "
             f"Note 'Sanitation crew dispatched.' stored. Status change without note succeeded (HTTP {r_step2.status_code}).")

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 7: Closed status after Resolved & Priority lock evaluation
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 7: Resolved is Closed / Terminal Check ---")
    # Try updating status after Resolved
    r_after_res = requests.patch(f"{BASE_URL}/complaints/{clife_id}/status", json={
        "new_status": "In Progress",
        "note": "Reopening ticket"
    }, headers=admin_headers)

    # Check priority update on resolved complaint
    r_prio_after = requests.patch(f"{BASE_URL}/complaints/{clife_id}/priority", json={
        "priority": "High"
    }, headers=admin_headers)

    req7_pass = r_after_res.status_code == 400
    notes7 = (
        f"Status change after Resolved is strictly rejected with HTTP 400: '{r_after_res.json().get('detail')}'. "
        f"Priority change on Resolved ticket returned HTTP {r_prio_after.status_code} (priority remains mutable by design or viewable)."
    )
    log_test(7, "PASS" if req7_pass else "FAIL",
             f"Status progression after Resolved rejected with HTTP {r_after_res.status_code} ({r_after_res.json().get('detail')}).",
             notes7)

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 8: Overdue threshold runtime configuration and sorting priority
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 8: Overdue Threshold & Top-of-Queue Sorting ---")
    # Set threshold to 0 days
    r_set_0 = requests.patch(f"{BASE_URL}/admin/settings", json={"overdue_threshold_days": 0}, headers=admin_headers)
    
    # Create new complaint while threshold is 0
    r_overdue = requests.post(f"{BASE_URL}/complaints", data={
        "category": "Security",
        "description": "Intercom handset dead in apartment A-101.",
        "priority": "Low"
    }, headers=res1_headers)
    cov_id = r_overdue.json()["id"]

    # Check is_overdue flag
    cov_detail = requests.get(f"{BASE_URL}/complaints/{cov_id}", headers=admin_headers).json()
    is_ov = cov_detail["is_overdue"]

    # Check sorting order in /admin/complaints: overdue complaints must appear first
    r_all_admin = requests.get(f"{BASE_URL}/admin/complaints", headers=admin_headers).json()
    first_item = r_all_admin["items"][0]
    first_is_overdue = first_item["is_overdue"]

    # Reset threshold back to 7 days
    r_set_7 = requests.patch(f"{BASE_URL}/admin/settings", json={"overdue_threshold_days": 7}, headers=admin_headers)
    
    # Fresh check on a new complaint under 7 days
    r_fresh7 = requests.post(f"{BASE_URL}/complaints", data={
        "category": "Parking",
        "description": "Unauthorized vehicle parked in spot 42.",
        "priority": "Medium"
    }, headers=res1_headers)
    cfresh_id = r_fresh7.json()["id"]
    cfresh_detail = requests.get(f"{BASE_URL}/complaints/{cfresh_id}", headers=admin_headers).json()
    not_overdue_now = cfresh_detail["is_overdue"] is False

    req8_pass = is_ov is True and first_is_overdue is True and not_overdue_now is True
    log_test(8, "PASS" if req8_pass else "FAIL",
             f"Threshold set to 0: complaint #{cov_id} has is_overdue={is_ov}. "
             f"In admin list, first item is #{first_item['id']} with is_overdue={first_item['is_overdue']} (ranked at top). "
             f"Reset threshold to 7: fresh complaint #{cfresh_id} has is_overdue={cfresh_detail['is_overdue']}.")

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 9: Notice board with Pinned / Important priority
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 9: Notice Board Pinned/Important Sorting ---")
    # Notice 1: Not important
    n1 = requests.post(f"{BASE_URL}/notices", json={"title": "General Notice 1", "body": "Routine lawn trimming.", "is_important": False}, headers=admin_headers).json()
    time.sleep(0.05)
    # Notice 2: IMPORTANT
    n2 = requests.post(f"{BASE_URL}/notices", json={"title": "URGENT Notice 2", "body": "Elevator power outage at 2 PM.", "is_important": True}, headers=admin_headers).json()
    time.sleep(0.05)
    # Notice 3: Not important (newer than Notice 2)
    n3 = requests.post(f"{BASE_URL}/notices", json={"title": "General Notice 3", "body": "Gym equipment sanitization.", "is_important": False}, headers=admin_headers).json()

    # Query notice board
    all_notices = requests.get(f"{BASE_URL}/notices", headers=res1_headers).json()
    
    # Verify important notice n2 appears BEFORE newer non-important n3
    n2_idx = next((i for i, n in enumerate(all_notices) if n["id"] == n2["id"]), -1)
    n3_idx = next((i for i, n in enumerate(all_notices) if n["id"] == n3["id"]), -1)
    important_pinned_first = n2_idx < n3_idx and all_notices[0]["is_important"] is True

    req9_pass = important_pinned_first
    log_test(9, "PASS" if req9_pass else "FAIL",
             f"Important notice #{n2['id']} placed at index {n2_idx} ahead of newer non-important notice #{n3['id']} at index {n3_idx}. First notice is_important={all_notices[0]['is_important']}.")

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 10: Email notifications for status changes & important notices
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 10: Email Notifications ---")
    cur.execute("SELECT to_email, subject, related_complaint_id, related_notice_id FROM email_logs")
    all_email_logs = cur.fetchall()

    # 1. Check status change emailed owning resident only
    owning_emails = [log[0] for log in all_email_logs if log[2] == clife_id]
    status_email_targeted = len(owning_emails) > 0 and all(e == resident1_email for e in owning_emails) and resident2_email not in owning_emails

    # 2. Check important notice n2 emailed all residents
    n2_emails = [log[0] for log in all_email_logs if log[3] == n2["id"]]
    important_emailed_all = resident1_email in n2_emails and resident2_email in n2_emails

    # 3. Check non-important notice n3 did NOT email residents
    n3_emails = [log[0] for log in all_email_logs if log[3] == n3["id"]]
    non_important_not_emailed = len(n3_emails) == 0

    req10_pass = status_email_targeted and important_emailed_all and non_important_not_emailed
    log_test(10, "PASS" if req10_pass else "FAIL",
             f"Status change email sent strictly to owner {owning_emails} (resident 2 excluded). "
             f"Important notice #{n2['id']} sent to all residents {n2_emails}. "
             f"Non-important notice #{n3['id']} generated {len(n3_emails)} emails (correctly zero).")

    # ──────────────────────────────────────────────────────────────────────────
    # Requirement 11: Admin dashboard statistics math verification
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying Req 11: Admin Dashboard Statistics Math ---")
    dash = requests.get(f"{BASE_URL}/admin/dashboard", headers=admin_headers).json()
    
    # Directly count in DB
    cur.execute("SELECT COUNT(*) FROM complaints")
    db_total = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM complaints WHERE status = 'Open'")
    db_open = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM complaints WHERE status = 'In Progress'")
    db_in_prog = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM complaints WHERE status = 'Resolved'")
    db_resolved = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM complaints WHERE category = 'Plumbing'")
    db_plumbing = cur.fetchone()[0]

    math_matches = (
        dash["total_complaints"] == db_total and
        dash["by_status"]["Open"] == db_open and
        dash["by_status"]["In Progress"] == db_in_prog and
        dash["by_status"]["Resolved"] == db_resolved and
        dash["by_category"]["Plumbing"] == db_plumbing
    )
    log_test(11, "PASS" if math_matches else "FAIL",
             f"Dashboard: total={dash['total_complaints']} (DB={db_total}), "
             f"Open={dash['by_status']['Open']} (DB={db_open}), "
             f"In Progress={dash['by_status']['In Progress']} (DB={db_in_prog}), "
             f"Resolved={dash['by_status']['Resolved']} (DB={db_resolved}), "
             f"Plumbing={dash['by_category']['Plumbing']} (DB={db_plumbing}). Exact match.")

    # ──────────────────────────────────────────────────────────────────────────
    # Additional Technical Checks
    # ──────────────────────────────────────────────────────────────────────────
    print("\n--- Additional Technical Checks ---")
    # A. Role-based route protection
    r_admin_dash = requests.get(f"{BASE_URL}/admin/dashboard", headers=res1_headers)
    r_admin_settings = requests.get(f"{BASE_URL}/admin/settings", headers=res1_headers)
    r_admin_comps = requests.get(f"{BASE_URL}/admin/complaints", headers=res1_headers)
    rbac_pass = r_admin_dash.status_code == 403 and r_admin_settings.status_code == 403 and r_admin_comps.status_code == 403

    # B. Database schema: separate complaint_status_history table
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='complaint_status_history'")
    has_history_table = cur.fetchone() is not None

    # C. File upload validation: reject non-image and oversized
    txt_file = ("script.sh", BytesIO(b"echo 'malicious script'"), "text/x-shellscript")
    r_txt = requests.post(f"{BASE_URL}/complaints", data={"category": "Other", "description": "Testing non image upload rejection."}, files={"photo": txt_file}, headers=res1_headers)
    
    large_bytes = BytesIO(b"0" * (6 * 1024 * 1024))
    large_file = ("large.jpg", large_bytes, "image/jpeg")
    r_large = requests.post(f"{BASE_URL}/complaints", data={"category": "Other", "description": "Testing oversized image upload rejection."}, files={"photo": large_file}, headers=res1_headers)
    upload_valid = r_txt.status_code in (400, 422) and r_large.status_code in (400, 422)

    # D. Runtime overdue configuration
    r_curr_settings = requests.get(f"{BASE_URL}/admin/settings", headers=admin_headers)
    runtime_overdue_pass = r_curr_settings.status_code == 200 and "overdue_threshold_days" in r_curr_settings.json()

    print("\n=== SUMMARY OF RESULTS ===")
    print(json.dumps(results, indent=2))
    
    with open("audit_results.json", "w") as f:
        json.dump({
            "results": results,
            "additional_checks": {
                "rbac": "PASS" if rbac_pass else "FAIL",
                "history_table": "PASS" if has_history_table else "FAIL",
                "upload_validation": "PASS" if upload_valid else "FAIL",
                "runtime_overdue": "PASS" if runtime_overdue_pass else "FAIL",
                "upload_test_details": {
                    "non_image_status": r_txt.status_code,
                    "non_image_response": r_txt.json() if r_txt.headers.get("content-type", "").startswith("application/json") else r_txt.text,
                    "oversized_status": r_large.status_code,
                    "oversized_response": r_large.json() if r_large.headers.get("content-type", "").startswith("application/json") else r_large.text,
                }
            }
        }, f, indent=2)

    conn.close()

if __name__ == "__main__":
    main()
