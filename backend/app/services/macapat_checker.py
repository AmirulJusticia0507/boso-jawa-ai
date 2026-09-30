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
            (8, "u"), (7, "a"), (8, "i"), (12, "a"),
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


def segment_wanda(gatra: str) -> list[str]:
    """Pecah satu gatra menjadi daftar wanda (suku kata).

    Setiap wanda dimulai dari satu vokal dan berlanjut sampai vokal berikutnya.
    Konsonan sebelum vokal pertama dianggap bagian wanda pembuka, dan spasi
    ikut terhitung sebagai bagian wanda sebelumnya supaya hitungan sesuai
    cara baca tembang.
    """
    text = _fold(gatra)
    tokens: list[str] = []
    current: list[str] = []
    in_vowel = False
    for ch in text:
        if ch in VOWELS:
            if in_vowel:
                # Vokal baru = wanda baru; emit wanda yang sedang dibangun.
                tokens.append("".join(current))
                current = []
            current.append(ch)
            in_vowel = True
        elif current:
            # Konsonan setelah vokal masih milik wanda yang sama.
            current.append(ch)
    if current:
        tokens.append("".join(current))
    return [token for token in tokens if token.strip()]


def count_wilangan(gatra: str) -> int:
    """Hitung guru wilangan: jumlah wanda (suku kata) dalam satu gatra."""
    return len(segment_wanda(gatra))


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


#: Alias nama tembang -> kunci kanonik di :data:`PAUGERAN`.
ALIASES: dict[str, str] = {
    "kinanti": "kinanthi",
    "kinan thi": "kinanthi",
    "asmarandana": "asmaradana",
    "asmara dhana": "asmaradana",
    "pucung": "pocung",
    "dhandang gula": "dhandhanggula",
    "dhandhanggula": "dhandhanggula",
    "maskumambang": "maskumambang",
    "mas kumambang": "maskumambang",
}


def resolve_tembang(nama_tembang: str) -> str | None:
    """Normalkan nama tembang: alias, spasi ganda, dan kapitalisasi.

    Mengembalikan kunci kanonik di :data:`PAUGERAN`, atau ``None`` bila tidak
    dikenal.
    """
    key = " ".join(nama_tembang.strip().lower().split())
    if key in PAUGERAN:
        return key
    return ALIASES.get(key)


def available_tembang() -> list[dict[str, Any]]:
    """Daftar lengkap tembang macapat: alias, guru gatra, paugeran, watak."""
    listing: list[dict[str, Any]] = []
    for key, spec in PAUGERAN.items():
        listing.append(
            {
                "nama_tembang": key.capitalize(),
                "alias": sorted(k for k, v in ALIASES.items() if v == key),
                "gatra": spec["gatra"],
                "paugeran": [
                    {"gatra": index + 1, "wilangan": w, "lagu": lagu}
                    for index, (w, lagu) in enumerate(spec["paugeran"])
                ],
                "watak": spec["watak"],
            }
        )
    return listing


def _suggest_wilangan(actual: int, target: int) -> str:
    delta = target - actual
    if delta > 0:
        return (
            f"Wilangan kurang {delta} wanda. Guru wilangan ngitung wanda, "
            f"dadi saben wanda dipisahaken (contone: 'kanggo' = 2 wanda)."
        )
    return (
        f"Wilangan luwih {-delta} wanda. Gatra iki kobeya — "
        f"potong kalimah utawa pit wanda supaya cocog."
    )


def _suggest_lagu(actual: str, target: str) -> str:
    if not actual:
        return f"Gatra kudu duwe vokal; guru lagu ngartekake '{target}'."
    return (
        f"Vokal wektu '{actual}', kudu '{target}'. Taling (é/è) lan pepet (ê) "
        f"dihitung minangka vokal '{actual}'."
    )


def check_lirik(
    nama_tembang: str,
    lirik: list[str],
    paugeran: Any | None = None,
    *,
    include_suggestions: bool = True,
) -> dict[str, Any]:
    """Validasi bait macapat terhadap paugeran.

    Mengembalikan dict berisi ``nama_tembang``, ``is_valid``, ``score``,
    ``analysis`` (per gatra, termasuk daftar wanda), dan ``errors``.
    Melempar ValueError bila tembang tidak dikenal dan tanpa paugeran.
    """
    if paugeran is None:
        canonical = resolve_tembang(nama_tembang)
        if canonical is None:
            raise ValueError(f"Tembang '{nama_tembang}' tidak dikenal.")
        rules = PAUGERAN[canonical]["paugeran"]
    else:
        rules = _coerce_paugeran(paugeran)

    errors: list[str] = []
    if len(lirik) != len(rules):
        errors.append(
            f"Guru gatra tidak sesuai: {len(lirik)} baris, "
            f"seharusnya {len(rules)} baris."
        )

    analysis: list[dict[str, Any]] = []
    valid_gatra = 0
    for idx, baris in enumerate(lirik):
        wanda = segment_wanda(baris)
        actual_w = len(wanda)
        actual_l = get_lagu(baris)
        if idx < len(rules):
            target_w, target_l = rules[idx]
            valid = actual_w == target_w and actual_l == target_l
            item: dict[str, Any] = {
                "gatra": idx + 1,
                "text": baris,
                "wanda": wanda,
                "target_wilangan": target_w,
                "actual_wilangan": actual_w,
                "target_lagu": target_l,
                "actual_lagu": actual_l,
                "valid": valid,
            }
            if not valid and include_suggestions:
                hints = []
                if actual_w != target_w:
                    hints.append(_suggest_wilangan(actual_w, target_w))
                if actual_l != target_l:
                    hints.append(_suggest_lagu(actual_l, target_l))
                item["suggestion"] = " ".join(hints)
        else:
            item = {
                "gatra": idx + 1,
                "text": baris,
                "wanda": wanda,
                "target_wilangan": None,
                "actual_wilangan": actual_w,
                "target_lagu": None,
                "actual_lagu": actual_l,
                "valid": False,
            }
            if include_suggestions:
                item["suggestion"] = (
                    f"Gatr iki luwih akeh tin bait tembang iki "
                    f"(total {len(rules)} gatra)."
                )
        if item["valid"]:
            valid_gatra += 1
        analysis.append(item)

    total = max(len(lirik), len(rules))
    score = round(valid_gatra / total * 100, 1) if total else 0.0
    is_valid = not errors and all(item["valid"] for item in analysis)

    return {
        "nama_tembang": nama_tembang.strip(),
        "is_valid": is_valid,
        "score": score,
        "valid_gatra": valid_gatra,
        "total_gatra": len(rules),
        "analysis": analysis,
        "errors": errors,
    }
