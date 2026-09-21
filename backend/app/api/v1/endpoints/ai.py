"""Endpoint AI: chat LLM via gateway OpenAI-compatible (BazaarLink).

Dataset ekspor/impor masih stub — lihat docs/API_SPEC.md.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.ai import ChatRequest, ChatResponse, ModelsResponse
from app.services.ai_client import (
    AINotConfiguredError,
    chat_completion,
    list_models,
)

router = APIRouter()


def _gateway_error(e: Exception) -> HTTPException:
    if isinstance(e, AINotConfiguredError):
        return HTTPException(status_code=503, detail=str(e))
    return HTTPException(status_code=502, detail=f"Gateway AI error: {e}")


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> dict:
    try:
        model, answer = chat_completion(
            [m.model_dump() for m in payload.messages],
            model=payload.model,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
        )
    except Exception as e:  # noqa: BLE001 — dipetakan ke HTTP di bawah
        raise _gateway_error(e) from e
    return {"status": "success", "data": {"model": model, "answer": answer}}


@router.get("/models", response_model=ModelsResponse)
def get_models() -> dict:
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
