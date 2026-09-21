"""Koneksi database PostgreSQL via SQLAlchemy."""

import os
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

engine_kwargs: dict = {"pool_pre_ping": True}
if os.getenv("VERCEL") == "1":
    # Serverless: tiap invocasi pendek, jangan pertahankan connection pool.
    engine_kwargs["poolclass"] = NullPool

database_url = settings.database_url
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(database_url, **engine_kwargs)


class Base(DeclarativeBase):
    pass


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
