#!/usr/bin/env python3
"""Generate themed slot-crate art from the Hirnkiste masters.

Hirnkiste (lootbox_closed / lootbox_open) stays untouched. Slot crates keep
the same chest silhouette, recolored to their accent, plus a unique emblem.
"""

from __future__ import annotations

import colorsys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path("/Users/wladi/development/ratepanik/public/rp/schleimi")
CLOSED = ROOT / "lootbox_closed.png"
OPEN = ROOT / "lootbox_open.png"

BLACK = (18, 18, 22, 255)
WHITE = (255, 255, 255, 255)

THEMES = {
    "form": {
        "lid": (110, 176, 255),
        "body": (214, 232, 255),
        "slime": (90, 150, 240),
        "accent": (126, 182, 255),
        "gold": (255, 214, 90),
    },
    "face": {
        "lid": (214, 140, 255),
        "body": (255, 214, 236),
        "slime": (255, 132, 186),
        "accent": (201, 137, 255),
        "gold": (255, 214, 90),
    },
    "deko": {
        "lid": (90, 214, 150),
        "body": (214, 255, 228),
        "slime": (255, 196, 70),
        "accent": (111, 207, 151),
        "gold": (255, 214, 90),
    },
}


def classify(r: int, g: int, b: int, a: int) -> str | None:
    if a < 12:
        return None
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    if lum < 48:
        return "black"
    if g > r + 18 and g > b + 18 and g > 130:
        return "slime"
    if r > 200 and g > 175 and b < 220 and (r - b) > 18:
        return "body"
    if b > g + 8 and b > 150 and r > 90:
        return "lid"
    if abs(r - g) < 18 and abs(g - b) < 18 and lum > 90:
        return "metal"
    return "other"


def tint_keep_value(pixel: tuple[int, int, int], target: tuple[int, int, int]) -> tuple[int, int, int]:
    r, g, b = pixel
    src_h, src_s, src_v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    tgt_h, tgt_s, tgt_v = colorsys.rgb_to_hsv(target[0] / 255, target[1] / 255, target[2] / 255)
    h = tgt_h
    s = min(1.0, src_s * 0.35 + tgt_s * 0.65)
    v = src_v * 0.55 + tgt_v * 0.45
    nr, ng, nb = colorsys.hsv_to_rgb(h, s, max(0.08, min(1.0, v)))
    return int(nr * 255), int(ng * 255), int(nb * 255)


def strip_grid(im: Image.Image) -> Image.Image:
    """Drop baked transparency-grid pixels from the Hirnkiste open master."""
    im = im.convert("RGBA")
    pix = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if a < 8:
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            sat = (mx - mn) / mx if mx else 0.0
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            # Light checker squares: near-neutral, bright, not gold/slime.
            if sat < 0.08 and 160 < lum < 250:
                pix[x, y] = (0, 0, 0, 0)
    return im


def recolor(src: Image.Image, theme: dict) -> Image.Image:
    src = src.convert("RGBA")
    out = src.copy()
    pix = src.load()
    dest = out.load()
    w, h = src.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            kind = classify(r, g, b, a)
            if kind == "lid":
                nr, ng, nb = tint_keep_value((r, g, b), theme["lid"])
                dest[x, y] = (nr, ng, nb, a)
            elif kind == "body":
                nr, ng, nb = tint_keep_value((r, g, b), theme["body"])
                dest[x, y] = (nr, ng, nb, a)
            elif kind == "slime":
                nr, ng, nb = tint_keep_value((r, g, b), theme["slime"])
                dest[x, y] = (nr, ng, nb, a)
            elif kind == "metal":
                nr, ng, nb = tint_keep_value((r, g, b), theme["gold"])
                dest[x, y] = (nr, ng, nb, a)
    return out


def oval(draw: ImageDraw.ImageDraw, xy, fill, outline=BLACK, width=8):
    draw.ellipse(xy, fill=fill, outline=outline, width=width)


def draw_face_emblem(layer: Image.Image, open_chest: bool) -> None:
    d = ImageDraw.Draw(layer)
    cx, cy = (256, 318) if not open_chest else (256, 300)
    # plate
    oval(d, [cx - 78, cy - 62, cx + 78, cy + 70], WHITE, BLACK, 9)
    oval(d, [cx - 64, cy - 48, cx + 64, cy + 56], (255, 236, 248), BLACK, 6)
    # eyes
    oval(d, [cx - 38, cy - 18, cx - 10, cy + 22], BLACK, BLACK, 1)
    oval(d, [cx + 10, cy - 18, cx + 38, cy + 22], BLACK, BLACK, 1)
    oval(d, [cx - 30, cy - 12, cx - 18, cy], WHITE, WHITE, 1)
    oval(d, [cx + 18, cy - 12, cx + 30, cy], WHITE, WHITE, 1)
    # grin
    d.arc([cx - 36, cy + 4, cx + 36, cy + 48], 15, 165, fill=BLACK, width=9)


def draw_form_emblem(layer: Image.Image, open_chest: bool) -> None:
    d = ImageDraw.Draw(layer)
    cy = 128 if open_chest else 118
    # triangle
    tri = [(256, cy - 8), (318, cy + 86), (194, cy + 86)]
    d.polygon([(p[0] + 5, p[1] + 7) for p in tri], fill=(0, 0, 0, 80))
    d.polygon(tri, fill=(255, 214, 70), outline=BLACK)
    d.line(tri + [tri[0]], fill=BLACK, width=8)
    # square
    sq = [168, cy + 54, 228, cy + 114]
    d.rounded_rectangle([sq[0] + 5, sq[1] + 7, sq[2] + 5, sq[3] + 7], radius=6, fill=(0, 0, 0, 80))
    d.rounded_rectangle(sq, radius=6, fill=(255, 122, 154), outline=BLACK, width=8)
    # circle
    oval(d, [284, cy + 54, 352, cy + 122], (111, 207, 151), BLACK, 8)


def draw_deko_emblem(layer: Image.Image, open_chest: bool) -> None:
    d = ImageDraw.Draw(layer)
    cy = 312 if not open_chest else 292
    # glasses
    oval(d, [186, cy - 38, 246, cy + 24], (255, 255, 255, 210), BLACK, 8)
    oval(d, [266, cy - 38, 326, cy + 24], (255, 255, 255, 210), BLACK, 8)
    d.line([(246, cy - 8), (266, cy - 8)], fill=BLACK, width=8)
    # bowtie
    by = cy + 48
    left = [(196, by - 22), (248, by), (196, by + 22)]
    right = [(316, by - 22), (264, by), (316, by + 22)]
    d.polygon(left, fill=(255, 92, 92), outline=BLACK)
    d.polygon(right, fill=(255, 92, 92), outline=BLACK)
    d.line(left + [left[0]], fill=BLACK, width=6)
    d.line(right + [right[0]], fill=BLACK, width=6)
    oval(d, [240, by - 16, 272, by + 16], (255, 196, 70), BLACK, 6)
    # sparkles
    for x, y in ((150, 150), (360, 168), (132, 260)):
        d.polygon([(x, y - 12), (x + 4, y - 2), (x + 12, y), (x + 4, y + 2), (x, y + 12), (x - 4, y + 2), (x - 12, y), (x - 4, y - 2)], fill=WHITE, outline=BLACK)


def draw_emblem(kind: str, size: tuple[int, int], open_chest: bool) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    if kind == "face":
        draw_face_emblem(layer, open_chest)
    elif kind == "form":
        draw_form_emblem(layer, open_chest)
    else:
        draw_deko_emblem(layer, open_chest)
    return layer


def save_set(img: Image.Image, stem: str) -> None:
    img.save(ROOT / f"{stem}.png", "PNG", optimize=True)
    for size in (256, 128):
        img.resize((size, size), Image.LANCZOS).save(ROOT / f"{stem}_{size}.png", "PNG", optimize=True)
    print(f"  {stem}.png  {img.size[0]}×{img.size[1]}")


def build(kind: str) -> None:
    theme = THEMES[kind]
    closed = recolor(strip_grid(Image.open(CLOSED)), theme)
    opened = recolor(strip_grid(Image.open(OPEN)), theme)
    closed = Image.alpha_composite(closed, draw_emblem(kind, closed.size, open_chest=False))
    opened = Image.alpha_composite(opened, draw_emblem(kind, opened.size, open_chest=True))
    save_set(closed, f"lootbox_{kind}_closed")
    save_set(opened, f"lootbox_{kind}_open")


def main() -> None:
    print("Generating slot crate art")
    for kind in ("form", "face", "deko"):
        build(kind)


if __name__ == "__main__":
    main()
