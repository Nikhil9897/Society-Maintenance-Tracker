import os
import uuid
import logging
from typing import Optional
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def is_valid_image(file: UploadFile, filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        return False
    return True


def is_cloudinary_configured() -> bool:
    if not settings.CLOUDINARY_URL:
        return False
    # Check if it's the placeholder default
    if "key:secret@cloudname" in settings.CLOUDINARY_URL:
        return False
    return True


async def upload_image(file: UploadFile) -> str:
    """
    Validates and uploads an image to Cloudinary or local storage based on configuration.
    Returns the accessible URL/path of the uploaded image.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided.",
        )

    if not is_valid_image(file, file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only JPG, PNG, and WebP are allowed.",
        )

    # Read and validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit.",
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if not ext and file.content_type:
        mime_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
        ext = mime_map.get(file.content_type.lower(), ".jpg")

    backend = (settings.STORAGE_BACKEND or "local").lower()

    # Attempt Cloudinary upload if configured and requested
    if backend == "cloudinary" and is_cloudinary_configured():
        try:
            import cloudinary
            import cloudinary.uploader

            cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)
            response = cloudinary.uploader.upload(
                contents,
                folder="society_complaints",
                resource_type="image",
            )
            return response.get("secure_url") or response.get("url")
        except Exception as e:
            logger.warning(f"Cloudinary upload failed ({e}), falling back to local storage.")

    # Fallback / Default: Local storage
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    return f"/uploads/{unique_filename}"
