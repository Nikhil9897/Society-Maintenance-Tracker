import logging
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.setting import AppSetting

logger = logging.getLogger(__name__)

OVERDUE_SETTING_KEY = "overdue_threshold_days"
DEFAULT_OVERDUE_DAYS = 7


def get_overdue_threshold_days(db: Session) -> int:
    """
    Retrieve the overdue threshold in days from the database.
    Falls back to settings.OVERDUE_THRESHOLD_DAYS or default if not configured.
    """
    setting = db.query(AppSetting).filter(AppSetting.key == OVERDUE_SETTING_KEY).first()
    if setting and setting.value:
        try:
            return int(setting.value)
        except ValueError:
            logger.warning(f"Invalid overdue threshold value in DB: '{setting.value}', falling back to default.")

    return getattr(settings, "OVERDUE_THRESHOLD_DAYS", DEFAULT_OVERDUE_DAYS)


def update_overdue_threshold_days(db: Session, days: int) -> int:
    """
    Update or create the overdue threshold in days in the database.
    """
    setting = db.query(AppSetting).filter(AppSetting.key == OVERDUE_SETTING_KEY).first()
    if setting:
        setting.value = str(days)
    else:
        setting = AppSetting(
            key=OVERDUE_SETTING_KEY,
            value=str(days),
            description="Threshold in days after which an open complaint is considered overdue",
        )
        db.add(setting)

    db.commit()
    db.refresh(setting)
    return int(setting.value)
