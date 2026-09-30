"""Layanan import/export dataset AI (JSONL / JSON / CSV).

Fungsi di modul ini sengaja dipisah dari endpoint supaya mudah diuji tanpa
database maupun jaringan.
"""

import csv
import io
import json
from collections.abc import Iterable, Iterator
from dataclasses import dataclass, field
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

Format = Literal["json", "jsonl", "csv"]
ImportMode = Literal["insert", "upsert"]

MAX_ROWS_PER_IMPORT = 5_000
MAX_PROMPT_CHARS = 8_000
MAX_COMPLETION_CHARS = 8_000
MAX_KATEGORI_CHARS = 50

EXPORT_FORMATS: tuple[Format, ...] = ("json", "jsonl", "csv")

CSV_COLUMNS = ("id", "prompt", "completion", "kategori", "is_verified", "created_at")


class DatasetRow(BaseModel):
    """Satu baris dataset, sudah divalidasi dan dinormalisasi."""

    model_config = ConfigDict(from_attributes=True)

    prompt: str = Field(..., min_length=1, max_length=MAX_PROMPT_CHARS)
    completion: str = Field(..., min_length=1, max_length=MAX_COMPLETION_CHARS)
    kategori: str = Field(..., min_length=1, max_length=MAX_KATEGORI_CHARS)
    is_verified: bool = False

    def fingerprint(self) -> tuple[str, str, str]:
        """Kunci unik logis: kategori + prompt + completion (case-insensitive)."""
        return (
            self.kategori.strip().lower(),
            " ".join(self.prompt.split()).lower(),
            " ".join(self.completion.split()).lower(),
        )

    def to_export_dict(self, row_id: int | None = None, created_at: str | None = None) -> dict:
        payload: dict[str, Any] = {
            "prompt": self.prompt,
            "completion": self.completion,
            "kategori": self.kategori,
            "is_verified": self.is_verified,
        }
        if row_id is not None:
            payload = {"id": row_id, **payload}
        if created_at is not None:
            payload["created_at"] = created_at
        return payload


class RowError(BaseModel):
    """Satu baris gagal divalidasi, dengan nomor baris sumber."""

    index: int
    location: str | None = None
    error: str


class DatasetParseError(ValueError):
    """Payload import tidak bisa dibaca sama sekali."""

    def __init__(self, errors: list[RowError]) -> None:
        super().__init__("Dataset tidak valid.")
        self.errors = errors


@dataclass
class ParsedDataset:
    rows: list[DatasetRow] = field(default_factory=list)
    errors: list[RowError] = field(default_factory=list)
    total_seen: int = 0

    @property
    def valid_count(self) -> int:
        return len(self.rows)

    @property
    def error_count(self) -> int:
        return len(self.errors)


def _iter_payload_rows(raw: Any) -> Iterator[tuple[int, Any, str | None]]:
    """Hasilkan ``(index, payload, lokasi)`` dari berbagai bentuk input."""
    if isinstance(raw, dict):
        for key in ("items", "rows", "data", "dataset"):
            if key in raw:
                raw = raw[key]
                break
        else:
            yield 0, raw, None
            return

    if isinstance(raw, list):
        for index, item in enumerate(raw):
            yield index, item, None
        return

    raise DatasetParseError(
        [RowError(index=0, error="Payload harus berupa list atau objek berisi list.")]
    )


def _normalise_bool(value: Any) -> Any:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"1", "true", "ya", "yes", "on"}:
            return True
        if lowered in {"0", "false", "nggak", "no", "off", ""}:
            return False
    if isinstance(value, int):
        return bool(value)
    return value


def _coerce_row(payload: Any) -> DatasetRow:
    if not isinstance(payload, dict):
        raise ValueError("Setiap baris harus berupa objek JSON.")
    data = {str(k).strip().lower(): v for k, v in payload.items()}
    mapped: dict[str, Any] = {}
    if "prompt" in data:
        mapped["prompt"] = data["prompt"]
    elif "user" in data or "input" in data:  # alias umum dataset instruksi
        mapped["prompt"] = data.get("user", data.get("input"))
    if "completion" in data:
        mapped["completion"] = data["completion"]
    elif "assistant" in data or "output" in data:
        mapped["completion"] = data.get("assistant", data.get("output"))
    if "kategori" in data:
        mapped["kategori"] = data["kategori"]
    elif "category" in data:
        mapped["kategori"] = data["category"]
    if "is_verified" in data:
        mapped["is_verified"] = _normalise_bool(data["is_verified"])
    elif "verified" in data:
        mapped["is_verified"] = _normalise_bool(data["verified"])
    return DatasetRow(**mapped)


def _describe_validation_error(exc: ValidationError) -> str:
    parts = []
    for error in exc.errors():
        location = ".".join(str(item) for item in error["loc"]) or "baris"
        parts.append(f"{location}: {error['msg']}")
    return "; ".join(parts)


def parse_json_rows(raw: Any, *, limit: int = MAX_ROWS_PER_IMPORT) -> ParsedDataset:
    """Parse dan validasi baris dataset dari list/objek JSON.

    Baris buruk tidak menghentikan proses: dikumpulkan di ``errors`` supaya
    laporan import bisa menunjukkan baris mana yang perlu diperbaiki.
    """
    result = ParsedDataset()
    for index, payload, location in _iter_payload_rows(raw):
        if result.total_seen >= limit:
            result.errors.append(
                RowError(
                    index=index,
                    location=location,
                    error=f"Maksimal {limit} baris per impor.",
                )
            )
            break
        result.total_seen += 1
        try:
            result.rows.append(_coerce_row(payload))
        except ValidationError as exc:
            result.errors.append(
                RowError(index=index, location=location, error=_describe_validation_error(exc))
            )
        except ValueError as exc:
            result.errors.append(RowError(index=index, location=location, error=str(exc)))
    return result


def parse_jsonl(text: str, *, limit: int = MAX_ROWS_PER_IMPORT) -> ParsedDataset:
    """Parse dataset JSONL (satu objek JSON per baris).

    Baris kosong dan komentar ``#`` diabaikan. Baris yang tidak valid
    dilaporkan lengkap dengan nomor baris file.
    """
    if len(text) > 20_000_000:
        raise DatasetParseError([RowError(index=0, error="File melebihi 20 MB.")])

    result = ParsedDataset()
    for line_number, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if result.total_seen >= limit:
            result.errors.append(
                RowError(index=line_number, error=f"Maksimal {limit} baris per impor.")
            )
            break
        result.total_seen += 1
        try:
            payload = json.loads(stripped)
        except json.JSONDecodeError as exc:
            result.errors.append(
                RowError(index=line_number, error=f"JSON tidak valid: {exc.msg}")
            )
            continue
        try:
            result.rows.append(_coerce_row(payload))
        except ValidationError as exc:
            result.errors.append(
                RowError(
                    index=line_number,
                    error=_describe_validation_error(exc),
                )
            )
        except ValueError as exc:
            result.errors.append(RowError(index=line_number, error=str(exc)))
    return result


def parse_csv_rows(text: str, *, limit: int = MAX_ROWS_PER_IMPORT) -> ParsedDataset:
    """Parse dataset CSV dengan header."""
    if len(text) > 20_000_000:
        raise DatasetParseError([RowError(index=0, error="File melebihi 20 MB.")])

    result = ParsedDataset()
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise DatasetParseError([RowError(index=0, error="CSV tidak memiliki header.")])

    required = {"prompt", "completion", "kategori"}
    available = {name.strip().lower() for name in reader.fieldnames if name}
    missing = required - available
    if missing:
        raise DatasetParseError(
            [
                RowError(
                    index=0,
                    error=f"Kolom wajib belum ada: {', '.join(sorted(missing))}.",
                )
            ]
        )

    for line_number, row in enumerate(reader, start=2):
        if result.total_seen >= limit:
            result.errors.append(
                RowError(index=line_number, error=f"Maksimal {limit} baris per impor.")
            )
            break
        result.total_seen += 1
        try:
            result.rows.append(_coerce_row(row))
        except ValidationError as exc:
            result.errors.append(
                RowError(index=line_number, error=_describe_validation_error(exc))
            )
        except ValueError as exc:
            result.errors.append(RowError(index=line_number, error=str(exc)))
    return result


def parse_dataset(raw: Any, content_type: str | None = None, *, limit: int = MAX_ROWS_PER_IMPORT) -> ParsedDataset:
    """Pilih parser berdasarkan tipe konten, atau tebak dari isi payload."""
    media_type = (content_type or "").split(";")[0].strip().lower()
    if media_type in {"application/x-ndjson", "application/jsonl", "text/jsonl"}:
        return parse_jsonl(raw if isinstance(raw, str) else json.dumps(raw), limit=limit)
    if media_type in {"text/csv", "application/csv"}:
        return parse_csv_rows(raw if isinstance(raw, str) else "", limit=limit)
    if media_type == "application/json" or raw is not None:
        if isinstance(raw, str):
            try:
                return parse_json_rows(json.loads(raw), limit=limit)
            except json.JSONDecodeError:
                return parse_jsonl(raw, limit=limit)
        return parse_json_rows(raw, limit=limit)
    raise DatasetParseError([RowError(index=0, error="Payload dataset kosong.")])


def dedupe_rows(rows: Iterable[DatasetRow]) -> tuple[list[DatasetRow], list[DatasetRow]]:
    """Pisahkan baris unik dari duplikat di dalam satu payload."""
    seen: set[tuple[str, str, str]] = set()
    unique: list[DatasetRow] = []
    duplicates: list[DatasetRow] = []
    for row in rows:
        key = row.fingerprint()
        if key in seen:
            duplicates.append(row)
            continue
        seen.add(key)
        unique.append(row)
    return unique, duplicates


def to_jsonl(rows: Iterable[dict]) -> str:
    """Serialisasi baris dataset menjadi JSONL (siap untuk fine-tuning)."""
    lines = [json.dumps(row, ensure_ascii=False, sort_keys=True) for row in rows]
    return "\n".join(lines) + ("\n" if lines else "")


def to_csv(rows: Iterable[dict]) -> str:
    """Serialisasi baris dataset menjadi CSV dengan header."""
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(CSV_COLUMNS), extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow(
            {
                **row,
                "is_verified": "true" if row.get("is_verified") else "false",
            }
        )
    return buffer.getvalue()


def dataset_stats(rows: Iterable[Any]) -> dict[str, Any]:
    """Ringkasan dataset: jumlah total, terverifikasi, dan sebaran kategori."""
    total = verified = 0
    per_kategori: dict[str, int] = {}
    for row in rows:
        total += 1
        if getattr(row, "is_verified", False):
            verified += 1
        kategori = getattr(row, "kategori", "lainnya") or "lainnya"
        per_kategori[kategori] = per_kategori.get(kategori, 0) + 1
    ordered = dict(sorted(per_kategori.items(), key=lambda item: (-item[1], item[0])))
    return {
        "total": total,
        "verified": verified,
        "unverified": total - verified,
        "verified_ratio": round(verified / total, 4) if total else 0.0,
        "per_kategori": ordered,
    }
