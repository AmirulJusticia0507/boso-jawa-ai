import pytest

from app.services.aksara_engine import (
    aksara_to_latin,
    detect_ambiguities,
    explain_transliteration,
    latin_to_aksara,
    transliterate,
)


@pytest.mark.parametrize(
    ("latin", "aksara"),
    [
        ("mangan", "\ua9a9\ua994\ua9a4\ua9c0"),
        ("soto", "\ua9b1\ua9ba\ua9b4\ua9a0\ua9ba\ua9b4"),
        ("ing", "\ua9b2\ua9b6\ua981"),
        ("sega", "\ua9b1\ua9bc\ua992"),
    ],
)
def test_latin_to_aksara_known_words(latin: str, aksara: str) -> None:
    result, _ = latin_to_aksara(latin)
    assert result == aksara


@pytest.mark.parametrize("text", ["mangan", "soto", "ing", "jawa", "sega", "anak"])
def test_common_words_round_trip(text: str) -> None:
    aksara, _ = latin_to_aksara(text)
    latin, _ = aksara_to_latin(aksara)
    assert latin == text


def test_sentence_preserves_spaces_and_punctuation() -> None:
    source = "mangan soto, ing jawa."
    aksara, _ = latin_to_aksara(source)
    result, _ = aksara_to_latin(aksara)
    assert result == source


def test_taling_tarung_rule_is_reported_once() -> None:
    _, rules = latin_to_aksara("soto")
    assert "Taling Tarung pada 'so'" in rules
    assert "Taling Tarung pada 'to'" in rules


def test_transliterate_rejects_unknown_direction() -> None:
    with pytest.raises(ValueError, match="direction tidak dikenal"):
        transliterate("jawa", "unknown")  # type: ignore[arg-type]


def test_explanation_splits_latin_into_syllables() -> None:
    segments = explain_transliteration("sega", "latin_to_aksara")
    assert [item["source"] for item in segments] == ["se", "ga"]
    assert "output" in segments[0]


def test_plain_e_produces_taling_suggestion() -> None:
    warnings = detect_ambiguities("sate", "latin_to_aksara")
    assert warnings[0]["source"] == "e"
    assert warnings[0]["suggestions"] == ["saté"]
