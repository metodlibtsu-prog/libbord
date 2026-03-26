from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest) -> TokenResponse:
    if body.email != settings.admin_email:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(body.password.encode(), settings.admin_password_hash.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    expire = datetime.now(timezone.utc) + timedelta(hours=_TOKEN_EXPIRE_HOURS)
    token = jwt.encode(
        {"email": body.email, "exp": expire},
        settings.jwt_secret,
        algorithm="HS256",
    )
    return TokenResponse(access_token=token)
