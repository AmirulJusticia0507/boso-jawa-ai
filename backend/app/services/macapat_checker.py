"""Checker paugeran Tembang Macapat: guru gatra, guru wilangan, guru lagu.

Guru wilangan dihitung dari jumlah gugus vokal (wanda) per gatra,
guru lagu dari vokal terakhir tiap gatra.
"""

from typing import Any

VOWELS = set("aiueo")

# Normalisasi varian 'e': taling (é/è) maupun pepet (ê) -> 'e'.
VOWEL_FOLD = {"é": "e", "è": "e", "ê": "e"}

# Paugeran bawaan 11 tembang macapat: (wilangan, lagu) per gatra.
# Dipakai sebagai fallback bila baris tabel `macapat` belum ada di database.
PAUGERAN: dict[str, dict[str, Any]] = {
    "mijil": {
        "gatra": 6,
        "paugeran": [(10, "i"), (6, "o"), (10, "e"), (10, "i"), (6, "i"), (6, "u")],
        "watak": "Kasih sayang, kesedihan, dan nasehat.",
    },
    "kinanthi": {
        "gatra": 6,
        "paugeran": [(8, "u"), (8, "i"), (8, "a"), (8, "i"), (8, "a"), (8, "i")],
        "watak": "Kasih sayang, cita-cita, dan nasehat.",
    },
    "sinom": {
        "gatra": 9,
        "paugeran": [
            (8, "a"), (8, "i"), (8, "a"), (8, "i"), (7, "i"),
            (8, "u"), (7, "a"), (8, "u"), (12, "a"),
        ],
        "watak": "Suasana muda, gembira, dan nasehat.",
    },
    "asmaradana": {
        "gatra": 7,
        "paugeran": [
            (8, "i"), (8, "a"), (8, "e"), (8, "a"), (7, "a"), (8, "u"), (8, "a"),
        ],
        "watak": "Cinta, asmara, dan kesedihan.",
    },
    "dhandhanggula": {
        "gatra": 10,
        "paugeran": [
            (10, "i"), (10, "a"), (8, "e"), (7, "u"), (9, "i"),
            (7, "a"), (6, "u"), (8, "a"), (12, "i"), (7, "a"),
        ],
        "watak": "Luwes dan manis; memuat segala suasana.",
    },
    "gambuh": {
        "gatra": 5,
        "paugeran": [(7, "u"), (10, "u"), (12, "i"), (8, "u"), (8, "o")],
        "watak": "Keharmonisan, persatuan, dan nasehat.",
    },
    "pangkur": {
        "gatra": 7,
        "paugeran": [
            (8, "a"), (11, "i"), (8, "u"), (7, "a"), (12, "u"), (8, "a"), (8, "i"),
        ],
        "watak": "Semangat, ketegasan, dan nasihat keras.",
    },
    "megatruh": {
        "gatra": 5,
        "paugeran": [(12, "u"), (8, "i"), (8, "u"), (8, "i"), (8, "o")],
        "watak": "Duka, penyesalan, dan keinsafan.",
    },
    "pocung": {
        "gatra": 4,
        "paugeran": [(12, "u"), (6, "a"), (8, "i"), (12, "a")],
        "watak": "Jenaka, guyon, dan teka-teki.",
    },
    "durma": {
        "gatra": 7,
        "paugeran": [
            (12, "a"), (7, "i"), (6, "a"), (7, "a"), (8, "i"), (5, "a"), (7, "i"),
        ],
        "watak": "Gagah, berani, dan peperangan.",
    },
    "maskumambang": {
        "gatra": 4,
        "paugeran": [(12, "i"), (6, "a"), (8, "i"), (8, "a")],
        "watak": "Kesedihan dan belas kasihan.",
    },
}


def _fold(text: str) -> str:
    return "".join(VOWEL_FOLD.get(ch, ch) for ch in text.lower())


def count_wilangan(gatra: str) -> int:
    """Hitung guru wilangan: jumlah gugus vokal dalam satu gatra."""
    count, in_vowel = 0, False
    for ch in _fold(gatra):
        if ch in VOWELS:
            if not in_vowel:
                count += 1
                in_vowel = True
        else:
            in_vowel = False
    return count


def get_lagu(gatra: str) -> str:
    """Ambil guru lagu: vokal terakhir dalam satu gatra ('' bila tak ada)."""
    for ch in reversed(_fold(gatra)):
        if ch in VOWELS:
            return ch
    return ""


def _coerce_paugeran(paugeran: Any) -> list[tuple[int, str]]:
    """Terima format DB (list dict) maupun bawaan (list tuple)."""
    coerced: list[tuple[int, str]] = []
    for item in paugeran:
        if isinstance(item, dict):
            coerced.append((int(item["wilangan"]), str(item["lagu"])))
        else:
            w, lg = item
            coerced.append((int(w), str(lg)))
    return coerced


def check_lirik(
    nama_tembang: str, lirik: list[str], paugeran: Any | None = None
) -> dict[str, Any]:
    """Validasi bait macapat terhadap paugeran.

    Mengembalikan dict {nama_tembang, is_valid, analysis, errors}.
    Melempar ValueError bila tembang tidak dikenal dan tanpa paugeran.
    """
    key = nama_tembang.strip().lower()
    if paugeran is None:
        if key not in PAUGERAN:
            raise ValueError(f"Tembang '{nama_tembang}' tidak dikenal.")
        rules = PAUGERAN[key]["paugeran"]
    else:
        rules = _coerce_paugeran(paugeran)

    errors: list[str] = []
    if len(lirik) != len(rules):
        errors.append(
            f"Guru gatra tidak sesuai: {len(lirik)} baris, "
            f"seharusnya {len(rules)} baris."
        )

    analysis: list[dict[str, Any]] = []
    overall = not errors
    for idx, baris in enumerate(lirik):
        actual_w = count_wilangan(baris)
        actual_l = get_lagu(baris)
        if idx < len(rules):
            target_w, target_l = rules[idx]
            valid = actual_w == target_w and actual_l == target_l
            item: dict[str, Any] = {
                "gatra": idx + 1,
                "text": baris,
                "target_wilangan": target_w,
                "actual_wilangan": actual_w,
                "target_lagu": target_l,
                "actual_lagu": actual_l,
                "valid": valid,
            }
        else:
            valid = False
            item = {
                "gatra": idx + 1,
                "text": baris,
                "target_wilangan": None,
                "actual_wilangan": actual_w,
                "target_lagu": None,
                "actual_lagu": actual_l,
                "valid": False,
            }
        overall = overall and valid
        analysis.append(item)

    return {
        "nama_tembang": nama_tembang.strip(),
        "is_valid": overall,
        "analysis": analysis,
        "errors": errors,
    }
