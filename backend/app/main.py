import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import admin, auth, complaints, health, notices

from app.models.base import Base
from app.models.user import User, UserRole
from app.models.complaint import Complaint
from app.models.complaint_history import ComplaintStatusHistory
from app.models.notice import Notice
from app.models.setting import AppSetting
from app.models.email_log import EmailLog
from app.core.db import engine, SessionLocal
from app.core.security import get_password_hash

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Automatically initialize tables and default admin on startup
@app.on_event("startup")
def startup_db_init():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin_user:
            default_admin = User(
                name="Society Secretary (Admin)",
                email="admin@society.com",
                hashed_password=get_password_hash("adminpassword123"),
                role=UserRole.ADMIN,
                flat_no="OFFICE-01",
            )
            db.add(default_admin)
            db.commit()
    finally:
        db.close()

# Ensure upload directory exists and mount static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Configure allowed origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://frontend-seven-alpha-48.vercel.app",
]
if settings.FRONTEND_URL:
    for u in settings.FRONTEND_URL.split(","):
        cleaned = u.strip()
        if cleaned and cleaned not in origins:
            origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(admin.router)
app.include_router(notices.router)




@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}


