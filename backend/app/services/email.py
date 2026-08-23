import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from app.core.config import settings
from app.core.db import SessionLocal
from app.models.email_log import EmailLog

logger = logging.getLogger(__name__)


def log_email_attempt(
    to_email: str,
    subject: str,
    status: str,
    related_complaint_id: Optional[int] = None,
    related_notice_id: Optional[int] = None,
    error_message: Optional[str] = None,
) -> None:
    """Helper to persist email sending attempts to the database."""
    try:
        db = SessionLocal()
        try:
            log_entry = EmailLog(
                to_email=to_email,
                subject=subject,
                related_complaint_id=related_complaint_id,
                related_notice_id=related_notice_id,
                status=status,
                error_message=error_message,
            )
            db.add(log_entry)
            db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Failed to log email attempt to DB: {e}")


def send_email(
    to: str,
    subject: str,
    body: str,
    related_complaint_id: Optional[int] = None,
    related_notice_id: Optional[int] = None,
) -> bool:
    """
    Send an email via SMTP.
    Supports standard SMTP and Gmail App Password TLS authentication.
    Logs any errors and persists an EmailLog entry without raising exceptions.
    """
    if not to:
        logger.warning("send_email called without a recipient email address.")
        return False

    host = getattr(settings, "SMTP_HOST", "smtp.example.com")
    port = getattr(settings, "SMTP_PORT", 587)
    user = getattr(settings, "SMTP_USER", "")
    password = getattr(settings, "SMTP_PASSWORD", "")

    msg = MIMEMultipart()
    msg["From"] = user or "noreply@societytracker.com"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(host, port, timeout=15) as server:
            # Upgrade insecure connection to TLS if supported/configured
            if port == 587:
                try:
                    server.starttls()
                except Exception as tls_err:
                    logger.debug(f"STARTTLS not supported or failed: {tls_err}")

            if user and password:
                server.login(user, password)

            server.send_message(msg)

        logger.info(f"Email successfully sent to {to} [Subject: '{subject}']")
        log_email_attempt(
            to_email=to,
            subject=subject,
            status="sent",
            related_complaint_id=related_complaint_id,
            related_notice_id=related_notice_id,
        )
        return True
    except Exception as exc:
        error_msg = str(exc)
        logger.error(f"Failed to send email to {to} [Subject: '{subject}']: {error_msg}")
        log_email_attempt(
            to_email=to,
            subject=subject,
            status="failed",
            related_complaint_id=related_complaint_id,
            related_notice_id=related_notice_id,
            error_message=error_msg,
        )
        return False


def send_complaint_status_email(
    resident_email: str,
    resident_name: str,
    complaint_id: int,
    category: str,
    old_status: Optional[str],
    new_status: str,
    note: Optional[str] = None,
) -> bool:
    """Send notification email to the resident when their complaint status changes."""
    subject = f"Your complaint #{complaint_id} status changed to {new_status}"
    body = (
        f"Hello {resident_name},\n\n"
        f"The status of your complaint has been updated:\n\n"
        f"Complaint ID: #{complaint_id}\n"
        f"Category: {category}\n"
        f"Previous Status: {old_status or 'N/A'}\n"
        f"New Status: {new_status}\n"
        f"Admin Note: {note or 'None'}\n\n"
        f"Thank you,\n"
        f"Society Management"
    )
    return send_email(
        to=resident_email,
        subject=subject,
        body=body,
        related_complaint_id=complaint_id,
    )


def send_important_notice_emails(
    resident_emails: List[str],
    notice_id: int,
    notice_title: str,
    notice_body: str,
) -> None:
    """Send notification email to all residents when an important notice is posted."""
    subject = f"Important Notice: {notice_title}"
    body = (
        f"Dear Resident,\n\n"
        f"An important notice has been posted on the society board:\n\n"
        f"--- {notice_title} ---\n\n"
        f"{notice_body}\n\n"
        f"Regards,\n"
        f"Society Management"
    )
    for email in resident_emails:
        if email:
            send_email(
                to=email,
                subject=subject,
                body=body,
                related_notice_id=notice_id,
            )
