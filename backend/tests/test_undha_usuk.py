from types import SimpleNamespace

import pytest

from app.services.undha_usuk import correct_sentence

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
]


def test_correct_sentence_preserves_spacing_punctuation_and_case() -> None:
    corrected, changes = correct_sentence("Mangan, banjur lunga!", "krama_inggil", ENTRIES)
    assert corrected == "Dhahar, banjur tindak!"
    assert [change["original"] for change in changes] == ["Mangan", "lunga"]
    assert changes[0]["meaning"] == "makan"


def test_correct_sentence_can_convert_back_to_ngoko() -> None:
    corrected, _ = correct_sentence("Dhahar banjur tindak", "ngoko", ENTRIES)
    assert corrected == "Mangan banjur lunga"


def test_unknown_words_are_left_unchanged() -> None:
    corrected, changes = correct_sentence("tembung anyar", "krama_lugu", ENTRIES)
    assert corrected == "tembung anyar"
    assert changes == []


def test_unknown_level_is_rejected() -> None:
    with pytest.raises(ValueError, match="Tingkat basa"):
        correct_sentence("mangan", "unknown", ENTRIES)
