"""Cari karakter CJK/Hangul yang tidak sengaja muncul di source.

Ditemukan beberapa kali ada kata Mandarin/Korea yang bocor ke dalam komentar
Indonesia. Skrip ini dipakai sebagai penjaga setelah menulis file.

Jalankan:  python scripts/check_stray_cjk.py <path> [<path> ...]
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# Aksara Jawa (ꦀ-꧿) itu memang disengaja di proyek ini, jadi dikecualikan.
STRAY = re.compile(r"[\u3000-\u9fff\uac00-\ud7af]")
ALLOWED_FILES = {"index.html"}  # belum dipakai, sisakan untuk kebutuhan nanti

# Console Windows secara bawaan memakai cp1252 dan tidak bisa mencetak
# karakter CJK; memaksa UTF-8 supaya pesan tidak ikut meledak.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def main(argv: list[str]) -> int:
    if not argv:
        print("pemakaian: python scripts/check_stray_cjk.py <path> [...]")
        return 2

    failures = 0
    for raw in argv:
        path = Path(raw)
        files = [path] if path.is_file() else sorted(path.rglob("*"))
        for f in files:
            if not f.is_file() or f.suffix not in {".ts", ".tsx", ".js", ".mjs", ".html", ".css", ".json", ".yaml", ".yml"}:
                continue
            text = f.read_text(encoding="utf-8", errors="replace")
            for lineno, line in enumerate(text.splitlines(), start=1):
                found = STRAY.findall(line)
                if found:
                    failures += 1
                    print(f"{f}:{lineno}: {''.join(found)}  ->  {line.strip()[:100]}")
    if failures:
        print(f"\nGAGAL: {failures} baris mengandung karakter CJK/Hangel yang tidak disengaja.")
        return 1
    print("Bersih: tidak ada karakter CJK/Hangul yang tidak disengaja.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
