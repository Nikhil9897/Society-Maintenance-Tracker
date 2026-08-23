from datetime import datetime, timedelta, timezone
import pytest
from app.models.notice import Notice
from tests.test_complaints import get_auth_token


def test_admin_can_create_notice(client):
    adm_token = get_auth_token(client, "admin_notice@example.com", "pass123", name="Super Admin", role="admin")
    headers = {"Authorization": f"Bearer {adm_token}"}

    payload = {
        "title": "Water Tank Cleaning Notice",
        "body": "Water supply will be suspended tomorrow from 10 AM to 2 PM for bi-annual tank cleaning.",
        "is_important": True,
    }

    response = client.post("/notices", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Water Tank Cleaning Notice"
    assert data["body"] == payload["body"]
    assert data["is_important"] is True
    assert data["posted_by_name"] == "Super Admin"
    assert "id" in data
    assert "created_at" in data


def test_resident_cannot_create_notice(client):
    res_token = get_auth_token(client, "resident_notice@example.com", "pass123", role="resident")
    headers = {"Authorization": f"Bearer {res_token}"}

    payload = {
        "title": "Party at clubhouse",
        "body": "Hosting a birthday party tonight.",
        "is_important": False,
    }

    response = client.post("/notices", json=payload, headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin access required"


def test_notices_pinning_order(client, db_session):
    adm_token = get_auth_token(client, "admin_notices_order@example.com", "pass123", name="Admin User", role="admin")
    res_token = get_auth_token(client, "resident_notices_reader@example.com", "pass123", role="resident")

    adm_headers = {"Authorization": f"Bearer {adm_token}"}
    res_headers = {"Authorization": f"Bearer {res_token}"}

    now = datetime.now(timezone.utc)

    # 1. Create a Normal notice created 1 hour ago (Recent Normal)
    n1 = client.post(
        "/notices",
        json={"title": "Recent Normal Notice", "body": "Elevator maintenance complete.", "is_important": False},
        headers=adm_headers,
    ).json()

    # 2. Create an Important notice created 5 days ago (Older Important)
    n2 = client.post(
        "/notices",
        json={"title": "Older Important Notice", "body": "Annual General Meeting this weekend.", "is_important": True},
        headers=adm_headers,
    ).json()

    # 3. Create a Normal notice created 3 days ago (Older Normal)
    n3 = client.post(
        "/notices",
        json={"title": "Older Normal Notice", "body": "Gardener will visit on Thursday.", "is_important": False},
        headers=adm_headers,
    ).json()

    # 4. Create an Important notice created 2 hours ago (Newer Important)
    n4 = client.post(
        "/notices",
        json={"title": "Newer Important Notice", "body": "Emergency Fire Drill tomorrow.", "is_important": True},
        headers=adm_headers,
    ).json()

    # Adjust timestamps in DB
    db_n1 = db_session.query(Notice).filter(Notice.id == n1["id"]).first()
    db_n1.created_at = now - timedelta(hours=1)

    db_n2 = db_session.query(Notice).filter(Notice.id == n2["id"]).first()
    db_n2.created_at = now - timedelta(days=5)

    db_n3 = db_session.query(Notice).filter(Notice.id == n3["id"]).first()
    db_n3.created_at = now - timedelta(days=3)

    db_n4 = db_session.query(Notice).filter(Notice.id == n4["id"]).first()
    db_n4.created_at = now - timedelta(hours=2)

    db_session.commit()

    # Resident fetches GET /notices
    response = client.get("/notices", headers=res_headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 4

    # Expected order:
    # Group 1 (is_important=True):
    #   1st: n4 (Newer Important, 2 hours ago)
    #   2nd: n2 (Older Important, 5 days ago)
    # Group 2 (is_important=False):
    #   3rd: n1 (Recent Normal, 1 hour ago)
    #   4th: n3 (Older Normal, 3 days ago)
    assert items[0]["id"] == n4["id"]
    assert items[0]["is_important"] is True
    assert items[0]["title"] == "Newer Important Notice"

    assert items[1]["id"] == n2["id"]
    assert items[1]["is_important"] is True
    assert items[1]["title"] == "Older Important Notice"

    assert items[2]["id"] == n1["id"]
    assert items[2]["is_important"] is False
    assert items[2]["title"] == "Recent Normal Notice"

    assert items[3]["id"] == n3["id"]
    assert items[3]["is_important"] is False
    assert items[3]["title"] == "Older Normal Notice"


def test_unauthenticated_access_to_notices(client):
    # 1. Unauthenticated GET /notices
    res_get = client.get("/notices")
    assert res_get.status_code == 401

    # 2. Unauthenticated POST /notices
    res_post = client.post("/notices", json={"title": "Test", "body": "Body"})
    assert res_post.status_code == 401
