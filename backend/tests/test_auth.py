import pytest


def test_register_user_success(client):
    payload = {
        "name": "John Resident",
        "email": "john@example.com",
        "password": "password123",
        "flat_no": "A-101",
        "role": "resident"
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "john@example.com"
    assert data["name"] == "John Resident"
    assert data["role"] == "resident"
    assert data["flat_no"] == "A-101"
    assert "id" in data
    assert "password" not in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    payload = {
        "name": "User One",
        "email": "duplicate@example.com",
        "password": "password123",
        "flat_no": "B-202",
        "role": "resident"
    }
    response1 = client.post("/auth/register", json=payload)
    assert response1.status_code == 201

    # Second registration with same email
    response2 = client.post("/auth/register", json=payload)
    assert response2.status_code == 400
    assert response2.json()["detail"] == "Email is already registered"


def test_login_success_and_failure(client):
    # Register user first
    reg_payload = {
        "name": "Alice Admin",
        "email": "alice@example.com",
        "password": "securepassword",
        "role": "admin"
    }
    client.post("/auth/register", json=reg_payload)

    # 1. Login Failure - Wrong Password
    bad_login = client.post("/auth/login", json={"email": "alice@example.com", "password": "wrongpassword"})
    assert bad_login.status_code == 401

    # 2. Login Success
    good_login = client.post("/auth/login", json={"email": "alice@example.com", "password": "securepassword"})
    assert good_login.status_code == 200
    token_data = good_login.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"


def test_get_me_endpoint(client):
    # Register and login
    reg_payload = {
        "name": "Bob Resident",
        "email": "bob@example.com",
        "password": "bobpassword",
        "flat_no": "C-303",
        "role": "resident"
    }
    client.post("/auth/register", json=reg_payload)
    login_res = client.post("/auth/login", json={"email": "bob@example.com", "password": "bobpassword"})
    token = login_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "bob@example.com"
    assert me_data["name"] == "Bob Resident"
    assert me_data["flat_no"] == "C-303"


def test_role_based_access_control(client):
    # Register 1 resident and 1 admin
    client.post("/auth/register", json={
        "name": "Resident User",
        "email": "res@example.com",
        "password": "pass",
        "role": "resident"
    })
    client.post("/auth/register", json={
        "name": "Admin User",
        "email": "adm@example.com",
        "password": "pass",
        "role": "admin"
    })

    # Get tokens
    res_token = client.post("/auth/login", json={"email": "res@example.com", "password": "pass"}).json()["access_token"]
    adm_token = client.post("/auth/login", json={"email": "adm@example.com", "password": "pass"}).json()["access_token"]

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # 1. Resident accessing resident-only endpoint -> 200 OK
    res_access_res = client.get("/auth/test-resident", headers=res_headers)
    assert res_access_res.status_code == 200

    # 2. Resident accessing admin-only endpoint -> 403 Forbidden
    res_access_adm = client.get("/auth/test-admin", headers=res_headers)
    assert res_access_adm.status_code == 403
    assert res_access_adm.json()["detail"] == "Admin access required"

    # 3. Admin accessing admin-only endpoint -> 200 OK
    adm_access_adm = client.get("/auth/test-admin", headers=adm_headers)
    assert adm_access_adm.status_code == 200

    # 4. Admin accessing resident-only endpoint -> 403 Forbidden
    adm_access_res = client.get("/auth/test-resident", headers=adm_headers)
    assert adm_access_res.status_code == 403
    assert adm_access_res.json()["detail"] == "Resident access required"
