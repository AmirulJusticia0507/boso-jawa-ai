"""
Buat ikon PWA (PNG) dari motif kawung yang sama dengan `public/favicon.svg`.

Chrome hanya menerima PNG untuk `icons` di manifest (SVG ditolak), jadi motif
dari SVG digambar ulang di sini memakai Pillow.

Jalankan:  python scripts/generate_pwa_icons.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT_DIR = Path(__file__).resolve().parents[1] / "public"

BG_TOP = (0x3A, 0x14, 0x10)
BG_BOTTOM = (0x5C, 0x1F, 0x1B)
GOLD_DARK = (0xC9, 0xA2, 0x27)
GOLD_MID = (0xD9, 0xB5, 0x45)

# Varian `"rounded"` memakai sudut membulat seperti favicon.svg.
# Varian `"full"` harus bewarna penuh tanpa alpha:
#   - maskable: Chrome memotong ke bentuk apa saja (lingkaran/squircle), jadi
#     sudut transparan akan terlihat seperti lubang.
#   - apple-touch-icon: iOS membulatkan sendiri, alpha di sini bisa tampil hitam.
VARIANTS = {
    "pwa-192.png": (192, "rounded", 1.0),
    "pwa-512.png": (512, "rounded", 1.0),
    "pwa-maskable-512.png": (512, "full", 0.62),
    "apple-touch-icon.png": (180, "full", 1.0),
}


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (
        round(a[0] + (b[0] - a[0]) * t),
        round(a[1] + (b[1] - a[1]) * t),
        round(a[2] + (b[2] - a[2]) * t),
    )


def background(size: int, shape: str):
    """Gradien diagonal gelap; sudut membulat hanya untuk varian `rounded`."""
    img = Image.new("RGB", (size, size), BG_TOP)
    draw = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(size - 1, 1)
        draw.line([(0, y), (size, y)], fill=lerp(BG_TOP, BG_BOTTOM, t))

    if shape == "full":
        return img, None

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=size * 96 / 512, fill=255
    )
    return img, mask


def draw_kawung(img: Image.Image, scale: float) -> None:
    """Gambar motif kawung (4 ellips + titikpusat) di tengah kanvas."""
    draw = ImageDraw.Draw(img)
    size = img.width
    cx = cy = size / 2
    unit = size / 512 * scale  # 1.0 = ukuran persis seperti di SVG

    # Cincin luar dekoratif.
    draw.ellipse(
        [cx - 180 * unit, cy - 180 * unit, cx + 180 * unit, cy + 180 * unit],
        outline=GOLD_DARK + (int(0.3 * 255),),
        width=max(1, round(3 * unit)),
    )
    draw.ellipse(
        [cx - 200 * unit, cy - 200 * unit, cx + 200 * unit, cy + 200 * unit],
        outline=GOLD_DARK + (int(0.2 * 255),),
        width=max(1, round(1.5 * unit)),
    )

    # Titik pusat.
    draw.ellipse(
        [cx - 16 * unit, cy - 16 * unit, cx + 16 * unit, cy + 16 * unit],
        fill=GOLD_DARK,
    )

    # Empat kelopak: atas, kanan, bawah, kiri.
    petals = [(0, -72, 48, 64), (72, 0, 64, 48), (0, 72, 48, 64), (-72, 0, 64, 48)]
    for dx, dy, rx, ry in petals:
        px, py = cx + dx * unit, cy + dy * unit
        draw.ellipse(
            [px - rx * unit, py - ry * unit, px + rx * unit, py + ry * unit],
            outline=GOLD_MID + (int(0.9 * 255),),
            width=max(1, round(5 * unit)),
        )
        # Rincian kelopak dalam (semi transparan → komposit manual ke RGB).
        ir = 20 * unit
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(overlay).ellipse(
            [px - ir, py - ir, px + ir, py + ir], fill=GOLD_DARK + (102,)
        )
        img.paste(overlay.convert("RGB"), (0, 0), overlay.split()[3])


def render(name: str, size: int, shape: str, scale: float) -> None:
    img, mask = background(size, shape)
    # Mode RGBA supaya komposit semi-transparan di dalam draw_kawung benar.
    img = img.convert("RGBA")
    draw_kawung(img, scale)

    out = img.convert("RGB")
    if mask is not None:
        out.putalpha(mask)

    dest = OUT_DIR / name
    out.save(dest, "PNG", optimize=True)
    print(f"{dest.name}: {dest.stat().st_size} bytes ({out.width}x{out.height})")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, (size, shape, scale) in VARIANTS.items():
        render(name, size, shape, scale)


if __name__ == "__main__":
    main()
