"""Test korektor linguistik (undha usuk) — frase, partikel, typo, lint."""

from types import SimpleNamespace

import pytest

from app.services.undha_usuk import (
    AFFIXES,
    LEVELS,
    build_index,
    correct_sentence,
    lint_text,
    split_affix,
    analyze_word_forms,
    normalize_dialect,
)

ENTRIES = [
    SimpleNamespace(
        ngoko="mangan",
        krama_lugu="nedha",
        krama_inggil="dhahar",
        bahasa_indonesia="makan",
    ),
    SimpleNamespace(
        ngoko="lunga",
        krama_lugu="kesah",
        krama_inggil="tindak",
        bahasa_indonesia="pergi",
    ),
    SimpleNamespace(
        ngoko="turu",
        krama_lugu="sare",
        krama_inggil="sare",
        bahasa_indonesia="tidur",
    ),
    SimpleNamespace(
        ngoko="nulis",
        krama_lugu="nulis",
        krama_inggil="nulis",
        bahasa_indonesia="tulis",
    ),
]


def test_levels_are_unchanged() -> None:
    assert LEVELS == ("ngoko", "krama_lugu", "krama_inggil")


def test_build_index_normalises_whitespace_and_case() -> None:
    entries = [SimpleNamespace(ngoko="  Mangan  ", krama_lugu="Nedha", bahasa_indonesia="makan")]
    index = build_index(entries)
    assert "mangan" in index
    assert index["mangan"].source_level == "ngoko"


@pytest.mark.parametrize(
    ("token", "expected"),
    [
        ("turna", ("tur", "na", "suffix")),
        ("turuné", ("turu", "né", "suffix")),
        ("kanggo", ("kanggo", "", "none")),
        ("lunga", ("lunga", "", "none")),
        ("manganing", ("mangan", "ing", "suffix")),
    ],
)
def test_split_affix(token: str, expected: tuple[str, str, str]) -> None:
    assert split_affix(token) == expected


def test_split_affix_never_splits_short_tokens() -> None:
    # Kata 3 huruf atau kurang tidak boleh dipecah jadi inti kosong.
    for token in ("na", "mu", "e", "ing"):
        core, affix, _ = split_affix(token)
        assert affix == ""
        assert core == token


def test_affixes_list_has_no_duplicates() -> None:
    assert len(AFFIXES) == len(set(AFFIXES))


def test_dialect_normalization_and_morphology() -> None:
    normalized, changes = normalize_dialect("Inyong arep mangan", "ngapak")
    assert normalized == "Aku arep mangan"
    assert changes[0]["dialect"] == "ngapak"
    assert analyze_word_forms("manganing")[0] == {"word": "manganing", "base": "mangan", "affix": "ing", "position": "suffix"}


def test_single_word_phrases_are_reported_as_exact() -> None:
    corrected, changes = correct_sentence("aku mangan", "krama_lugu", ENTRIES)
    assert corrected == "kula nedha"
    assert [c["kind"] for c in changes] == ["exact", "exact"]


def test_multiword_phrase_is_matched_before_single_tokens() -> None:
    # "terima kasih" harus utuh, tidak dipecah jadi "terima" + "kasih".
    corrected, changes = correct_sentence("aku, terima kasih.", "krama_lugu", ENTRIES)
    assert corrected == "kula, matur nuwun."
    assert changes[-1]["kind"] == "phrase"


def test_multiword_phrase_translation() -> None:
    corrected, _ = correct_sentence("terima kasih", "krama_inggil", ENTRIES)
    assert corrected == "matur nuwun sanget"


def test_phrase_keeps_spacing_around() -> None:
    corrected, _ = correct_sentence("aku, mangan.", "krama_lugu", ENTRIES)
    assert corrected == "kula, nedha."


def test_suffix_affix_is_preserved() -> None:
    corrected, changes = correct_sentence("turna", "krama_lugu", ENTRIES)
    assert corrected == "sarena"
    assert changes[0]["kind"] == "suffix_affix"


def test_prefix_affix_is_preserved() -> None:
    corrected, changes = correct_sentence("kanggo mangan", "krama_inggil", ENTRIES)
    assert "dhahar" in corrected
    assert "kanggo" in corrected


def test_inflected_form_translates_core_and_keeps_particle() -> None:
    corrected, _ = correct_sentence("lungana", "krama_lugu", ENTRIES)
    assert corrected == "kesahna"


def test_typo_correction_is_opt_in() -> None:
    corrected_off, changes_off = correct_sentence("mangsn", "krama_inggil", ENTRIES)
    assert corrected_off == "mangsn"
    assert changes_off == []

    corrected_on, changes_on = correct_sentence(
        "mangsn", "krama_inggil", ENTRIES, fix_typos=True
    )
    assert corrected_on == "dhahar"
    assert changes_on[0]["kind"] == "typo"
    assert 0 < changes_on[0]["confidence"] < 1.0


def test_typo_guess_never_touches_stopwords() -> None:
    corrected, _ = correct_sentence("banjur", "krama_inggil", ENTRIES, fix_typos=True)
    assert corrected == "banjur"


def test_include_unknown_reports_unmapped_words() -> None:
    corrected, changes = correct_sentence(
        "xyzabc", "krama_lugu", ENTRIES, include_unknown=True
    )
    assert corrected == "xyzabc"
    unknown = [c for c in changes if c["kind"] == "unknown"]
    assert unknown and "xyzabc" in unknown[0]["original"]


def test_change_payload_has_expected_keys() -> None:
    _, changes = correct_sentence("mangan", "krama_lugu", ENTRIES)
    assert set(changes[0]) == {
        "original",
        "replacement",
        "source_level",
        "target_level",
        "meaning",
        "confidence",
        "kind",
    }
    assert changes[0]["confidence"] == 1.0
    assert changes[0]["kind"] == "exact"


def test_lint_text_reports_levels_and_unknown() -> None:
    report = lint_text("aku mangan lan lunga", ENTRIES)
    assert report["token_count"] == 4
    assert report["known_count"] >= 2
    assert report["dominant_level"] in LEVELS
    assert isinstance(report["suggestions"], list)


def test_lint_text_flags_unmapped_words() -> None:
    report = lint_text("qwerty zxcvb", ENTRIES)
    assert report["unknown_count"] >= 1
    assert any("kamus" in s for s in report["suggestions"])


def test_lint_text_on_empty_input() -> None:
    report = lint_text("", ENTRIES)
    assert report["token_count"] == 0
    assert report["consistency"] == 0.0
    assert report["suggestions"] == []


def test_lint_text_warns_about_mixed_levels() -> None:
    entries = [
        SimpleNamespace(ngoko="mangan", krama_lugu="nedha", bahasa_indonesia="makan"),
        SimpleNamespace(ngoko="lunga", krama_lugu="kesah", bahasa_indonesia="pergi"),
    ]
    report = lint_text("mangan lunga", entries)
    assert report["level_counts"]["ngoko"] == 2
    assert report["dominant_level"] == "ngoko"
