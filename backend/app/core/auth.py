"""JWT authentication utilities."""

import bcrypt
from datetime import datetime, timedelta
import secrets
from typing import Optional

from jose import jwt, JWTError

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=settings.jwt_refresh_token_expire_days))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_math_captcha() -> dict[str, str]:
    """Create a short-lived, stateless arithmetic challenge."""
    left = secrets.randbelow(9) + 1
    right = secrets.randbelow(9) + 1
    expire = datetime.utcnow() + timedelta(minutes=5)
    token = jwt.encode(
        {"answer": left + right, "exp": expire, "type": "captcha"},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return {"question": f"{left} + {right} = ?", "token": token}


def verify_math_captcha(token: str, answer: int) -> bool:
    payload = decode_token(token)
    return bool(payload and payload.get("type") == "captcha" and payload.get("answer") == answer)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None


def get_token_type(token: str) -> Optional[str]:
    """Get token type (access/refresh) without full validation."""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm], options={"verify_exp": False})
        return payload.get("type")
    except JWTError:
        return None
