"""Engine transliterasi Latin <-> Aksara Jawa.

Acuan aturan: docs/RULES_AKSARA.md

Konvensi input Latin:
- ``a`` = vokal bawaan carakan (tanpa sandhangan)
- ``i`` = wulu, ``u`` = suku, ``o`` = taling-tarung
- ``e`` = pepet (e, [seperti pada "sega"])
- ``é`` (atau ``è``) = taling (e, [seperti pada "saté"])
- Vokal di awal suku kata memakai ``ha`` + sandhangan (mis. "ing" -> h+i+ng)
- Konsonan mati di tengah kata -> pasangan (pangkon + carakan berikutnya)
- Konsonan mati di akhir kata -> panyigeg (h/r/ng) atau pangkon
"""

from typing import Literal

# --- Konstanta aksara -------------------------------------------------------

PANGKON = "꧀"
CECAK = "ꦁ"  # -ng akhir
WIGNYAN = "ꦃ"  # -h akhir
LAYAR = "ꦂ"  # -r akhir
WULU = "ꦶ"  # i
SUKU = "ꦸ"  # u
TALING = "ꦺ"  # é
TARUNG = "ꦴ"  # …o (pasangan taling)
PEPET = "ꦼ"  # e
HA = "ꦲ"

CARAKAN: dict[str, str] = {
    # Dwigraf didahulukan saat tokenisasi (lihat _tokenize).
    "dh": "ꦝ",
    "th": "ꦛ",
    "ny": "ꦚ",
    "ng": "ꦔ",
    "h": "ꦲ",
    "n": "ꦤ",
    "c": "ꦕ",
    "r": "ꦫ",
    "k": "ꦏ",
    "d": "ꦢ",
    "t": "ꦠ",
    "s": "ꦱ",
    "w": "ꦮ",
    "l": "ꦭ",
    "p": "ꦥ",
    "j": "ꦗ",
    "y": "ꦪ",
    "m": "ꦩ",
    "g": "ꦒ",
    "b": "ꦧ",
}

# 'q' baku dipetakan ke 'ka'; huruf asing lain dipertahankan apa adanya.
FOREIGN_MAP: dict[str, str] = {"q": "k"}

VOWELS = {"a", "i", "u", "e", "é", "è", "o"}

REVERSE_CARAKAN: dict[str, str] = {v: k for k, v in CARAKAN.items()}

Direction = Literal["latin_to_aksara", "aksara_to_latin"]


# --- Latin -> Aksara --------------------------------------------------------


def _tokenize(word: str) -> list[tuple[str, str]]:
    """Pecah kata menjadi token ('con', unit) / ('vow', vokal)."""
    tokens: list[tuple[str, str]] = []
    i = 0
    while i < len(word):
        two = word[i : i + 2]
        if two in CARAKAN:
            tokens.append(("con", two))
            i += 2
        elif word[i] in CARAKAN:
            tokens.append(("con", word[i]))
            i += 1
        elif word[i] in VOWELS:
            tokens.append(("vow", "é" if word[i] == "è" else word[i]))
            i += 1
        else:
            # Huruf asing / tak dikenal: teruskan apa adanya.
            mapped = FOREIGN_MAP.get(word[i], word[i])
            if mapped in CARAKAN:
                tokens.append(("con", mapped))
            else:
                tokens.append(("other", word[i]))
            i += 1
    return tokens


def _apply_vowel(base: str, vowel: str, include_sandhangan: bool) -> str:
    if vowel == "a" or not include_sandhangan:
        return base
    if vowel == "i":
        return base + WULU
    if vowel == "u":
        return base + SUKU
    if vowel == "é":
        return base + TALING
    if vowel == "o":
        return base + TALING + TARUNG
    if vowel == "e":
        return base + PEPET
    return base


def _standalone_vowel(vowel: str, include_sandhangan: bool) -> str:
    """Vokal di awal suku kata memakai 'ha' + sandhangan."""
    if vowel == "a":
        return HA
    return _apply_vowel(HA, vowel, include_sandhangan)


def latin_to_aksara(text: str, include_sandhangan: bool = True) -> tuple[str, list[str]]:
    """Ubah teks Latin menjadi Aksara Jawa.

    Mengembalikan (hasil_aksara, rules_applied).
    """
    rules: list[str] = []

    def note(rule: str) -> None:
        if rule not in rules:
            rules.append(rule)

    out: list[str] = []
    tokens = _tokenize(text.lower())
    i = 0
    while i < len(tokens):
        kind, val = tokens[i]
        if kind == "other":
            if val.isalnum():
                note(f"Karakter '{val}' dipertahankan")
            out.append(val)
            i += 1
            continue
        if kind == "vow":
            out.append(_standalone_vowel(val, include_sandhangan))
            i += 1
            continue
        # kind == "con"
        nxt = tokens[i + 1] if i + 1 < len(tokens) else (None, None)
        base = CARAKAN[val]
        if nxt[0] == "vow":
            syllable = val + nxt[1]
            out.append(_apply_vowel(base, nxt[1], include_sandhangan))
            if nxt[1] == "o" and include_sandhangan:
                note(f"Taling Tarung pada '{syllable}'")
            i += 2
        elif nxt[0] == "con":
            # Konsonan mati di tengah kata -> pasangan konsonan berikutnya.
            out.append(base + PANGKON)
            note(f"Pasangan '{nxt[1]}' pada '{val}{nxt[1]}'")
            i += 1
        else:
            # Konsonan mati di akhir kata -> panyigeg / pangkon.
            if val == "h":
                out.append(WIGNYAN)
                note("Wignyan pada 'h' mati")
            elif val == "r":
                out.append(LAYAR)
                note("Layar pada 'r' mati")
            elif val == "ng":
                out.append(CECAK)
                note("Cecak pada 'ng'")
            else:
                out.append(base + PANGKON)
                note(f"Pangkon pada '{val}' mati")
            i += 1
    return "".join(out), rules


# --- Aksara -> Latin --------------------------------------------------------


def aksara_to_latin(text: str) -> tuple[str, list[str]]:
    """Ubah teks Aksara Jawa menjadi Latin (konvensi sama seperti input).

    Mengembalikan (hasil_latin, rules_applied).
    """
    rules: list[str] = []

    def note(rule: str) -> None:
        if rule not in rules:
            rules.append(rule)

    out: list[str] = []
    pending: str | None = None  # konsonan latin yang belum diberi vokal
    # pending "" (string kosong) = 'ha' pembawa vokal mandiri (bunyi 'h'
    # diabaikan, mis. h+i -> "i" bukan "hi").
    at_word_start = True

    def flush_with(vowel: str) -> None:
        nonlocal pending
        if pending is not None:
            out.append(pending + vowel)
            pending = None

    i = 0
    while i < len(text):
        ch = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ""
        if ch in REVERSE_CARAKAN:
            if pending is not None:
                out.append(pending + "a")  # vokal bawaan 'a'
            latin = REVERSE_CARAKAN[ch]
            if latin == "h" and (
                nxt in (WULU, SUKU, TALING, TARUNG, PEPET) or at_word_start
            ):
                pending = ""  # 'ha' pembawa vokal, bukan konsonan 'h'
                if at_word_start:
                    note("Vokal mandiri di awal kata")
            else:
                pending = latin
            at_word_start = False
        elif ch == WULU:
            flush_with("i")
        elif ch == SUKU:
            flush_with("u")
        elif ch == TALING:
            if nxt == TARUNG:
                flush_with("o")
                note("Taling Tarung pada 'o'")
                i += 1
            else:
                flush_with("é")
        elif ch == TARUNG:
            flush_with("o")
        elif ch == PEPET:
            flush_with("e")
        elif ch == CECAK:
            if pending is not None:
                out.append(pending + "a" + "ng")  # vokal bawaan + -ng
                pending = None
            else:
                out.append("ng")
            note("Cecak pada 'ng'")
        elif ch == WIGNYAN:
            if pending is not None:
                out.append(pending + "a" + "h")  # vokal bawaan + -h
                pending = None
            else:
                out.append("h")
        elif ch == LAYAR:
            if pending is not None:
                out.append(pending + "a" + "r")  # vokal bawaan + -r
                pending = None
            else:
                out.append("r")
        elif ch == PANGKON:
            if pending is not None:
                out.append(pending)  # konsonan mati
                pending = None
                note("Pangkon / pasangan")
        else:
            if pending is not None:
                out.append(pending + "a")
                pending = None
            out.append(ch)
            at_word_start = True
        i += 1
    if pending is not None:
        out.append(pending + "a")
    return "".join(out), rules


# --- API umum ---------------------------------------------------------------


def transliterate(
    text: str, direction: Direction = "latin_to_aksara", include_sandhangan: bool = True
) -> tuple[str, list[str]]:
    if direction == "latin_to_aksara":
        return latin_to_aksara(text, include_sandhangan)
    if direction == "aksara_to_latin":
        return aksara_to_latin(text)
    raise ValueError(f"direction tidak dikenal: {direction}")
