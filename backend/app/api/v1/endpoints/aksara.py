"""Endpoint transliterasi Latin <-> Aksara Jawa (tanpa database)."""

from fastapi import APIRouter

from app.schemas.aksara import TransliterateRequest, TransliterateResponse
from app.services.aksara_engine import detect_ambiguities, explain_transliteration, transliterate

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
        "segments": explain_transliteration(payload.text, payload.direction),
        "ambiguities": detect_ambiguities(payload.text, payload.direction),
    }
    if payload.direction == "latin_to_aksara":
        data["aksara"] = result
    else:
        data["latin"] = result
    return {"status": "success", "data": data}
