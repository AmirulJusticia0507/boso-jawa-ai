"""Klien LLM via gateway OpenAI-compatible (BazaarLink).

Contoh pemakaian SDK yang setara:
    from openai import OpenAI
    client = OpenAI(
        base_url="https://api.bazaarlink.ai/v1",
        api_key="sk-bl-...",
    )
"""

from openai import OpenAI

from app.core.config import settings


class AINotConfiguredError(RuntimeError):
    pass


def resolve_model(model: str | None) -> str:
    name = (model or settings.ai_model).strip()
    if not name:
        raise AINotConfiguredError(
            "Model AI belum ditentukan. Isi AI_MODEL di .env "
            "atau kirim field 'model' pada request "
            "(lihat GET /ai/models untuk daftar model)."
        )
    return name


def get_client() -> OpenAI:
    if not settings.bazaarlink_api_key:
        raise AINotConfiguredError(
            "BAZAARLINK_API_KEY belum dikonfigurasi. Isi di file backend/.env."
        )
    return OpenAI(
        base_url=settings.bazaarlink_base_url,
        api_key=settings.bazaarlink_api_key,
    )


def chat_completion(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> tuple[str, str]:
    """Kirim chat completion. Mengembalikan (model_terpakai, jawaban)."""
    client = get_client()
    name = resolve_model(model)
    resp = client.chat.completions.create(
        model=name,
        messages=messages,
        temperature=settings.ai_temperature if temperature is None else temperature,
        max_tokens=settings.ai_max_tokens if max_tokens is None else max_tokens,
    )
    return name, (resp.choices[0].message.content or "")


def list_models() -> list[str]:
    """Daftar id model yang tersedia di gateway."""
    return [m.id for m in get_client().models.list().data]
