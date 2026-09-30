"""Test import/export dataset AI."""

import json

import pytest

from app.services.dataset import (
    DatasetParseError,
    dataset_stats,
    dedupe_rows,
    parse_csv_rows,
    parse_dataset,
    parse_json_rows,
    parse_jsonl,
    to_csv,
    to_jsonl,
)


def test_parse_jsonl_reads_each_line() -> None:
    text = "\n".join(
        [
            json.dumps({"prompt": "Apa basa Jawa?", "completion": "Basa Jawa.", "kategori": "umum"}),
            json.dumps({"prompt": "Apa undha usuk?", "completion": "Tembang.", "kategori": "tembang"}),
        ]
    )
    parsed = parse_jsonl(text)
    assert parsed.total_seen == 2
    assert parsed.valid_count == 2
    assert parsed.error_count == 0
    assert parsed.rows[0].kategori == "umum"


def test_parse_jsonl_skips_blank_and_comment_lines() -> None:
    text = "\n".join(
        [
            "# komentar",
            "",
            json.dumps({"prompt": "p", "completion": "c", "kategori": "k"}),
        ]
    )
    parsed = parse_jsonl(text)
    assert parsed.total_seen == 1
    assert parsed.valid_count == 1


def test_parse_jsonl_reports_line_number_for_invalid_json() -> None:
    text = "\n".join(
        [
            json.dumps({"prompt": "p", "completion": "c", "kategori": "k"}),
            "{bukan json",
        ]
    )
    parsed = parse_jsonl(text)
    assert parsed.valid_count == 1
    assert parsed.error_count == 1
    assert parsed.errors[0].index == 2
    assert "JSON tidak valid" in parsed.errors[0].error


def test_parse_jsonl_reports_missing_fields() -> None:
    parsed = parse_jsonl(json.dumps({"prompt": "hanya prompt"}))
    assert parsed.valid_count == 0
    assert parsed.error_count == 1
    assert "completion" in parsed.errors[0].error


def test_parse_jsonl_rejects_oversized_fields() -> None:
    payload = {"prompt": "x" * 9_000, "completion": "c", "kategori": "k"}
    parsed = parse_jsonl(json.dumps(payload))
    assert parsed.valid_count == 0
    assert "prompt" in parsed.errors[0].error


def test_parse_jsonl_enforces_row_limit() -> None:
    lines = [
        json.dumps({"prompt": f"p{i}", "completion": "c", "kategori": "k"})
        for i in range(5)
    ]
    parsed = parse_jsonl("\n".join(lines), limit=3)
    assert parsed.total_seen == 3
    assert any("Maksimal" in e.error for e in parsed.errors)


def test_parse_json_rows_accepts_alias_keys() -> None:
    parsed = parse_json_rows(
        [
            {"instruction": "Apa Jawa?", "output": "Basa Jawa.", "category": "umum"},
        ]
    )
    # "instruction" bukan alias yang dikenali -> baris dianggap tidak valid.
    assert parsed.valid_count == 0

    parsed = parse_json_rows(
        [{"user": "Apa Jawa?", "assistant": "Basa Jawa.", "category": "umum"}]
    )
    assert parsed.valid_count == 1
    assert parsed.rows[0].prompt == "Apa Jawa?"
    assert parsed.rows[0].kategori == "umum"


def test_parse_json_rows_accepts_wrapped_envelope() -> None:
    parsed = parse_json_rows({"items": [{"prompt": "p", "completion": "c", "kategori": "k"}]})
    assert parsed.valid_count == 1


def test_parse_json_rows_coerces_verified_strings() -> None:
    parsed = parse_json_rows(
        [{"prompt": "p", "completion": "c", "kategori": "k", "is_verified": "ya"}]
    )
    assert parsed.rows[0].is_verified is True
    parsed = parse_json_rows(
        [{"prompt": "p", "completion": "c", "kategori": "k", "is_verified": "false"}]
    )
    assert parsed.rows[0].is_verified is False


def test_parse_json_rows_rejects_non_list_payload() -> None:
    with pytest.raises(DatasetParseError):
        parse_json_rows(42)


def test_parse_csv_rows_reads_header() -> None:
    text = "prompt,completion,kategori,is_verified\np1,c1,umum,true\np2,c2,tembang,false\n"
    parsed = parse_csv_rows(text)
    assert parsed.total_seen == 2
    assert parsed.valid_count == 2
    assert parsed.rows[0].is_verified is True
    assert parsed.rows[1].is_verified is False


def test_parse_csv_rows_requires_columns() -> None:
    with pytest.raises(DatasetParseError) as exc:
        parse_csv_rows("prompt,completion\np,c\n")
    assert "kategori" in exc.value.errors[0].error


def test_parse_dataset_dispatches_on_content_type() -> None:
    jsonl = json.dumps({"prompt": "p", "completion": "c", "kategori": "k"})
    assert parse_dataset(jsonl, "application/x-ndjson").valid_count == 1

    csv_text = "prompt,completion,kategori\np,c,k\n"
    assert parse_dataset(csv_text, "text/csv").valid_count == 1

    assert parse_dataset([{"prompt": "p", "completion": "c", "kategori": "k"}]).valid_count == 1


def test_parse_dataset_falls_back_to_jsonl_for_broken_json() -> None:
    result = parse_dataset('{"prompt": "p"\n', "application/json")
    assert result.error_count == 1


def test_parse_dataset_rejects_oversized_text() -> None:
    with pytest.raises(DatasetParseError) as exc:
        parse_jsonl("x" * 20_000_001)
    assert "20 MB" in exc.value.errors[0].error


def test_dedupe_rows_uses_normalised_fingerprint() -> None:
    rows = parse_json_rows(
        [
            {"prompt": "Apa  Jawa?", "completion": "Basa Jawa.", "kategori": "Umum"},
            {"prompt": "Apa Jawa?", "completion": "Basa  Jawa.", "kategori": "umum"},
        ]
    ).rows
    unique, duplicates = dedupe_rows(rows)
    assert len(unique) == 1
    assert len(duplicates) == 1


def test_to_jsonl_roundtrips() -> None:
    rows = [{"prompt": "p", "completion": "c", "kategori": "k", "is_verified": True}]
    text = to_jsonl(rows)
    assert text.endswith("\n")
    assert json.loads(text.strip()) == rows[0]


def test_to_jsonl_empty_is_empty_string() -> None:
    assert to_jsonl([]) == ""


def test_to_csv_writes_header_and_boolean_strings() -> None:
    csv_text = to_csv(
        [
            {
                "id": 1,
                "prompt": "p",
                "completion": "c",
                "kategori": "k",
                "is_verified": True,
                "created_at": "2026-01-01T00:00:00+00:00",
            },
        ]
    )
    header, row = csv_text.splitlines()[:2]
    assert header.split(",") == ["id", "prompt", "completion", "kategori", "is_verified", "created_at"]
    assert row.split(",")[4] == "true"


def test_dataset_stats_counts_and_orders_categories() -> None:
    rows = parse_json_rows(
        [
            {"prompt": "p1", "completion": "c", "kategori": "umum", "is_verified": True},
            {"prompt": "p2", "completion": "c", "kategori": "umum"},
            {"prompt": "p3", "completion": "c", "kategori": "tembang"},
        ]
    ).rows
    stats = dataset_stats(rows)
    assert stats["total"] == 3
    assert stats["verified"] == 1
    assert stats["unverified"] == 2
    assert stats["verified_ratio"] == pytest.approx(1 / 3, abs=1e-4)
    assert stats["per_kategori"] == {"umum": 2, "tembang": 1}


def test_dataset_stats_handles_empty_dataset() -> None:
    stats = dataset_stats([])
    assert stats["total"] == 0
    assert stats["verified_ratio"] == 0.0
    assert stats["per_kategori"] == {}
