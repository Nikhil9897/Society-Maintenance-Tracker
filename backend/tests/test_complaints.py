import io
import pytest


def get_auth_token(client, email, password, name="Test User", role="resident", flat_no="101"):
    client.post("/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
        "role": role,
        "flat_no": flat_no,
    })
    res = client.post("/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


def test_create_complaint_without_photo(client):
    token = get_auth_token(client, "res1@example.com", "pass123", name="Resident One")
    headers = {"Authorization": f"Bearer {token}"}

    data = {
        "category": "Plumbing",
        "description": "Severe water leakage in kitchen sink",
        "priority": "High"
    }

    response = client.post("/complaints", data=data, headers=headers)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["category"] == "Plumbing"
    assert res_data["description"] == "Severe water leakage in kitchen sink"
    assert res_data["priority"] == "High"
    assert res_data["status"] == "Open"
    assert res_data["photo_url"] is None
    assert res_data["resident_name"] == "Resident One"
    assert "id" in res_data
    assert "created_at" in res_data

    # Verify initial history entry was created automatically
    assert len(res_data["history"]) == 1
    initial_hist = res_data["history"][0]
    assert initial_hist["old_status"] is None
    assert initial_hist["new_status"] == "Open"
    assert initial_hist["note"] == "Complaint raised"
    assert initial_hist["changed_by_name"] == "Resident One"


def test_create_complaint_with_valid_photo(client):
    token = get_auth_token(client, "res2@example.com", "pass123", name="Resident Two")
    headers = {"Authorization": f"Bearer {token}"}

    # 1KB dummy jpeg image
    fake_image_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"A" * 1000
    files = {
        "photo": ("leak.jpg", io.BytesIO(fake_image_bytes), "image/jpeg")
    }
    data = {
        "category": "Electrical",
        "description": "Corridor light is flickering constantly",
        "priority": "Medium"
    }

    response = client.post("/complaints", data=data, files=files, headers=headers)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["category"] == "Electrical"
    assert res_data["photo_url"] is not None
    assert res_data["photo_url"].startswith("/uploads/") or "cloudinary" in res_data["photo_url"]
    assert res_data["resident_name"] == "Resident Two"


def test_create_complaint_invalid_category_rejected(client):
    token = get_auth_token(client, "res3@example.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}

    data = {
        "category": "AlienInvasion",
        "description": "UFO landed on terrace and blocked antenna"
    }
    response = client.post("/complaints", data=data, headers=headers)
    assert response.status_code == 400
    assert "Invalid category" in response.json()["detail"]


def test_create_complaint_short_description_rejected(client):
    token = get_auth_token(client, "res4@example.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}

    data = {
        "category": "Cleanliness",
        "description": "Dirty"  # < 10 chars
    }
    response = client.post("/complaints", data=data, headers=headers)
    assert response.status_code == 400
    assert "Description must be at least 10 characters long" in response.json()["detail"]


def test_create_complaint_invalid_file_type_rejected(client):
    token = get_auth_token(client, "res5@example.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}

    files = {
        "photo": ("document.pdf", io.BytesIO(b"%PDF-1.4 dummy content"), "application/pdf")
    }
    data = {
        "category": "Security",
        "description": "Main gate intercom not responding"
    }
    response = client.post("/complaints", data=data, files=files, headers=headers)
    assert response.status_code == 400
    assert "Invalid image format" in response.json()["detail"]


def test_create_complaint_oversized_file_rejected(client):
    token = get_auth_token(client, "res6@example.com", "pass123")
    headers = {"Authorization": f"Bearer {token}"}

    # 5MB + 1KB dummy file
    oversized_bytes = b"\xff\xd8\xff\xe0" + b"X" * (5 * 1024 * 1024 + 1024)
    files = {
        "photo": ("huge.jpg", io.BytesIO(oversized_bytes), "image/jpeg")
    }
    data = {
        "category": "Parking",
        "description": "Unauthorized vehicle parked in slot 14"
    }
    response = client.post("/complaints", data=data, files=files, headers=headers)
    assert response.status_code == 400
    assert "5MB limit" in response.json()["detail"]


def test_get_my_complaints_list(client):
    token1 = get_auth_token(client, "resident_a@example.com", "pass123", name="Resident A")
    token2 = get_auth_token(client, "resident_b@example.com", "pass123", name="Resident B")

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Resident A creates 2 complaints
    client.post("/complaints", data={"category": "Plumbing", "description": "Sink leakage in flat A1"}, headers=headers1)
    client.post("/complaints", data={"category": "Electrical", "description": "Switchboard sparks in flat A1"}, headers=headers1)

    # Resident B creates 1 complaint
    client.post("/complaints", data={"category": "Cleanliness", "description": "Lobby corridor garbage not cleaned"}, headers=headers2)

    # Resident A retrieves their complaints
    res_a = client.get("/complaints/me", headers=headers1)
    assert res_a.status_code == 200
    items_a = res_a.json()
    assert len(items_a) == 2
    # Ensure newest first (the electrical complaint created 2nd should be first)
    assert items_a[0]["category"] == "Electrical"
    assert items_a[1]["category"] == "Plumbing"
    assert all(item["resident_name"] == "Resident A" for item in items_a)

    # Resident B retrieves their complaints
    res_b = client.get("/complaints/me", headers=headers2)
    assert res_b.status_code == 200
    items_b = res_b.json()
    assert len(items_b) == 1
    assert items_b[0]["category"] == "Cleanliness"
    assert items_b[0]["resident_name"] == "Resident B"


def test_resident_cannot_see_other_resident_complaint(client):
    token1 = get_auth_token(client, "alice_res@example.com", "pass123", name="Alice")
    token2 = get_auth_token(client, "bob_res@example.com", "pass123", name="Bob")

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Alice creates a complaint
    c_res = client.post(
        "/complaints",
        data={"category": "Security", "description": "Suspicious activity near boundary wall"},
        headers=headers1
    )
    complaint_id = c_res.json()["id"]

    # Alice can see her own complaint
    alice_get = client.get(f"/complaints/{complaint_id}", headers=headers1)
    assert alice_get.status_code == 200
    assert alice_get.json()["id"] == complaint_id

    # Bob tries to access Alice's complaint -> 404 Not Found
    bob_get = client.get(f"/complaints/{complaint_id}", headers=headers2)
    assert bob_get.status_code == 404
    assert bob_get.json()["detail"] == "Complaint not found"


def test_admin_can_access_any_complaint(client):
    res_token = get_auth_token(client, "resident_c@example.com", "pass123", name="Resident C", role="resident")
    adm_token = get_auth_token(client, "admin_user@example.com", "pass123", name="Admin User", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # Resident creates complaint
    c_res = client.post(
        "/complaints",
        data={"category": "Other", "description": "Lift maintenance overdue by two weeks"},
        headers=res_headers
    )
    complaint_id = c_res.json()["id"]

    # Admin accesses the complaint -> 200 OK
    adm_get = client.get(f"/complaints/{complaint_id}", headers=adm_headers)
    assert adm_get.status_code == 200
    assert adm_get.json()["id"] == complaint_id
    assert adm_get.json()["resident_name"] == "Resident C"


def test_admin_cannot_create_resident_complaint(client):
    adm_token = get_auth_token(client, "admin2@example.com", "pass123", role="admin")
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    response = client.post(
        "/complaints",
        data={"category": "Plumbing", "description": "Pipe leaking in society club house"},
        headers=adm_headers
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Resident access required"


def test_complaint_status_lifecycle_and_history_sequence(client):
    res_token = get_auth_token(client, "res_lifecycle@example.com", "pass123", name="Charlie Resident", role="resident")
    adm_token = get_auth_token(client, "adm_lifecycle@example.com", "pass123", name="David Admin", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # 1. Resident creates complaint (Initial: Open)
    create_res = client.post(
        "/complaints",
        data={"category": "Plumbing", "description": "Kitchen tap leaking continuously"},
        headers=res_headers
    )
    assert create_res.status_code == 201
    complaint_id = create_res.json()["id"]
    assert create_res.json()["status"] == "Open"
    assert len(create_res.json()["history"]) == 1
    assert create_res.json()["history"][0]["new_status"] == "Open"
    assert create_res.json()["history"][0]["old_status"] is None
    assert create_res.json()["history"][0]["note"] == "Complaint raised"

    # 2. Admin transitions Open -> In Progress
    patch1_res = client.patch(
        f"/complaints/{complaint_id}/status",
        json={"new_status": "In Progress", "note": "Assigned technician Dave"},
        headers=adm_headers
    )
    assert patch1_res.status_code == 200
    p1_data = patch1_res.json()
    assert p1_data["status"] == "In Progress"
    assert p1_data["resolved_at"] is None
    assert len(p1_data["history"]) == 2
    assert p1_data["history"][1]["old_status"] == "Open"
    assert p1_data["history"][1]["new_status"] == "In Progress"
    assert p1_data["history"][1]["note"] == "Assigned technician Dave"
    assert p1_data["history"][1]["changed_by_name"] == "David Admin"

    # 3. Admin transitions In Progress -> Resolved
    patch2_res = client.patch(
        f"/complaints/{complaint_id}/status",
        json={"new_status": "Resolved", "note": "Technician replaced the rubber washer"},
        headers=adm_headers
    )
    assert patch2_res.status_code == 200
    p2_data = patch2_res.json()
    assert p2_data["status"] == "Resolved"
    assert p2_data["resolved_at"] is not None
    assert len(p2_data["history"]) == 3
    assert p2_data["history"][2]["old_status"] == "In Progress"
    assert p2_data["history"][2]["new_status"] == "Resolved"
    assert p2_data["history"][2]["note"] == "Technician replaced the rubber washer"
    assert p2_data["history"][2]["changed_by_name"] == "David Admin"

    # 4. Attempting to change status after Resolved -> 400 Bad Request ("Complaint is closed")
    patch3_res = client.patch(
        f"/complaints/{complaint_id}/status",
        json={"new_status": "In Progress", "note": "Re-opening"},
        headers=adm_headers
    )
    assert patch3_res.status_code == 400
    assert "Complaint is closed" in patch3_res.json()["detail"]

    # 5. GET /complaints/{id} returns full ordered history (3 entries)
    get_res = client.get(f"/complaints/{complaint_id}", headers=res_headers)
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert len(get_data["history"]) == 3
    assert get_data["history"][0]["new_status"] == "Open"
    assert get_data["history"][1]["new_status"] == "In Progress"
    assert get_data["history"][2]["new_status"] == "Resolved"


def test_invalid_status_transitions(client):
    res_token = get_auth_token(client, "res_trans@example.com", "pass123", role="resident")
    adm_token = get_auth_token(client, "adm_trans@example.com", "pass123", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    create_res = client.post(
        "/complaints",
        data={"category": "Electrical", "description": "Main corridor circuit breaker tripping"},
        headers=res_headers
    )
    complaint_id = create_res.json()["id"]

    # Skipping Open -> Resolved directly should fail
    bad_patch = client.patch(
        f"/complaints/{complaint_id}/status",
        json={"new_status": "Resolved"},
        headers=adm_headers
    )
    assert bad_patch.status_code == 400
    assert "Invalid status transition" in bad_patch.json()["detail"]

    # Move to In Progress
    client.patch(
        f"/complaints/{complaint_id}/status",
        json={"new_status": "In Progress"},
        headers=adm_headers
    )

    # Moving backward In Progress -> Open should fail
    bad_backward = client.patch(
        f"/complaints/{complaint_id}/status",
        json={"new_status": "Open"},
        headers=adm_headers
    )
    assert bad_backward.status_code == 400
    assert "Invalid status transition" in bad_backward.json()["detail"]


def test_invalid_status_value_rejected_with_422(client):
    adm_token = get_auth_token(client, "adm_422@example.com", "pass123", role="admin")
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    res = client.patch(
        "/complaints/1/status",
        json={"new_status": "InvalidStatusName"},
        headers=adm_headers
    )
    assert res.status_code == 422


def test_resident_cannot_update_complaint_status(client):
    res_token = get_auth_token(client, "res_forbidden@example.com", "pass123", role="resident")
    res_headers = {"Authorization": f"Bearer {res_token}"}

    create_res = client.post(
        "/complaints",
        data={"category": "Parking", "description": "Car parked in visitor slot over 24h"},
        headers=res_headers
    )
    complaint_id = create_res.json()["id"]

    # Resident tries to PATCH status
    patch_res = client.patch(
        f"/complaints/{complaint_id}/status",
        json={"new_status": "In Progress"},
        headers=res_headers
    )
    assert patch_res.status_code == 403
    assert patch_res.json()["detail"] == "Admin access required"
