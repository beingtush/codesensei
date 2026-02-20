"""Authentication routes — register and login with simple JWT."""

import hashlib
import hmac
import json
import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _hash_password(password: str) -> str:
    """Hash a password with a simple salt derived from the API key."""
    salt = settings.api_key[:8].encode()
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000).hex()


def _create_token(user_id: int, username: str) -> str:
    """Create a simple JWT-like token (base64-encoded JSON + HMAC signature)."""
    import base64

    payload = json.dumps({
        "user_id": user_id,
        "username": username,
        "iat": int(time.time()),
    })
    payload_b64 = base64.urlsafe_b64encode(payload.encode()).decode()
    signature = hmac.new(
        settings.api_key.encode(), payload_b64.encode(), hashlib.sha256
    ).hexdigest()
    return f"{payload_b64}.{signature}"


def verify_token(token: str) -> dict:
    """Verify a token and return the payload."""
    import base64

    try:
        payload_b64, signature = token.rsplit(".", 1)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token format")

    expected_sig = hmac.new(
        settings.api_key.encode(), payload_b64.encode(), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(status_code=401, detail="Invalid token signature")

    payload = json.loads(base64.urlsafe_b64decode(payload_b64))
    return payload


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/register")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if username or email already exists
    existing = await db.execute(
        select(User).where(
            (User.username == request.username) | (User.email == request.email)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username or email already taken")

    user = User(
        username=request.username,
        email=request.email,
        hashed_password=_hash_password(request.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = _create_token(user.id, user.username)
    return {
        "user_id": user.id,
        "username": user.username,
        "token": token,
    }


@router.post("/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login and receive a token."""
    result = await db.execute(
        select(User).where(User.username == request.username)
    )
    user = result.scalar_one_or_none()

    if user is None or user.hashed_password != _hash_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = _create_token(user.id, user.username)
    return {
        "user_id": user.id,
        "username": user.username,
        "token": token,
    }
