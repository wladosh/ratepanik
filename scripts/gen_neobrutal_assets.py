#!/usr/bin/env python3
"""Generate NeoBrutalism-style assets for Ratepanik Tranche 1.

Style: flat solid fills, thick black outlines, hard drop-shadows, RGBA transparent.
All masters rendered at 4× the largest output then downscaled (LANCZOS) for
clean antialiasing and multi-KB file sizes.
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

OUT = "/workspace/public/rp"
os.makedirs(OUT, exist_ok=True)

BLACK = (0, 0, 0, 255)
SHADOW = (0, 0, 0, 140)
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

PURPLE_LIGHT = (200, 170, 230, 255)
PURPLE_MED = (160, 120, 210, 255)
PINK = (240, 160, 180, 255)
PEACH = (245, 195, 150, 255)
LAVENDER = (190, 170, 220, 255)
GOLD = (255, 215, 50, 255)
GOLD_DARK = (220, 180, 30, 255)
GREEN_MINT = (140, 220, 180, 255)
BLUE_LIGHT = (140, 190, 240, 255)
CORAL = (245, 140, 130, 255)
CREAM = (255, 245, 225, 255)
YELLOW_BRAIN = (255, 220, 80, 255)
PURPLE_XP = (180, 130, 230, 255)
DARK_INDIGO = (61, 43, 107, 255)
WARM_BROWN = (160, 120, 80, 255)
TEAL = (100, 200, 200, 255)

OW_FACTOR = 0.035
SHADOW_FACTOR = 0.035


def ow(size):
    return max(3, int(size * OW_FACTOR))


def soff(size):
    return max(3, int(size * SHADOW_FACTOR))


def rr(draw, bbox, radius, fill, ol=BLACK, olw=2):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=ol, width=olw)


def circ(draw, cx, cy, r, fill, ol=BLACK, olw=2):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill, outline=ol, width=olw)


def shadow_circ(draw, cx, cy, r, off):
    draw.ellipse([cx - r + off, cy - r + off, cx + r + off, cy + r + off], fill=SHADOW)


def shadow_rr(draw, bbox, off, radius=0):
    x0, y0, x1, y1 = bbox
    sb = [x0 + off, y0 + off, x1 + off, y1 + off]
    if radius:
        draw.rounded_rectangle(sb, radius=radius, fill=SHADOW)
    else:
        draw.rectangle(sb, fill=SHADOW)


def save(img, target_size, path):
    out = img.resize((target_size, target_size), Image.LANCZOS)
    out.save(path, "PNG", optimize=True)
    sz = os.path.getsize(path)
    print(f"  {os.path.basename(path):45s}  {target_size:4d}×{target_size:<4d}  {sz:>7,} B")
    return sz


def bold_font(size):
    for p in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]:
        try:
            return ImageFont.truetype(p, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


# ===========================================================================
# 1. CREATE ROOM — open door + plus sign
# ===========================================================================
def gen_create_room(S=1024):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)

    # Door frame outer rect
    fx, fy = int(S * 0.10), int(S * 0.04)
    fw, fh = int(S * 0.62), int(S * 0.92)
    frame = [fx, fy, fx + fw, fy + fh]
    shadow_rr(d, frame, so * 2, int(S * 0.04))
    rr(d, frame, int(S * 0.04), WHITE, BLACK, w)

    # Door panel
    pad = int(S * 0.04)
    door = [fx + pad, fy + pad, fx + fw - pad, fy + fh - pad]
    rr(d, door, int(S * 0.03), PURPLE_LIGHT, BLACK, w)

    # Door cross panel lines (decorative)
    mid_x = (door[0] + door[2]) // 2
    mid_y = (door[1] + door[3]) // 2
    d.line([(door[0], mid_y), (door[2], mid_y)], fill=BLACK, width=w // 2)
    d.line([(mid_x, door[1]), (mid_x, door[3])], fill=BLACK, width=w // 2)

    # Door knob
    kx = door[2] - int(S * 0.08)
    ky = mid_y + int(S * 0.05)
    shadow_circ(d, kx, ky, int(S * 0.035), so)
    circ(d, kx, ky, int(S * 0.035), PEACH, BLACK, w)

    # Hinges
    for hy_frac in [0.25, 0.65]:
        hy = int(fy + fh * hy_frac)
        hinge_rect = [door[0] - int(S * 0.015), hy - int(S * 0.025),
                       door[0] + int(S * 0.015), hy + int(S * 0.025)]
        d.rectangle(hinge_rect, fill=WARM_BROWN, outline=BLACK, width=max(2, w // 3))

    # Plus sign (large, top-right)
    pcx = fx + fw + int(S * 0.17)
    pcy = int(S * 0.22)
    arm_len = int(S * 0.14)
    arm_th = int(S * 0.06)

    # Plus shadow
    shadow_rr(d, [pcx - arm_len + so, pcy - arm_th // 2 + so,
                   pcx + arm_len + so, pcy + arm_th // 2 + so], 0, int(S * 0.01))
    shadow_rr(d, [pcx - arm_th // 2 + so, pcy - arm_len + so,
                   pcx + arm_th // 2 + so, pcy + arm_len + so], 0, int(S * 0.01))

    rr(d, [pcx - arm_len, pcy - arm_th // 2, pcx + arm_len, pcy + arm_th // 2],
       int(S * 0.01), CORAL, BLACK, w)
    rr(d, [pcx - arm_th // 2, pcy - arm_len, pcx + arm_th // 2, pcy + arm_len],
       int(S * 0.01), CORAL, BLACK, w)

    # Floor line
    floor_y = fy + fh + int(S * 0.01)
    d.line([(int(S * 0.05), floor_y), (int(S * 0.95), floor_y)], fill=BLACK, width=w)

    return img


# ===========================================================================
# 2. FRIENDS SLIMES — three blob friends with faces
# ===========================================================================
def gen_friends_slimes(S=1024):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)

    blobs = [
        (int(S * 0.25), int(S * 0.65), int(S * 0.20), PEACH),
        (int(S * 0.75), int(S * 0.67), int(S * 0.19), LAVENDER),
        (int(S * 0.50), int(S * 0.40), int(S * 0.23), PINK),
    ]

    for cx, cy, r, color in blobs:
        body_top = cy - int(r * 0.7)
        body_bot = cy + r

        # Shadow blob
        d.ellipse([cx - r + so * 2, body_top + so * 2, cx + r + so * 2, body_bot + so * 2], fill=SHADOW)

        # Main body ellipse
        d.ellipse([cx - r, body_top, cx + r, body_bot], fill=color, outline=BLACK, width=w)

        # Top bumps (slime shape)
        bump_r = int(r * 0.50)
        bumps_drawn = []
        for bx_off in [-int(r * 0.42), 0, int(r * 0.42)]:
            bx = cx + bx_off
            by = body_top + int(r * 0.1)
            # Fill bumps (cover outline between bump and body)
            d.ellipse([bx - bump_r, by - bump_r, bx + bump_r, by + bump_r], fill=color)
            bumps_drawn.append((bx, by, bump_r))

        # Re-draw bump outlines only on top arc
        for bx, by, br in bumps_drawn:
            d.arc([bx - br, by - br, bx + br, by + br], 180, 360, fill=BLACK, width=w)

        # Cheek blush (small circles)
        blush_y = cy + int(r * 0.05)
        blush_r = int(r * 0.10)
        blush_col = tuple(min(255, c + 40) for c in color[:3]) + (120,)
        for bx_off in [-int(r * 0.45), int(r * 0.45)]:
            d.ellipse([cx + bx_off - blush_r, blush_y - blush_r // 2,
                        cx + bx_off + blush_r, blush_y + blush_r // 2], fill=blush_col)

        # Eyes
        eye_y = cy - int(r * 0.1)
        eye_sep = int(r * 0.30)
        eye_r = max(3, int(r * 0.09))
        pupil_r = max(2, int(r * 0.04))
        for ex_off in [-eye_sep, eye_sep]:
            # Eye white
            circ(d, cx + ex_off, eye_y, eye_r, WHITE, BLACK, max(2, w // 3))
            # Pupil
            d.ellipse([cx + ex_off - pupil_r, eye_y - pupil_r,
                        cx + ex_off + pupil_r, eye_y + pupil_r], fill=BLACK)

        # Smile
        smile_y = cy + int(r * 0.12)
        smile_w = int(r * 0.25)
        d.arc([cx - smile_w, smile_y - int(r * 0.12), cx + smile_w, smile_y + int(r * 0.15)],
              0, 180, fill=BLACK, width=max(2, w // 2))

    return img


# ===========================================================================
# 3. STATS CLIPBOARD — clipboard + bar chart + line overlay
# ===========================================================================
def gen_stats_clipboard(S=1024):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)

    cx, cy = S // 2, int(S * 0.54)
    cw, ch = int(S * 0.64), int(S * 0.78)
    clip = [cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2]

    shadow_rr(d, clip, so * 2, int(S * 0.04))
    rr(d, clip, int(S * 0.04), CREAM, BLACK, w)

    # Clip at top
    clip_w = int(S * 0.28)
    clip_h = int(S * 0.07)
    clip_top = cy - ch // 2 - int(clip_h * 0.45)
    clip_rect = [cx - clip_w // 2, clip_top, cx + clip_w // 2, clip_top + clip_h]
    shadow_rr(d, clip_rect, so, int(S * 0.02))
    rr(d, clip_rect, int(S * 0.02), WARM_BROWN, BLACK, w)

    # Grid lines (faint)
    grid_col = (200, 195, 185, 100)
    chart_left = clip[0] + int(S * 0.08)
    chart_right = clip[2] - int(S * 0.08)
    chart_top = cy - ch // 2 + int(S * 0.15)
    chart_bot = cy + ch // 2 - int(S * 0.08)
    for i in range(5):
        gy = chart_top + i * (chart_bot - chart_top) // 4
        d.line([(chart_left, gy), (chart_right, gy)], fill=grid_col, width=max(1, w // 4))

    # Bars
    bar_colors = [PURPLE_MED, BLUE_LIGHT, CORAL, GREEN_MINT]
    bar_heights_frac = [0.55, 0.75, 0.40, 0.90]
    n = len(bar_colors)
    total_w = chart_right - chart_left
    bar_w = int(total_w / (n * 1.6))
    gap = int(total_w - bar_w * n) // (n + 1)

    bar_tops = []
    for i, (color, hf) in enumerate(zip(bar_colors, bar_heights_frac)):
        bx = chart_left + gap + i * (bar_w + gap)
        bh = int((chart_bot - chart_top) * hf)
        bar_rect = [bx, chart_bot - bh, bx + bar_w, chart_bot]
        shadow_rr(d, bar_rect, so, max(2, int(S * 0.01)))
        rr(d, bar_rect, max(2, int(S * 0.01)), color, BLACK, max(2, w // 2))
        bar_tops.append((bx + bar_w // 2, chart_bot - bh))

    # Line chart overlay
    line_fracs = [0.35, 0.60, 0.25, 0.80]
    line_pts = []
    for i in range(n):
        lx = bar_tops[i][0]
        ly = chart_bot - int((chart_bot - chart_top) * line_fracs[i])
        line_pts.append((lx, ly))

    for i in range(len(line_pts) - 1):
        d.line([line_pts[i], line_pts[i + 1]], fill=BLACK, width=max(2, w // 2))

    for px, py in line_pts:
        dot_r = max(3, int(S * 0.018))
        shadow_circ(d, px, py, dot_r, so // 2)
        circ(d, px, py, dot_r, CORAL, BLACK, max(2, w // 3))

    return img


# ===========================================================================
# 4. TROPHY GOLD — cup with handles, star, pedestal
# ===========================================================================
def gen_trophy(S=2048):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)
    cx = S // 2

    # Base platform
    bw, bh = int(S * 0.38), int(S * 0.05)
    by = int(S * 0.88)
    base = [cx - bw // 2, by, cx + bw // 2, by + bh]
    shadow_rr(d, base, so * 2, int(S * 0.01))
    rr(d, base, int(S * 0.01), GOLD_DARK, BLACK, w)

    # Pedestal
    pw, ph = int(S * 0.22), int(S * 0.10)
    ped = [cx - pw // 2, by - ph, cx + pw // 2, by]
    rr(d, ped, int(S * 0.015), GOLD_DARK, BLACK, w)

    # Stem
    sw_, sh_ = int(S * 0.07), int(S * 0.10)
    stem = [cx - sw_ // 2, by - ph - sh_, cx + sw_ // 2, by - ph]
    d.rectangle(stem, fill=GOLD, outline=BLACK, width=w)

    # Stem flare
    flare_w = int(S * 0.14)
    flare_h = int(S * 0.03)
    flare_y = by - ph - sh_
    flare = [cx - flare_w // 2, flare_y - flare_h, cx + flare_w // 2, flare_y]
    rr(d, flare, int(S * 0.005), GOLD_DARK, BLACK, w)

    # Cup body (tapered)
    cup_top = int(S * 0.12)
    cup_bot = flare_y - flare_h
    cup_w_top = int(S * 0.48)
    cup_w_bot = int(S * 0.16)

    cup = [
        (cx - cup_w_top // 2, cup_top),
        (cx + cup_w_top // 2, cup_top),
        (cx + cup_w_bot // 2, cup_bot),
        (cx - cup_w_bot // 2, cup_bot),
    ]
    shadow_pts = [(x + so * 2, y + so * 2) for x, y in cup]
    d.polygon(shadow_pts, fill=SHADOW)
    d.polygon(cup, fill=GOLD, outline=BLACK, width=w)

    # Rim
    rim_h = int(S * 0.035)
    rim_ext = int(S * 0.025)
    rim = [cx - cup_w_top // 2 - rim_ext, cup_top,
           cx + cup_w_top // 2 + rim_ext, cup_top + rim_h]
    rr(d, rim, int(S * 0.008), GOLD_DARK, BLACK, w)

    # Handles
    hr = int(S * 0.075)
    handle_thick = max(4, int(S * 0.025))
    for side in [-1, 1]:
        hx = cx + side * (cup_w_top // 2 + hr - int(S * 0.01))
        hy = cup_top + int(S * 0.10)
        a_start = 270 if side == 1 else 90
        a_end = 90 if side == 1 else 270
        d.arc([hx - hr, hy - hr, hx + hr, hy + hr], a_start, a_end, fill=BLACK, width=handle_thick + w)
        d.arc([hx - hr + handle_thick // 2, hy - hr + handle_thick // 2,
               hx + hr - handle_thick // 2, hy + hr - handle_thick // 2],
              a_start, a_end, fill=GOLD, width=handle_thick)

    # Star
    star_cx = cx
    star_cy = cup_top + int(S * 0.18)
    star_r = int(S * 0.09)
    star_ri = int(S * 0.04)
    pts = []
    for i in range(10):
        a = math.radians(i * 36 - 90)
        r_ = star_r if i % 2 == 0 else star_ri
        pts.append((star_cx + r_ * math.cos(a), star_cy + r_ * math.sin(a)))
    d.polygon(pts, fill=BLACK)

    # Decorative line on cup
    dec_y = cup_top + int(S * 0.30)
    dec_x_left = cx - int(cup_w_top * 0.35)
    dec_x_right = cx + int(cup_w_top * 0.35)
    d.line([(dec_x_left, dec_y), (dec_x_right, dec_y)], fill=GOLD_DARK, width=max(2, w // 2))

    return img


# ===========================================================================
# 5. HIRNCOIN — brain icon on gold coin
# ===========================================================================
def gen_hirncoin(S=576):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)

    cx, cy = S // 2, S // 2
    r = int(S * 0.43)

    shadow_circ(d, cx, cy, r, so * 2)
    circ(d, cx, cy, r, YELLOW_BRAIN, BLACK, w)

    # Inner ring for coin detail
    circ(d, cx, cy, int(r * 0.88), None, GOLD_DARK, max(2, w // 2))

    # Brain: two lobes + fissures
    br = int(r * 0.48)
    lobe_w = max(3, int(S * 0.03))

    # Left lobe outline
    d.arc([cx - br - int(r * 0.08), cy - br, cx + int(r * 0.08), cy + br],
          90, 270, fill=BLACK, width=lobe_w)
    # Right lobe outline
    d.arc([cx - int(r * 0.08), cy - br, cx + br + int(r * 0.08), cy + br],
          270, 90, fill=BLACK, width=lobe_w)

    # Central fissure
    d.line([(cx, cy - br + int(r * 0.08)), (cx, cy + br - int(r * 0.08))],
           fill=BLACK, width=lobe_w)

    # Horizontal sulci (brain folds)
    sulcus_w = max(2, lobe_w * 2 // 3)
    for yf, left in [(-0.25, True), (-0.05, False), (0.15, True), (0.30, False)]:
        sy = cy + int(br * yf)
        if left:
            d.arc([cx - br + int(r * 0.05), sy - int(r * 0.12),
                   cx - int(r * 0.02), sy + int(r * 0.12)],
                  10, 170, fill=BLACK, width=sulcus_w)
        else:
            d.arc([cx + int(r * 0.02), sy - int(r * 0.12),
                   cx + br - int(r * 0.05), sy + int(r * 0.12)],
                  10, 170, fill=BLACK, width=sulcus_w)

    return img


# ===========================================================================
# 6. XP BADGE — rounded-rect with XP text
# ===========================================================================
def gen_xp_badge(S=576):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)

    cx, cy = S // 2, S // 2
    r = int(S * 0.43)
    rad = int(S * 0.12)

    badge = [cx - r, cy - r, cx + r, cy + r]
    shadow_rr(d, badge, so * 2, rad)
    rr(d, badge, rad, PURPLE_XP, BLACK, w)

    # Inner border
    pad = int(S * 0.04)
    rr(d, [cx - r + pad, cy - r + pad, cx + r - pad, cy + r - pad], rad - pad // 2, None, WHITE, max(2, w // 2))

    # XP text with outline
    font_size = int(S * 0.48)
    font = bold_font(font_size)
    bbox = d.textbbox((0, 0), "XP", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw // 2 - bbox[0]
    ty = cy - th // 2 - bbox[1]

    txt_ow = max(3, int(S * 0.025))
    for dx in range(-txt_ow, txt_ow + 1, max(1, txt_ow // 3)):
        for dy in range(-txt_ow, txt_ow + 1, max(1, txt_ow // 3)):
            if dx * dx + dy * dy <= txt_ow * txt_ow:
                d.text((tx + dx, ty + dy), "XP", fill=BLACK, font=font)
    d.text((tx, ty), "XP", fill=WHITE, font=font)

    return img


# ===========================================================================
# 7–11. NAV ICONS (all 288px master → downscale to 72, 48, 24)
# ===========================================================================
def gen_nav_home(S=288):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)
    cx = S // 2

    # House body
    bw = int(S * 0.52)
    bh = int(S * 0.38)
    bx = cx - bw // 2
    by = int(S * 0.50)
    shadow_rr(d, [bx, by, bx + bw, by + bh], so, int(S * 0.02))
    rr(d, [bx, by, bx + bw, by + bh], int(S * 0.02), DARK_INDIGO, BLACK, w)

    # Roof
    roof = [
        (cx, int(S * 0.10)),
        (int(S * 0.08), int(S * 0.52)),
        (int(S * 0.92), int(S * 0.52)),
    ]
    d.polygon([(x + so, y + so) for x, y in roof], fill=SHADOW)
    d.polygon(roof, fill=DARK_INDIGO, outline=BLACK, width=w)

    # Chimney
    chw = int(S * 0.08)
    chh = int(S * 0.15)
    chx = cx + int(S * 0.15)
    chy = int(S * 0.18)
    d.rectangle([chx, chy, chx + chw, chy + chh], fill=DARK_INDIGO, outline=BLACK, width=max(2, w // 2))

    # Door
    dw = int(S * 0.16)
    dh = int(S * 0.22)
    door = [cx - dw // 2, by + bh - dh, cx + dw // 2, by + bh]
    rr(d, door, int(S * 0.015), PURPLE_LIGHT, BLACK, max(2, w // 2))

    # Window
    win_r = int(S * 0.05)
    for wx_off in [-int(S * 0.14), int(S * 0.14)]:
        wy = by + int(bh * 0.30)
        circ(d, cx + wx_off, wy, win_r, YELLOW_BRAIN, BLACK, max(2, w // 2))

    return img


def gen_nav_quiz(S=288):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)
    cx, cy = S // 2, S // 2
    r = int(S * 0.40)

    shadow_circ(d, cx, cy, r, so)
    circ(d, cx, cy, r, DARK_INDIGO, BLACK, w)

    font = bold_font(int(S * 0.52))
    bbox = d.textbbox((0, 0), "?", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw // 2 - bbox[0]
    ty = cy - th // 2 - bbox[1] - int(S * 0.02)
    d.text((tx, ty), "?", fill=WHITE, font=font)

    return img


def gen_nav_play(S=288):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)
    cx, cy = S // 2, S // 2
    r = int(S * 0.40)

    shadow_circ(d, cx, cy, r, so)
    circ(d, cx, cy, r, CORAL, BLACK, w)

    # Play triangle
    tw_ = int(S * 0.28)
    th_ = int(S * 0.36)
    off = int(S * 0.04)
    tri = [
        (cx - tw_ // 2 + off, cy - th_ // 2),
        (cx - tw_ // 2 + off, cy + th_ // 2),
        (cx + tw_ // 2 + off, cy),
    ]
    d.polygon(tri, fill=WHITE, outline=BLACK, width=max(2, w // 2))

    return img


def gen_nav_rank(S=288):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)
    cx = S // 2
    base_y = int(S * 0.90)

    bar_w = int(S * 0.22)
    gap = int(S * 0.03)

    bars = [
        (cx - bar_w - gap, int(S * 0.35), DARK_INDIGO, "2"),
        (cx - bar_w // 2, int(S * 0.55), GOLD, "1"),
        (cx + gap, int(S * 0.25), DARK_INDIGO, "3"),
    ]

    for bx, bh, col, label in bars:
        bar = [bx, base_y - bh, bx + bar_w, base_y]
        shadow_rr(d, bar, so, int(S * 0.01))
        rr(d, bar, int(S * 0.01), col, BLACK, w)
        # Label
        f = bold_font(int(S * 0.12))
        bbox = d.textbbox((0, 0), label, font=f)
        ltw = bbox[2] - bbox[0]
        lth = bbox[3] - bbox[1]
        d.text((bx + bar_w // 2 - ltw // 2 - bbox[0],
                base_y - bh + int(S * 0.02) - bbox[1]),
               label, fill=WHITE, font=f)

    # Small trophy on top of first place
    t_cx = cx
    t_cy = base_y - int(S * 0.55) - int(S * 0.06)
    t_r = int(S * 0.06)
    circ(d, t_cx, t_cy, t_r, GOLD, BLACK, max(2, w // 2))

    # Star inside
    sr = int(S * 0.035)
    sri = int(S * 0.015)
    spts = []
    for i in range(10):
        a = math.radians(i * 36 - 90)
        rr_ = sr if i % 2 == 0 else sri
        spts.append((t_cx + rr_ * math.cos(a), t_cy + rr_ * math.sin(a)))
    d.polygon(spts, fill=BLACK)

    return img


def gen_nav_profile(S=288):
    img = Image.new("RGBA", (S, S), TRANSPARENT)
    d = ImageDraw.Draw(img)
    w = ow(S)
    so = soff(S)
    cx, cy = S // 2, S // 2

    # Head
    head_r = int(S * 0.16)
    head_y = cy - int(S * 0.12)
    shadow_circ(d, cx, head_y, head_r, so)
    circ(d, cx, head_y, head_r, PEACH, BLACK, w)

    # Body/shoulders
    body_w = int(S * 0.48)
    body_top = cy + int(S * 0.08)
    body_h = int(S * 0.35)
    body_rect = [cx - body_w // 2, body_top, cx + body_w // 2, body_top + body_h]
    d.pieslice(
        [cx - body_w // 2, body_top - body_h // 4, cx + body_w // 2, body_top + body_h],
        180, 360, fill=DARK_INDIGO, outline=BLACK, width=w
    )

    # Eyes
    eye_sep = int(S * 0.07)
    eye_r = max(2, int(S * 0.025))
    eye_y = head_y - int(S * 0.01)
    for ex in [-eye_sep, eye_sep]:
        d.ellipse([cx + ex - eye_r, eye_y - eye_r, cx + ex + eye_r, eye_y + eye_r], fill=BLACK)

    return img


# ===========================================================================
# MAIN
# ===========================================================================
def main():
    print("=" * 60)
    print("  NeoBrutalism Asset Generation — Tranche 1")
    print("=" * 60)

    generated = []

    # 1. Create Room (master 1024 → 256)
    print("\n[1] rp_home_create_room_256")
    m = gen_create_room(1024)
    save(m, 256, f"{OUT}/rp_home_create_room_256.png")
    generated.append("rp_home_create_room_256.png")

    # 2. Friends Slimes (master 1024 → 128, 256, 384)
    print("\n[2] rp_icon_friends_slimes_128 set")
    m = gen_friends_slimes(1024)
    for sz, suf in [(128, ".png"), (256, "@2x.png"), (384, "@3x.png")]:
        save(m, sz, f"{OUT}/rp_icon_friends_slimes_128{suf}")
        generated.append(f"rp_icon_friends_slimes_128{suf}")

    # 3. Stats Clipboard (master 1024 → 128, 256, 384)
    print("\n[3] rp_icon_stats_clipboard_128 set")
    m = gen_stats_clipboard(1024)
    for sz, suf in [(128, ".png"), (256, "@2x.png"), (384, "@3x.png")]:
        save(m, sz, f"{OUT}/rp_icon_stats_clipboard_128{suf}")
        generated.append(f"rp_icon_stats_clipboard_128{suf}")

    # 4. Trophy Gold — retired; home/landing use rp_badge_first_win_128@2x.png

    # 5. Hirncoin (master 576 → 24, 48, 72, 96, 144)
    print("\n[5] rp_hirncoin set")
    m = gen_hirncoin(576)
    for sz, name in [
        (24, "rp_hirncoin_24.png"),
        (48, "rp_hirncoin_24@2x.png"),
        (72, "rp_hirncoin_24@3x.png"),
        (48, "rp_hirncoin_48.png"),
        (96, "rp_hirncoin_48@2x.png"),
        (144, "rp_hirncoin_48@3x.png"),
    ]:
        save(m, sz, f"{OUT}/{name}")
        generated.append(name)

    # 6. XP Badge (master 576 → 32, 48, 64, 96, 144)
    print("\n[6] rp_badge_xp set")
    m = gen_xp_badge(576)
    for sz, name in [
        (32, "rp_badge_xp_32.png"),
        (64, "rp_badge_xp_32@2x.png"),
        (96, "rp_badge_xp_32@3x.png"),
        (48, "rp_badge_xp_48.png"),
        (96, "rp_badge_xp_48@2x.png"),
        (144, "rp_badge_xp_48@3x.png"),
    ]:
        save(m, sz, f"{OUT}/{name}")
        generated.append(name)

    # 7-11. Nav Icons (master 288 → 24, 48, 72)
    nav_gens = {
        "home": gen_nav_home,
        "quiz": gen_nav_quiz,
        "play": gen_nav_play,
        "rank": gen_nav_rank,
        "profile": gen_nav_profile,
    }
    print("\n[7-11] Navigation icons")
    for name, fn in nav_gens.items():
        m = fn(288)
        for sz, suf in [(24, ".png"), (48, "@2x.png"), (72, "@3x.png")]:
            fname = f"rp_nav_{name}_24{suf}"
            save(m, sz, f"{OUT}/{fname}")
            generated.append(fname)

    print(f"\n{'=' * 60}")
    print(f"  Total files: {len(generated)}")
    print(f"{'=' * 60}")
    return generated


if __name__ == "__main__":
    main()
