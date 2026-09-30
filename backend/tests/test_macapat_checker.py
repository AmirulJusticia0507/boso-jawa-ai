import pytest

from app.services.macapat_checker import check_lirik, count_wilangan, get_lagu, segment_wanda


POCUNG_VALID = [
    "Bapak Pocung dudu watu dudu gunung",
    "Sangkane ing sabrang",
    "Elinga pepeling iki",
    "Mrih rahayu donya tumekan akhirat",
]


def test_count_wilangan_counts_vowel_groups() -> None:
    assert count_wilangan(POCUNG_VALID[0]) == 12
    assert count_wilangan("ora ana") == 4


def test_segment_wanda_handles_onset_clusters_and_coda_ng() -> None:
    assert segment_wanda("sabrang") == ["sa", "brang"]
    assert segment_wanda("sangkane") == ["sang", "ka", "ne"]
    assert segment_wanda("Pocung!") == ["po", "cung"]


@pytest.mark.parametrize(
    ("line", "expected"),
    [("Pocung", "u"), ("sabrang!", "a"), ("pepeling iki", "i"), ("123", "")],
)
def test_get_lagu_ignores_trailing_consonants_and_punctuation(
    line: str, expected: str
) -> None:
    assert get_lagu(line) == expected


def test_valid_pocung_passes_all_rules() -> None:
    result = check_lirik("Pocung", POCUNG_VALID)
    assert result["is_valid"] is True
    assert result["errors"] == []
    assert all(item["valid"] for item in result["analysis"])


def test_wrong_gatra_count_is_reported() -> None:
    result = check_lirik("Pocung", POCUNG_VALID[:3])
    assert result["is_valid"] is False
    assert "3 baris" in result["errors"][0]
    assert "4 baris" in result["errors"][0]


def test_invalid_gatra_marks_problem_wanda_and_suggests_fix() -> None:
    result = check_lirik("Pocung", ["Bapak Pocung dudu watu dudu gunung a", *POCUNG_VALID[1:]])
    first = result["analysis"][0]
    assert first["problem_wanda"]
    assert first["suggestion"]


def test_unknown_tembang_raises_clear_error() -> None:
    with pytest.raises(ValueError, match="tidak dikenal"):
        check_lirik("Ora Ana", ["contoh"])
