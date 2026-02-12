import logging

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db  # noqa: F401 — re-export for convenience

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> dict:
    if credentials is None:
        logger.warning("No credentials provided")
        raise HTTPException(status_code=401, detail="Not authenticated")

    logger.debug(f"Token received: {credentials.credentials[:50]}...")

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256", "ES256"],
            audience="authenticated",
            options={"verify_signature": False}
        )
        logger.debug(f"Token decoded successfully: {payload.get('email')}")
        return payload
    except JWTError as e:
        logger.warning(f"JWT Error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {type(e).__name__}: {str(e)}")
