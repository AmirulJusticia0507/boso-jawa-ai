"""Akun publik, sinkronisasi, bookmark, dan feedback."""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import create_access_token, create_math_captcha, create_refresh_token, decode_token, get_password_hash, verify_math_captcha, verify_password
from app.core.database import get_db
from app.models.user import UserAccount, UserBookmark, UserFeedback, UserHistory
from app.schemas.auth import Token
from app.schemas.user import BookmarkCreate, BookmarkItem, FeedbackCreate, HistorySyncRequest, UserCredentials

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/captcha")
def captcha() -> dict[str, str]:
    return create_math_captcha()


def require_captcha(payload: UserCredentials) -> None:
    if not verify_math_captcha(payload.captcha_token, payload.captcha_answer):
        raise HTTPException(status_code=400, detail="Jawaban CAPTCHA salah utawa kadaluwarsa.")


def current_user(request: Request, db: Session = Depends(get_db)) -> UserAccount:
    header = request.headers.get("Authorization", "")
    payload = decode_token(header.removeprefix("Bearer ")) if header.startswith("Bearer ") else None
    if not payload or payload.get("type") != "access" or payload.get("kind") != "user":
        raise HTTPException(status_code=401, detail="Login pengguna diperlukan.")
    user = db.get(UserAccount, int(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=401, detail="Akun tidak ditemukan.")
    return user


def tokens(user: UserAccount) -> Token:
    data = {"sub": str(user.id), "kind": "user", "username": user.username}
    return Token(access_token=create_access_token(data), refresh_token=create_refresh_token(data))


@router.post("/register", response_model=Token, status_code=201)
def register(payload: UserCredentials, db: Session = Depends(get_db)) -> Token:
    require_captcha(payload)
    if db.scalar(select(UserAccount).where(UserAccount.username == payload.username)):
        raise HTTPException(status_code=409, detail="Username sudah digunakan.")
    user = UserAccount(username=payload.username, password_hash=get_password_hash(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return tokens(user)


@router.post("/login", response_model=Token)
def login(payload: UserCredentials, db: Session = Depends(get_db)) -> Token:
    require_captcha(payload)
    user = db.scalar(select(UserAccount).where(UserAccount.username == payload.username))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Username utawa password salah.")
    return tokens(user)


@router.post("/refresh", response_model=Token)
def refresh(payload: dict, db: Session = Depends(get_db)) -> Token:
    decoded = decode_token(str(payload.get("refresh_token", "")))
    if not decoded or decoded.get("type") != "refresh" or decoded.get("kind") != "user":
        raise HTTPException(status_code=401, detail="Refresh token tidak valid.")
    user = db.get(UserAccount, int(decoded["sub"]))
    if user is None:
        raise HTTPException(status_code=401, detail="Akun tidak ditemukan.")
    return tokens(user)


@router.get("/me")
def me(user: UserAccount = Depends(current_user)) -> dict:
    return {"status": "success", "data": {"id": user.id, "username": user.username}}


@router.post("/history/sync")
def sync_history(payload: HistorySyncRequest, user: UserAccount = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    existing = {row.client_id for row in db.scalars(select(UserHistory).where(UserHistory.user_id == user.id)).all()}
    for item in payload.items:
        if item.client_id not in existing:
            db.add(UserHistory(user_id=user.id, **item.model_dump()))
    db.commit()
    rows = db.scalars(select(UserHistory).where(UserHistory.user_id == user.id).order_by(UserHistory.timestamp.desc()).limit(100)).all()
    return {"status": "success", "data": [{"id": row.client_id, "type": row.type, "input": row.input, "output": row.output, "timestamp": row.timestamp} for row in rows]}


@router.delete("/history/{client_id}", status_code=204)
def delete_history(client_id: str, user: UserAccount = Depends(current_user), db: Session = Depends(get_db)) -> Response:
    item = db.scalar(select(UserHistory).where(UserHistory.user_id == user.id, UserHistory.client_id == client_id))
    if item:
        db.delete(item)
        db.commit()
    return Response(status_code=204)


@router.delete("/history", status_code=204)
def clear_history(user: UserAccount = Depends(current_user), db: Session = Depends(get_db)) -> Response:
    for item in db.scalars(select(UserHistory).where(UserHistory.user_id == user.id)).all():
        db.delete(item)
    db.commit()
    return Response(status_code=204)


@router.get("/bookmarks", response_model=list[BookmarkItem])
def bookmarks(user: UserAccount = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(select(UserBookmark).where(UserBookmark.user_id == user.id).order_by(UserBookmark.id.desc())).all()


@router.post("/bookmarks", response_model=BookmarkItem, status_code=201)
def add_bookmark(payload: BookmarkCreate, user: UserAccount = Depends(current_user), db: Session = Depends(get_db)):
    item = UserBookmark(user_id=user.id, **payload.model_dump())
    db.add(item)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Item sudah dibookmark.") from exc
    db.refresh(item)
    return item


@router.delete("/bookmarks/{bookmark_id}", status_code=204)
def delete_bookmark(bookmark_id: int, user: UserAccount = Depends(current_user), db: Session = Depends(get_db)) -> Response:
    item = db.scalar(select(UserBookmark).where(UserBookmark.id == bookmark_id, UserBookmark.user_id == user.id))
    if item is None:
        raise HTTPException(status_code=404, detail="Bookmark tidak ditemukan.")
    db.delete(item)
    db.commit()
    return Response(status_code=204)


@router.post("/feedback", status_code=201)
def feedback(payload: FeedbackCreate, user: UserAccount = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    item = UserFeedback(user_id=user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    return {"status": "success", "data": {"id": item.id, "status": item.status}}
