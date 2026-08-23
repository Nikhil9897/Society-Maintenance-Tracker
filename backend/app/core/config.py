from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Society Maintenance Tracker"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/society_db"
    JWT_SECRET: str = "your_jwt_secret_key_here"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    SMTP_HOST: str = "smtp.example.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "user@example.com"
    SMTP_PASSWORD: str = "your_smtp_password"
    CLOUDINARY_URL: Optional[str] = "cloudinary://key:secret@cloudname"
    STORAGE_BACKEND: str = "local"
    UPLOAD_DIR: str = "uploads"
    OVERDUE_THRESHOLD_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
