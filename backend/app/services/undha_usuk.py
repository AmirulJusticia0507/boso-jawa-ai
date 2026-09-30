"""Korektor tingkat basa Jawa: ngoko ↔ krama lugu ↔ krama inggil.

Pendekatan: token demi token, tapi dengan tiga lapis penanganan supaya
kalimat nyata bisa dikoreksi — bukan cuma kalimat yang persis sama dengan
kamus:

1. **Frasa** — padanan multi-kata ("aku arep" → "kula badhe") dicocokkan lebih
   dulu, sebelum token tunggal.
2. **Awalan/sufiks** — partikel Jawa (``-na``, ``-mu``, ``-e``, ``-né``,
   ``-ing``, ``kanggo``, ...) dipisah dari inti tembung lalu inti diterjemahkan
   dan partikelnya dipertahankan pada tingkat yang sama.
3. **Kesalahan ketik** — kalau inti tidak ditemukan, tebak yang terdekat
   (distance-aware) dan ditandai dengan tingkat keyakinan yang rendah
    supaya pengguna bisa meninjau ulang.
"""

import difflib
import re
from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

LEVELS = ("ngoko", "krama_lugu", "krama_inggil")
LEVEL_LABELS = {
    "ngoko": "Ngoko",
    "krama_lugu": "Krama Lugu",
    "krama_inggil": "Krama Inggil",
}

TOKEN_PATTERN = re.compile(r"\w+|[^\w\s]+|\s+", flags=re.UNICODE)

VOWELS = ("a", "e", "é", "i", "o", "u")

#: Jumlah kata maksimum dalam satu frasa yang dicocokkan.
MAX_PHRASE_WORDS = 3

#: Sufiks (menempel di akhir inti kata). Urutan = prioritas longest-match.
SUFFIXES: tuple[str, ...] = ("né", "nè", "ing", "na", "mu", "ku", "é", "e", "ne", "njuk")

#: Awalan (menempel di awal inti kata).
PREFIXES: tuple[str, ...] = ("kanggo", "kang", "saka", "maring", "banjur", "amarga", "nanging")

#: Gabungan keduanya, dipakai untuk pencocokan.
AFFIXES: tuple[str, ...] = SUFFIXES + PREFIXES

#: Padanan frasa (multi-kata) — dicocokkan lebih dulu daripada token tunggal.
PHRASES: dict[str, dict[str, str]] = {
    "aku arep": {"ngoko": "aku arep", "krama_lugu": "kula badhe", "krama_inggil": "kula badhe"},
    "aku bisa": {"ngoko": "aku bisa", "krama_lugu": "kula bisa", "krama_inggil": "kula bisa"},
    "aku menapa": {"ngoko": "aku apa", "krama_lugu": "kula napa", "krama_inggil": "kula napa"},
    "tolong": {"ngoko": "tolong", "krama_lugu": "mohon", "krama_inggil": "mohon"},
    "terima kasih": {
        "ngoko": "terima kasih",
        "krama_lugu": "matur nuwun",
        "krama_inggil": "matur nuwun sanget",
    },
    "maaf": {"ngoko": "maaf", "krama_lugu": "nuwun", "krama_inggil": "nuwun ewuh"},
    "ngga": {"ngoko": "nggak", "krama_lugu": "boten", "krama_inggil": "boten"},
    "nggak": {"ngoko": "nggak", "krama_lugu": "boten", "krama_inggil": "boten"},
    "kowe": {"ngoko": "kowe", "krama_lugu": "kowe", "krama_inggil": "panjenengan"},
    "aku": {"ngoko": "aku", "krama_lugu": "kula", "krama_inggil": "kula"},
    "dhewe": {"ngoko": "dhewe", "krama_lugu": "dhewe", "krama_inggil": "kula (dhewe)"},
    "bathi": {"ngoko": "basa Jawa", "krama_lugu": "basa Jawa", "krama_inggil": " basa Jawa"},
    "sugeng": {"ngoko": "sugeng", "krama_lugu": "sugeng", "krama_inggil": "sugeng rawuh"},
    "ndherek": {"ngoko": "ndherek", "krama_lugu": "ndherek", "krama_inggil": "ketahi"},
}

#: Kata Jawa yang sering muncul walau belum tentu ada di kamus. Fungsinya
#: mencegah korektor menandai kata umum sebagai typo atau "tak dikenal".
KNOWN_JAVANESE: frozenset[str] = frozenset(
    {
        "sugeng", "rawuh", "mangan", "turu", "dhahar", "sare", "basa", "jawa",
        "kanggo", "amarga", "nanging", "uga", "utawa", "wong", "dadi", "iki",
        "iku", "ana", "ora", "engko", "wis", "dudutan", "dudu", "watu", "gunung",
        "bapak", "bundo", "mowo", "bocah", "kulini", "sedheng", "tansah",
        "sak", "wonge", "pira", "akeh", "sithik", "reka", "banyara", "wujil",
    }
)

#: Kata umum yang selalu dikenali walau kamus kecil — knowledge base minimal.
#: Fungsinya mencegah korektor salah menandai partikel/fungsi sebagai typo.
STOPWORDS: set[str] = {
    "lan", "utawa", "nanging", "amarga", "sabab", "kanggo", "ing", "saka", "karo",
    "uga", "bukan", "a", "i", "ana", "duwe", "nduwe", "wong", "dhewe", "iki", "iku",
    "ono", "arep", "bisa", "kudu", "wajib", "sanajan", "sajaba",
    # kata kerja penghubung & penanda waktu yang sangat sering muncul
    "banjur", "banjur", "kok", "wong", "dening", "jalaran", "amarga", "sing",
    "aku", "kowe", "dhewe", " awake", "lha", "ya", "wong", "wis", "durung",
    "mung", "aja", "saka", "nganti", "sadurunge", "sawise", "lagi", "isih",
    "aja", "mung", "kabeh", "akeh", "sithik", "prakara", "wong", "maneh",
}


@dataclass(frozen=True)
class Match:
    """Satu padanan yang ditemukan di kamus."""

    entry: Any
    source_level: str


@dataclass(frozen=True)
class Change:
    """Perubahan yang diterapkan pada satu token/frasa."""

    original: str
    replacement: str
    source_level: str
    target_level: str
    meaning: str
    confidence: float = 1.0
    kind: str = "exact"

    def as_dict(self) -> dict[str, Any]:
        return {
            "original": self.original,
            "replacement": self.replacement,
            "source_level": self.source_level,
            "target_level": self.target_level,
            "meaning": self.meaning,
            "confidence": self.confidence,
            "kind": self.kind,
        }


def _match_case(source: str, replacement: str) -> str:
    if source.isupper():
        return replacement.upper()
    if source[:1].isupper():
        return replacement[:1].upper() + replacement[1:]
    return replacement


def _normalise_key(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _inflected_forms(word: str) -> list[str]:
    """Bentuk-bentuk berpartikel dari satu kata dasar.

    Untuk sufikel konsonan (``na``, ``mu``, ``ing``, ...) Bahasa Jawa biasanya
    menel-drop vokal akhir ("turu" → "turna"), jadi kedua ejaan diindeks.
    """
    forms: list[str] = []
    for prefix in PREFIXES:
        forms.append(f"{prefix}{word}")
    for suffix in SUFFIXES:
        forms.append(f"{word}{suffix}")
        if word.endswith(VOWELS) and suffix[0] not in VOWELS:
            forms.append(f"{word[:-1]}{suffix}")
    return forms


def build_index(entries: Iterable[Any]) -> dict[str, Match]:
    """Bangun indeks padanan dari seluruh entri kamus.

    Key dinormalkan (spasi rapi, lowercase) supaya pencarian tahan typo spasi.
    """
    index: dict[str, Match] = {}
    for entry in entries:
        for level in LEVELS:
            value = getattr(entry, level, None)
            if not value:
                continue
            index.setdefault(_normalise_key(str(value)), Match(entry=entry, source_level=level))
    return index


def build_inflected_index(index: dict[str, Match]) -> dict[str, tuple[str, str]]:
    """Petakan bentuk berpartikel → (bentuk dasar, partikel).

    Dibangun dari indeks utama, sehingga tidak perlu kamus terpisah.
    """
    inflected: dict[str, tuple[str, str]] = {}
    for base in index:
        for form in _inflected_forms(base):
            inflected.setdefault(form, (base, _affix_of(form, base)))
    return inflected


def _affix_of(form: str, base: str) -> str:
    for prefix in PREFIXES:
        if form.startswith(prefix):
            return prefix
    for suffix in SUFFIXES:
        if form.endswith(suffix):
            return suffix
    return ""


def split_affix(token: str) -> tuple[str, str, str]:
    """Pisahkan partikel dari inti tembung.

    ``'turna'`` → ``('tur', 'na', 'suffix')``. Mengembalikan
    ``(inti, partikel, posisi)``; bila tidak ada partikel, ``inti`` sama dengan
    token dan ``partikel`` kosong.
    """
    lowered = token.lower()
    for affix in AFFIXES:
        if lowered == affix:
            continue
        if lowered.startswith(affix) and len(lowered) - len(affix) >= 3:
            return lowered[len(affix):], affix, "prefix"
        if lowered.endswith(affix) and len(lowered) - len(affix) >= 3:
            return lowered[: -len(affix)], affix, "suffix"
    return lowered, "", "none"


def _best_guess(needle: str, candidates: Iterable[str], *, cutoff: float = 0.82) -> tuple[str | None, float]:
    """Tebakan terdekat untuk token yang tidak ada di kamus."""
    matches = difflib.get_close_matches(needle, list(candidates), n=1, cutoff=cutoff)
    if not matches:
        return None, 0.0
    guess = matches[0]
    ratio = difflib.SequenceMatcher(None, needle, guess).ratio()
    return guess, round(ratio, 3)


def _lookup_phrase(phrase: str, index: dict[str, Match]) -> Match | None:
    key = _normalise_key(phrase)
    if key in PHRASES:
        return None  # ditangani terpisah
    return index.get(key)


def _phrase_replacement(phrase: str, target_level: str) -> str | None:
    entry = PHRASES.get(_normalise_key(phrase))
    if not entry:
        return None
    return entry.get(target_level)


def correct_sentence(
    text: str,
    target_level: str,
    entries: Iterable[Any],
    *,
    include_unknown: bool = False,
    fix_typos: bool = False,
) -> tuple[str, list[dict[str, Any]]]:
    """Koreksi tingkat basa dalam satu kalimat.

    Mengembalikan ``(teks_koreksi, daftar_perubahan)``. Perubahan berisi
    ``original``, ``replacement``, ``source_level``, ``target_level``,
    ``meaning``, ``confidence``, dan ``kind``.

    ``fix_typos`` mengaktifkan tebakan kata yang salah ketik (menandai
    ``kind="typo"`` dengan ``confidence`` di bawah 1.0). Nonaktif secara
    default supaya koreksi tidak pernah mengubah teks tanpa sebab yang jelas.
    ``include_unknown`` menambahkan satu entri ``kind="unknown"`` yang
    merangkum tembung yang tidak ada di kamus.
    """
    if target_level not in LEVELS:
        raise ValueError(f"Tingkat basa tidak dikenal: {target_level}")

    entries = list(entries)
    index = build_index(entries)
    inflected = build_inflected_index(index)
    changes: list[dict[str, Any]] = []
    output: list[str] = []
    unknown: list[str] = []
    tokens = TOKEN_PATTERN.findall(text)
    total = len(tokens)
    cursor = 0

    def emit(change: Change) -> None:
        changes.append(change.as_dict())

    while cursor < total:
        token = tokens[cursor]
        if not token[:1].isalnum():
            # Spasi, tanda baca, atau karakter lain: teruskan apa adanya.
            output.append(token)
            cursor += 1
            continue

        # Kumpulkan hingga MAX_PHRASE_WORDS kata berurutan beserta spasi
        # antarkata, supaya frasa bisa dicocokkan tanpa merusak spasi asli.
        runs: list[tuple[str, int]] = []  # (kata, indeks token berikutnya)
        probe = cursor
        for _ in range(MAX_PHRASE_WORDS):
            if probe >= total or not tokens[probe][:1].isalnum():
                break
            word = tokens[probe]
            probe += 1
            while probe < total and tokens[probe].isspace():
                probe += 1
            runs.append((word, probe))
        if not runs:
            output.append(token)
            cursor += 1
            continue

        matched = False
        # Frasa dicoba dari yang terpanjang supaya "terima kasih" tidak
        # pecah jadi "terima" + "kasih".
        for width in range(len(runs), 1, -1):
            words = [word for word, _ in runs[:width]]
            original = "".join(tokens[cursor : runs[width - 1][1]])
            key = " ".join(word.lower() for word in words)

            phrase_target = PHRASES.get(key, {}).get(target_level)
            phrase_match = None if key in PHRASES else index.get(key)

            if phrase_target and phrase_target.lower() != key:
                emit(
                    Change(
                        original=original,
                        replacement=_match_case(original, phrase_target),
                        source_level=_detect_phrase_level(key),
                        target_level=target_level,
                        meaning="frasa",
                        kind="phrase",
                    )
                )
                output.append(_match_case(original, phrase_target))
                cursor = runs[width - 1][1]
                matched = True
                break
            if phrase_match is not None:
                target_value = getattr(phrase_match.entry, target_level, None)
                if target_value and target_value.lower() != key:
                    emit(
                        Change(
                            original=original,
                            replacement=_match_case(original, target_value),
                            source_level=phrase_match.source_level,
                            target_level=target_level,
                            meaning=getattr(phrase_match.entry, "bahasa_indonesia", ""),
                            kind="phrase",
                        )
                    )
                    output.append(_match_case(original, target_value))
                    cursor = runs[width - 1][1]
                    matched = True
                    break
        if matched:
            continue

        key = _normalise_key(token)

        # 2) Kata dasar (PHRASES satu kata diperlakukan seperti padanan biasa).
        phrase_single = PHRASES.get(key)
        found = index.get(key)
        if found is None and phrase_single is not None:
            target_value = phrase_single.get(target_level)
            if not target_value or target_value.lower() == key:
                output.append(token)
            else:
                replacement = _match_case(token, target_value)
                emit(
                    Change(
                        original=token,
                        replacement=replacement,
                        source_level=_detect_phrase_level(key),
                        target_level=target_level,
                        meaning="frasa",
                    )
                )
                output.append(replacement)
            cursor += 1
            continue
        if found is not None:
            target_value = getattr(found.entry, target_level, None)
            if not target_value or target_value.lower() == key:
                output.append(token)
            else:
                replacement = _match_case(token, target_value)
                emit(
                    Change(
                        original=token,
                        replacement=replacement,
                        source_level=found.source_level,
                        target_level=target_level,
                        meaning=getattr(found.entry, "bahasa_indonesia", ""),
                    )
                )
                output.append(replacement)
            cursor += 1
            continue

        # 3) Kata dasar berpartikel ("lungana" -> "lunga" + "na").
        inflected_hit = inflected.get(key)
        if inflected_hit is not None:
            base, affix = inflected_hit
            base_match = index[base]
            base_target = getattr(base_match.entry, target_level, None)
            if base_target and base_target.lower() != base:
                position = "prefix" if _affix_of(key, base) in PREFIXES else "suffix"
                if position == "prefix":
                    replacement_core = f"{affix} {base_target}"
                else:
                    replacement_core = f"{base_target}{affix}"
                if replacement_core.lower() != key:
                    emit(
                        Change(
                            original=token,
                            replacement=_match_case(token, replacement_core),
                            source_level=base_match.source_level,
                            target_level=target_level,
                            meaning=getattr(base_match.entry, "bahasa_indonesia", ""),
                            kind=f"{position}_affix",
                        )
                    )
                    output.append(_match_case(token, replacement_core))
                    cursor += 1
                    continue

        # 4) Kesalahan ketik — tebang terdekat, tandai confidence rendah.
        if fix_typos and key not in STOPWORDS:
            guess, ratio = _best_guess(key, list(index))
            if guess is not None:
                guess_match = index[guess]
                guess_target = getattr(guess_match.entry, target_level, None)
                if guess_target and guess_target.lower() != key:
                    emit(
                        Change(
                            original=token,
                            replacement=_match_case(token, guess_target),
                            source_level=guess_match.source_level,
                            target_level=target_level,
                            meaning=getattr(guess_match.entry, "bahasa_indonesia", ""),
                            confidence=ratio,
                            kind="typo",
                        )
                    )
                    output.append(_match_case(token, guess_target))
                    cursor += 1
                    continue

        if key not in STOPWORDS and key not in KNOWN_JAVANESE:
            unknown.append(token)
        output.append(token)
        cursor += 1

    corrected = "".join(output)
    if include_unknown and unknown:
        changes.append(
            {
                "original": ", ".join(unknown),
                "replacement": None,
                "source_level": "-",
                "target_level": target_level,
                "meaning": "tembung ora ana ing kamus",
                "confidence": 0.0,
                "kind": "unknown",
            }
        )
    return corrected, changes


def _detect_phrase_level(phrase: str) -> str:
    entry = PHRASES.get(_normalise_key(phrase))
    if not entry:
        return "ngoko"
    for level in LEVELS:
        if level in entry:
            return level
    return "ngoko"


def lint_text(
    text: str,
    entries: Iterable[Any],
    *,
    max_changes: int = 50,
) -> dict[str, Any]:
    """Analisis gaya: ringkasan tingkat basa yang terdeteksi & anjuran.

    Tidak mengubah teks; mengembalikan laporan yang bisa ditampilkan sebagai
    umpan balik di UI korektor.
    """
    index = build_index(entries)
    tokens = [t for t in TOKEN_PATTERN.findall(text) if t.strip() and t[:1].isalnum()]

    level_counts = {level: 0 for level in LEVELS}
    known = unknown = 0
    for token in tokens:
        key = _normalise_key(token)
        found = index.get(key)
        if found is not None:
            level_counts[found.source_level] += 1
            known += 1
            continue
        core, affix, _ = split_affix(key)
        if affix and core in index:
            level_counts[index[core].source_level] += 1
            known += 1
            continue
        if key in STOPWORDS or key in KNOWN_JAVANESE:
            known += 1
            continue
        unknown += 1

    dominant = max(level_counts, key=lambda level: level_counts[level])
    suggestions: list[str] = []
    if level_counts["ngoko"] and dominant != "ngoko" and level_counts["ngoko"] > 1:
        suggestions.append(
            "Ana tembung ngoko ing kalimat iki. Ntukerake supaya luwih cumCocok karung "
            "basa sing cocog."
        )
    if level_counts["krama_inggil"] and level_counts["krama_lugu"] > level_counts["krama_inggil"]:
        suggestions.append(
            "Campuran krama inggil lan krama lugu. Pilih siji tingkat supaya "
            "konsisten."
        )
    if unknown:
        suggestions.append(
            f"{unknown} tembung ora ana ing kamus. Jalaranake import dataset utawa "
            "nambahen kawruh basa supaya bisa dicek."
        )
    if known == 0 and tokens:
        suggestions.append("Ora ana tembung sing bisa dicocokake. Coba maneh kalimat iki.")

    return {
        "token_count": len(tokens),
        "known_count": known,
        "unknown_count": unknown,
        "level_counts": level_counts,
        "dominant_level": dominant,
        "consistency": round(known / len(tokens), 3) if tokens else 0.0,
        "suggestions": suggestions[:max_changes],
    }
