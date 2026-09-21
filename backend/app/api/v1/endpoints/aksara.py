"""Endpoint transliterasi Latin <-> Aksara Jawa (tanpa database)."""

from fastapi import APIRouter

from app.schemas.aksara import TransliterateRequest, TransliterateResponse
from app.services.aksara_engine import transliterate

router = APIRouter()


@router.post("/transliterate", response_model=TransliterateResponse)
def transliterate_text(payload: TransliterateRequest) -> dict:
    result, rules = transliterate(
        payload.text, payload.direction, payload.include_sandhangan
    )
    data: dict = {
        "original": payload.text,
        "aksara": None,
        "latin": None,
        "rules_applied": rules,
    }
    if payload.direction == "latin_to_aksara":
        data["aksara"] = result
    else:
        data["latin"] = result
    return {"status": "success", "data": data}
