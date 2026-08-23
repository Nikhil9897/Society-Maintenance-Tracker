import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import admin, auth, complaints, health, notices

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Ensure upload directory exists and mount static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Configure allowed origins (supports comma-separated list or fallback to localhost dev servers)
if settings.FRONTEND_URL:
    origins = [url.strip() for url in settings.FRONTEND_URL.split(",") if url.strip()]
else:
    origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

