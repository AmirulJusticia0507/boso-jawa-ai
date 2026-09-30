"""Verifikasi service worker hasil build.

Memeriksa hal yang tidak terlihat dari log `vite build`:
  - service worker benar-benar ada dan mereferensikan `index.html`;
  - daftar precache lengkap (app shell) tanpa entri kembar;
  - `navigateFallback` memakai `index.html` dan mengecualikan `/api/`;
  - manifest memuat field yang diwajibkan Chrome untuk install.

Jalankan setelah `pnpm build`:  python scripts/verify_pwa.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

DIST = Path(__file__).resolve().parents[1] / "dist"

REQUIRED_MANIFEST_FIELDS = (
    "name",
    "short_name",
    "start_url",
    "scope",
    "display",
    "theme_color",
    "background_color",
    "icons",
)
REQUIRED_ICON_SIZES = {"192x192", "512x512"}


def extract_array(text: str, marker: str) -> str | None:
    """Ambil isi array JS setelah `marker`, dengan bracket-matching."""
    start = text.find(marker)
    if start < 0:
        return None
    i = start + len(marker)
    if text[i] != "[":
        return None
    depth = 0
    in_str = False
    quote = ""
    escape = False
    while i < len(text):
        ch = text[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                in_str = False
        elif ch in "\"'`":
            in_str = True
            quote = ch
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return text[start + len(marker) : i + 1]
        i += 1
    return None


def check(label: str, ok: bool, detail: str = "") -> bool:
    print(f"  [{'OK ' if ok else 'FAIL'}] {label}{(' — ' + detail) if detail else ''}")
    return ok


def main() -> int:
    failures = 0

    sw_path = DIST / "sw.js"
    print("service worker")
    if not sw_path.exists():
        print("  [FAIL] dist/sw.js tidak ada")
        return 1
    sw = sw_path.read_text(encoding="utf-8")
    failures += not check("dist/sw.js ada", True, f"{sw_path.stat().st_size} B")
    failures += not check("skipWaiting() dipanggil", "skipWaiting()" in sw)
    failures += not check("clientsClaim() dipanggil", "clientsClaim()" in sw)

    arr = extract_array(sw, "precacheAndRoute(")
    if arr is None:
        print("  [FAIL] tidak bisa membaca daftar precache")
        return 1
    urls = re.findall(r'url:\s*"([^"]+)"', arr)
    counts: dict[str, int] = {}
    for u in urls:
        counts[u] = counts.get(u, 0) + 1
    dupes = {u: c for u, c in counts.items() if c > 1}

    print("precache")
    failures += not check(
        "app shell ter-precache",
        "index.html" in counts,
        f"{len(urls)} entri, {len(counts)} unik",
    )
    failures += not check("tidak ada entri kembar", not dupes, str(dupes or ""))
    assets = [u for u in counts if u.startswith("assets/")]
    failures += not check("bundle JS/CSS ter-precache", len(assets) >= 5, f"{len(assets)} file")

    print("navigasi offline (SPA)")
    failures += not check(
        "NavigationRoute terpasang", "NavigationRoute" in sw
    )
    failures += not check(
        'fallback ke "index.html"', 'createHandlerBoundToURL("index.html")' in sw
    )
    failures += not check("/api/ dikecualikan dari fallback", "/^\\/api\\//" in sw)

    print("manifest")
    mf_path = DIST / "manifest.webmanifest"
    if not mf_path.exists():
        print("  [FAIL] dist/manifest.webmanifest tidak ada")
        return 1
    mf = json.loads(mf_path.read_text(encoding="utf-8"))
    for field in REQUIRED_MANIFEST_FIELDS:
        failures += not check(f"field `{field}` ada", field in mf)
    failures += not check(
        "display=standalone", mf.get("display") == "standalone", mf.get("display", "")
    )
    failures += not check(
        "start_url relatif ke root", str(mf.get("start_url", "")).startswith("/")
    )

    icons = mf.get("icons", [])
    sizes = {i.get("sizes") for i in icons}
    failures += not check(
        "ikon 192 & 512 ada", REQUIRED_ICON_SIZES <= sizes, str(sorted(sizes))
    )
    failures += not check(
        "ada ikon maskable", any(i.get("purpose") == "maskable" for i in icons)
    )
    failures += not check(
        "semua ikon bertipe PNG",
        all(i.get("type") == "image/png" for i in icons),
    )
    for icon in icons:
        src = icon.get("src", "").lstrip("/")
        exists = (DIST / src).exists()
        failures += not check(f"berkas ikon {src} ada", exists)

    html = (DIST / "index.html").read_text(encoding="utf-8")
    real = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    failures += not check(
        "tepat satu <link rel=manifest>", len(re.findall(r'<link[^>]+rel="manifest"', real)) == 1
    )
    failures += not check(
        "apple-touch-icon menunjuk PNG",
        'rel="apple-touch-icon"' in real and "apple-touch-icon.png" in real,
    )

    print()
    if failures:
        print(f"GAGAL: {failures} pemeriksaan tidak lolos.")
        return 1
    print("Semua pemeriksaan PWA lolos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
