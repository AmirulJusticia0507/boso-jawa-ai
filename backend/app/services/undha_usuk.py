"""Transparent word-level conversion between Javanese speech levels."""

import re
from collections.abc import Iterable
from typing import Any

LEVELS = ("ngoko", "krama_lugu", "krama_inggil")
TOKEN_PATTERN = re.compile(r"\w+|[^\w\s]+|\s+", flags=re.UNICODE)


def _match_case(source: str, replacement: str) -> str:
    if source.isupper():
        return replacement.upper()
    if source[:1].isupper():
        return replacement[:1].upper() + replacement[1:]
    return replacement


def correct_sentence(
    text: str, target_level: str, entries: Iterable[Any]
) -> tuple[str, list[dict[str, str]]]:
    if target_level not in LEVELS:
        raise ValueError(f"Tingkat basa tidak dikenal: {target_level}")

    lookup: dict[str, tuple[Any, str]] = {}
    for entry in entries:
        for level in LEVELS:
            value = getattr(entry, level, None)
            if value:
                lookup.setdefault(value.lower(), (entry, level))

    output: list[str] = []
    changes: list[dict[str, str]] = []
    for token in TOKEN_PATTERN.findall(text):
        found = lookup.get(token.lower())
        if found is None:
            output.append(token)
            continue
        entry, source_level = found
        target = getattr(entry, target_level, None)
        if not target or target.lower() == token.lower():
            output.append(token)
            continue
        replacement = _match_case(token, target)
        output.append(replacement)
        changes.append(
            {
                "original": token,
                "replacement": replacement,
                "source_level": source_level,
                "target_level": target_level,
                "meaning": entry.bahasa_indonesia,
            }
        )
    return "".join(output), changes
