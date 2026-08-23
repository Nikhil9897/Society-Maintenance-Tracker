from unittest.mock import MagicMock, patch
import pytest

from tests.test_complaints import get_auth_token


def test_email_sent_on_complaint_status_change(client):
    res_token = get_auth_token(client, "resident_email_test@example.com", "pass123", name="Resident Tester", role="resident")
    adm_token = get_auth_token(client, "admin_email_test@example.com", "pass123", name="Admin Tester", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # Resident creates a complaint
    c_res = client.post(
        "/complaints",
        data={"category": "Plumbing", "description": "Water pressure is too low in master bath"},
        headers=res_headers
    )
    complaint_id = c_res.json()["id"]

    with patch("app.services.email.send_email") as mock_send_email:
        mock_send_email.return_value = True

        # Admin updates status to In Progress
        patch_res = client.patch(
            f"/complaints/{complaint_id}/status",
            json={"new_status": "In Progress", "note": "Technician dispatched"},
            headers=adm_headers
        )
        assert patch_res.status_code == 200

        # Verify send_email was called
        assert mock_send_email.called
        call_kwargs = mock_send_email.call_args.kwargs
        assert call_kwargs["to"] == "resident_email_test@example.com"
        assert f"Your complaint #{complaint_id} status changed to In Progress" in call_kwargs["subject"]
        assert "Plumbing" in call_kwargs["body"]
        assert "Technician dispatched" in call_kwargs["body"]
        assert call_kwargs["related_complaint_id"] == complaint_id


def test_email_sent_for_all_residents_on_important_notice(client):
    res1_token = get_auth_token(client, "resident1_notif@example.com", "pass123", role="resident")
    res2_token = get_auth_token(client, "resident2_notif@example.com", "pass123", role="resident")
    adm_token = get_auth_token(client, "admin_notif@example.com", "pass123", role="admin")

    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    with patch("app.services.email.send_email") as mock_send_email:
        mock_send_email.return_value = True

        # Admin posts IMPORTANT notice
        post_res = client.post(
            "/notices",
            json={
                "title": "Emergency Power Cut",
                "body": "Power outage scheduled from 2 PM to 4 PM.",
                "is_important": True,
            },
            headers=adm_headers
        )
        assert post_res.status_code == 201

        # Check that emails were sent to both residents
        assert mock_send_email.call_count >= 2
        recipients = [call.kwargs["to"] for call in mock_send_email.call_args_list]
        assert "resident1_notif@example.com" in recipients
        assert "resident2_notif@example.com" in recipients
        for call in mock_send_email.call_args_list:
            assert "Important Notice: Emergency Power Cut" in call.kwargs["subject"]
            assert "Power outage scheduled" in call.kwargs["body"]


def test_email_not_sent_on_regular_notice(client):
    adm_token = get_auth_token(client, "admin_regular@example.com", "pass123", role="admin")
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    with patch("app.services.email.send_email") as mock_send_email:
        # Admin posts REGULAR notice (is_important=False)
        post_res = client.post(
            "/notices",
            json={
                "title": "Yoga Class Timing Change",
                "body": "Morning yoga will start at 6:30 AM from Monday.",
                "is_important": False,
            },
            headers=adm_headers
        )
        assert post_res.status_code == 201

        # Confirm send_email was NOT called
        mock_send_email.assert_not_called()


def test_email_failure_does_not_crash_request(client):
    res_token = get_auth_token(client, "res_fail_test@example.com", "pass123", role="resident")
    adm_token = get_auth_token(client, "adm_fail_test@example.com", "pass123", role="admin")

    res_headers = {"Authorization": f"Bearer {res_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    c_res = client.post(
        "/complaints",
        data={"category": "Electrical", "description": "Corridor light bulb blown"},
        headers=res_headers
    )
    complaint_id = c_res.json()["id"]

    # Mock smtplib.SMTP to raise an exception simulating connection/auth error
    with patch("smtplib.SMTP", side_effect=Exception("SMTP server connection timeout")):
        patch_res = client.patch(
            f"/complaints/{complaint_id}/status",
            json={"new_status": "In Progress"},
            headers=adm_headers
        )
        # Endpoint must still succeed cleanly with 200 OK
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "In Progress"
