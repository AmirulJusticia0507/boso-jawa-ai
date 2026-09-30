"""Endpoint AI: chat LLM via gateway OpenAI-compatible (BazaarLink).

Dataset ekspor/impor masih stub — lihat docs/API_SPEC.md.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from openai import APIConnectionError, APIStatusError, APITimeoutError, RateLimitError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.ai import ChatRequest, ChatResponse, ModelsResponse
from app.services.ai_client import (
    AINotConfiguredError,
    chat_completion,
    list_models,
)
from app.services.rate_limiter import client_identifier, limiter
from app.services.knowledge import grounded_messages, retrieve_context

router = APIRouter()


def _gateway_error(e: Exception) -> HTTPException:
    if isinstance(e, AINotConfiguredError):
        return HTTPException(status_code=503, detail=str(e))
    if isinstance(e, APITimeoutError):
        return HTTPException(status_code=504, detail="Gateway AI tidak merespons tepat waktu.")
    if isinstance(e, RateLimitError):
        return HTTPException(status_code=429, detail="Gateway AI sedang membatasi permintaan.")
    if isinstance(e, (APIConnectionError, APIStatusError)):
        return HTTPException(status_code=502, detail="Gateway AI sedang bermasalah.")
    return HTTPException(status_code=502, detail="Tidak dapat memproses permintaan AI.")


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    limiter.check(
        f"ai:chat:{client_identifier(request)}",
        settings.ai_chat_rate_limit,
    )
    dumped_messages = [message.model_dump() for message in payload.messages]
    last_user_message = next(
        (message["content"] for message in reversed(dumped_messages) if message["role"] == "user"),
        "",
    )
    try:
        sources = retrieve_context(db, last_user_message)
    except SQLAlchemyError:
        sources = []
    messages = grounded_messages(dumped_messages, sources)
    try:
        model, answer = chat_completion(
            messages,
            model=payload.model,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
        )
    except Exception as e:  # noqa: BLE001 — dipetakan ke HTTP di bawah
        raise _gateway_error(e) from e
    return {
        "status": "success",
        "data": {"model": model, "answer": answer, "sources": sources},
    }


@router.get("/models", response_model=ModelsResponse)
def get_models(request: Request) -> dict:
    limiter.check(
        f"ai:models:{client_identifier(request)}",
        settings.ai_models_rate_limit,
    )
    try:
        models = list_models()
    except Exception as e:  # noqa: BLE001 — dipetakan ke HTTP di bawah
        raise _gateway_error(e) from e
    return {"status": "success", "data": models}


@router.get("/dataset/export")
def export_dataset() -> dict:
    raise HTTPException(
        status_code=501,
        detail="Ekspor dataset AI (JSONL/Parquet) belum diimplementasikan.",
    )


@router.post("/dataset/import")
def import_dataset() -> dict:
    raise HTTPException(
        status_code=501,
        detail="Impor dataset AI belum diimplementasikan.",
    )
