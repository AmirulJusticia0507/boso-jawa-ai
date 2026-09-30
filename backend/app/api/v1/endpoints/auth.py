"""Endpoint autentikasi admin (login, register, token refresh, user management)."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.core.database import get_db
from app.core.observability import capture_exception
from app.models.admin_user import AdminRole, AdminUser
from app.schemas.auth import (
    AdminRole as SchemaAdminRole,
    AdminSessionResponse,
    AdminUserCreate,
    AdminUserItem,
    AdminUserListResponse,
    AdminUserUpdate,
    LoginRequest,
    RefreshTokenRequest,
    Token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# --- Auth dependencies ---

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> AdminUser:
    """Get current authenticated user from JWT access token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required.")

    token = auth_header.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired access token.")

    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    user = db.scalar(select(AdminUser).where(AdminUser.username == username))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive.")

    return user


def require_role(*allowed_roles: AdminRole):
    """Dependency to require specific role(s)."""
    async def dependency(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions.")
        return current_user
    return dependency


# --- Auth endpoints ---

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    """Login dengan username/password, return access & refresh token."""
    user = db.scalar(select(AdminUser).where(AdminUser.username == payload.username))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Username atau password salah.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Akun tidak aktif.")

    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token = create_access_token({"sub": user.username, "role": user.role.value})
    refresh_token = create_refresh_token({"sub": user.username, "role": user.role.value})

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)) -> Token:
    """Refresh access token menggunakan refresh token."""
    payload_decoded = decode_token(payload.refresh_token)
    if not payload_decoded or payload_decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

    username = payload_decoded.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    user = db.scalar(select(AdminUser).where(AdminUser.username == username))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive.")

    access_token = create_access_token({"sub": user.username, "role": user.role.value})
    new_refresh_token = create_refresh_token({"sub": user.username, "role": user.role.value})

    return Token(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout", status_code=204)
def logout(response: Response) -> Response:
    """Logout - client should delete tokens. Server-side blacklist bisa ditambah nanti."""
    return Response(status_code=204)


@router.get("/me", response_model=AdminUserItem)
def get_me(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
    """Get current user profile."""
    return current_user


# --- Admin user management (admin only) ---

@router.post("/users", response_model=AdminUserItem, status_code=201, dependencies=[Depends(require_role(AdminRole.ADMIN))])
def create_user(payload: AdminUserCreate, db: Session = Depends(get_db)) -> AdminUser:
    """Buat user admin baru (hanya admin)."""
    if db.scalar(select(AdminUser).where(AdminUser.username == payload.username)):
        raise HTTPException(status_code=409, detail="Username sudah digunakan.")

    user = AdminUser(
        username=payload.username,
        password_hash=get_password_hash(payload.password),
        role=AdminRole(payload.role),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=AdminUserListResponse, dependencies=[Depends(require_role(AdminRole.ADMIN))])
def list_users(
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 20,
    role: Optional[SchemaAdminRole] = None,
    is_active: Optional[bool] = None,
) -> dict:
    """Daftar user admin (hanya admin)."""
    stmt = select(AdminUser)
    if role:
        stmt = stmt.where(AdminUser.role == AdminRole(role))
    if is_active is not None:
        stmt = stmt.where(AdminUser.is_active == is_active)

    stmt = stmt.order_by(AdminUser.id)
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = db.scalars(stmt.offset((page - 1) * limit).limit(limit)).all()

    return {
        "status": "success",
        "total": total,
        "page": page,
        "limit": limit,
        "has_next": page * limit < total,
        "data": [AdminUserItem.model_validate(row).model_dump() for row in rows],
    }


@router.get("/users/{user_id}", response_model=AdminUserItem, dependencies=[Depends(require_role(AdminRole.ADMIN))])
def get_user(user_id: int, db: Session = Depends(get_db)) -> AdminUser:
    """Detail user admin (hanya admin)."""
    user = db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")
    return user


@router.put("/users/{user_id}", response_model=AdminUserItem, dependencies=[Depends(require_role(AdminRole.ADMIN))])
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
) -> AdminUser:
    """Update user admin (hanya admin)."""
    user = db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    update_data = payload.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    if "role" in update_data:
        update_data["role"] = AdminRole(update_data["role"])

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204, dependencies=[Depends(require_role(AdminRole.ADMIN))])
def delete_user(user_id: int, db: Session = Depends(get_db)) -> Response:
    """Hapus user admin (hanya admin)."""
    user = db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")
    db.delete(user)
    db.commit()
    return Response(status_code=204)


@router.get("/session", response_model=AdminSessionResponse)
def session_info(current_user: AdminUser = Depends(get_current_user)) -> dict:
    """Info session user yang sedang login."""
    return {
        "status": "success",
        "data": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role.value,
            "is_active": current_user.is_active,
        },
    }