/**
 * Schleimi parametric blob parts — 0..100 viewBox.
 *
 * Body silhouettes sit on y ≈ 88 with horizontal extent ~x 14..86
 * (star/ghost may reach 10..90). Face parts are drawn centered at (0,0)
 * and the renderer translates them to (50, eyeY/mouthY) then scales by
 * faceScale. Eyes stay in x −18..18, y −8..8; mouths in x −12..12, y −6..8.
 * Background `render(uid)` must prefix every <defs> id with `uid`.
 */

import type { ReactNode } from "react";

/** All parts share one 0..100 viewBox coordinate system. */
export interface ShapeDef {
  /** Filled body silhouette path. */
  path: string;
  /** Optional darker accent path (e.g. bottom puddle/shadow inside the silhouette), filled with palette.shade. */
  shadowPath?: string;
  /** Optional gloss/highlight path near the top, filled with palette.highlight at opacity 0.55. */
  highlightPath?: string;
  /** Y of the eye line center for this shape. */
  eyeY: number;
  /** Y of the mouth center for this shape. */
  mouthY: number;
  /** Scale applied to face part groups (1 = default). Use <1 for narrow shapes. */
  faceScale: number;
}

export interface PaletteDef {
  base: string;
  shade: string;
  highlight: string;
  /** Stroke/fill color for eyes and mouth on this body. */
  ink: string;
  /** If set, body is filled with a vertical linear gradient instead of base. */
  gradient?: { from: string; to: string };
}

export interface BackgroundDef {
  kind: "solid" | "gradient" | "pattern";
  /**
   * Returns SVG nodes that fill the full 0..100 square.
   * `uid` is a unique prefix — ALL ids in <defs> (gradients, patterns) MUST
   * be `${uid}-something` and referenced accordingly, so multiple avatars
   * can render on one page without id collisions.
   */
  render: (uid: string) => ReactNode;
}

/** Face part: returns nodes centered at (0,0). `ink` is the stroke/fill color. */
export type FacePart = (ink: string) => ReactNode;

const STROKE = {
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function sparkleD(cx: number, cy: number, r: number): string {
  const k = r * 0.3;
  return `M${cx} ${cy - r} L${cx + k} ${cy - k} L${cx + r} ${cy} L${cx + k} ${cy + k} L${cx} ${cy + r} L${cx - k} ${cy + k} L${cx - r} ${cy} L${cx - k} ${cy - k} Z`;
}

function heartD(cx: number, cy: number, s: number): string {
  const t = cy - s * 0.38;
  const b = cy + s * 0.68;
  return `M ${cx} ${b} C ${cx} ${b} ${cx - s} ${cy + s * 0.12} ${cx - s} ${cy - s * 0.18} C ${cx - s} ${cy - s * 0.78} ${cx - s * 0.5} ${cy - s * 0.98} ${cx} ${t} C ${cx + s * 0.5} ${cy - s * 0.98} ${cx + s} ${cy - s * 0.75} ${cx + s} ${cy - s * 0.18} C ${cx + s} ${cy + s * 0.12} ${cx} ${b} ${cx} ${b} Z`;
}

export const SHAPES: Record<string, ShapeDef> = {
  shape_classic: {
    path: "M 50 24 C 40 22 28 30 20 44 C 13 58 13 72 19 81 C 24 88 36 90 50 88 C 66 87 79 84 83 75 C 88 65 86 54 78 42 C 71 30 61 24 50 24 Z",
    shadowPath:
      "M 28 76 C 34 84 42 87.5 50 87.5 C 58 87.5 67 84 73 76 C 65 82 56 83.5 50 83.5 C 44 83.5 36 82 28 76 Z",
    highlightPath: "M 37 33 C 43 26 53 25 59 32 C 53 37 44 38 37 33 Z",
    eyeY: 54,
    mouthY: 70,
    faceScale: 1,
  },
  shape_round: {
    path: "M 50 17 C 33 17 15 32 15 52 C 15 68 27 85 50 88 C 73 85 85 68 85 52 C 85 32 67 17 50 17 Z",
    shadowPath:
      "M 27 74 C 34 83 42 87 50 87.5 C 58 87 66 83 73 74 C 64 80 56 82.5 50 82.5 C 44 82.5 36 80 27 74 Z",
    highlightPath: "M 36 30 C 42 23 54 22 61 30 C 54 35 44 36 36 30 Z",
    eyeY: 52,
    mouthY: 68,
    faceScale: 1,
  },
  shape_egg: {
    path: "M 50 13 C 37 13 24 28 21 48 C 18 66 28 84 50 88 C 72 84 82 66 79 48 C 76 28 63 13 50 13 Z",
    shadowPath:
      "M 30 76 C 36 84 43 87.5 50 87.5 C 57 87.5 64 84 70 76 C 62 81 56 83 50 83 C 44 83 38 81 30 76 Z",
    highlightPath: "M 38 26 C 43 20 53 19 59 26 C 53 31 44 32 38 26 Z",
    eyeY: 50,
    mouthY: 66,
    faceScale: 1,
  },
  shape_squircle: {
    path: "M 28 18 C 18 18 14 24 16 36 C 15 50 15 66 16 76 C 15 86 22 90 34 88 C 50 90 66 90 66 88 C 78 90 85 86 84 76 C 85 66 85 50 84 36 C 86 24 82 18 72 18 C 58 16 42 16 28 18 Z",
    shadowPath:
      "M 24 76 C 28 84 38 88 50 88 C 62 88 72 84 76 76 C 68 82 58 84 50 84 C 42 84 32 82 24 76 Z",
    highlightPath: "M 32 28 C 38 22 50 21 60 26 C 52 32 40 34 32 28 Z",
    eyeY: 53,
    mouthY: 69,
    faceScale: 1,
  },
  shape_ghost: {
    path: "M 50 15 C 32 15 14 30 15 50 C 15 62 15 70 15 76 C 16 83 24 88 32 84 C 40 81 46 88 50 85 C 54 88 60 81 68 85 C 76 88 84 83 85 76 C 85 70 85 62 85 50 C 86 30 68 15 50 15 Z",
    shadowPath:
      "M 24 74 C 28 80 36 84 42 82 C 47 84 53 84 58 82 C 64 84 72 80 76 74 C 66 80 58 82 50 82 C 42 82 34 80 24 74 Z",
    highlightPath: "M 36 28 C 42 21 54 20 61 28 C 54 33 44 34 36 28 Z",
    eyeY: 48,
    mouthY: 64,
    faceScale: 1,
  },
  shape_tall: {
    path: "M 50 12 C 39 11 27 22 23 40 C 20 56 21 70 26 80 C 30 87 40 90 50 88 C 60 90 70 87 74 80 C 79 70 80 56 77 40 C 73 22 61 11 50 12 Z",
    shadowPath:
      "M 32 76 C 36 84 43 87.5 50 87.5 C 57 87.5 64 84 68 76 C 60 81 54 83 50 83 C 46 83 40 81 32 76 Z",
    highlightPath: "M 40 24 C 44 18 54 17 59 24 C 53 29 45 30 40 24 Z",
    eyeY: 46,
    mouthY: 62,
    faceScale: 0.85,
  },
  shape_wobble: {
    path: "M 12 56 C 10 44 16 30 28 27 C 36 25 41 36 45 38 C 49 22 61 20 68 32 C 72 24 82 26 88 38 C 90 50 90 66 85 78 C 80 87 66 90 50 88 C 32 90 16 86 13 76 C 10 66 10 62 12 56 Z",
    shadowPath:
      "M 22 76 C 30 85 40 88 50 88 C 62 88 74 85 80 76 C 70 82 60 84 50 84 C 40 84 30 82 22 76 Z",
    highlightPath:
      "M 30 36 C 34 30 42 34 44 40 C 50 28 62 26 68 36 C 62 40 52 42 44 40 C 40 42 34 42 30 36 Z",
    eyeY: 58,
    mouthY: 74,
    faceScale: 1,
  },
  shape_star: {
    path: "M 50 14 C 53 28 56 32 66 34 C 80 28 88 36 82 48 C 74 52 74 58 80 66 C 88 78 76 88 64 80 C 56 76 54 78 50 88 C 46 78 44 76 36 80 C 24 88 12 78 20 66 C 26 58 26 52 18 48 C 12 36 20 28 34 34 C 44 32 47 28 50 14 Z",
    shadowPath:
      "M 36 68 C 42 76 47 80 50 82 C 53 80 58 76 64 68 C 56 72 50 74 50 74 C 50 74 44 72 36 68 Z",
    highlightPath: "M 46 24 C 49 18 54 20 54 28 C 52 32 48 32 46 24 Z",
    eyeY: 50,
    mouthY: 66,
    faceScale: 0.9,
  },
};

export const PALETTES: Record<string, PaletteDef> = {
  tint_peach: {
    base: "#FF8A71",
    shade: "#D96B54",
    highlight: "#FFC4B5",
    ink: "#2A2A4A",
  },
  tint_mint: {
    base: "#6FCFB2",
    shade: "#54B094",
    highlight: "#B8E8D6",
    ink: "#2A2A4A",
  },
  tint_sky: {
    base: "#7EB6FF",
    shade: "#5E98E0",
    highlight: "#C2DCFF",
    ink: "#2A2A4A",
  },
  tint_lilac: {
    base: "#C9C0FF",
    shade: "#A79BEE",
    highlight: "#E8E3FF",
    ink: "#2A2A4A",
  },
  tint_mango: {
    base: "#FFB86B",
    shade: "#E09445",
    highlight: "#FFD7A8",
    ink: "#2A2A4A",
  },
  tint_blush: {
    base: "#FF7AB6",
    shade: "#E05596",
    highlight: "#FFB3D4",
    ink: "#2A2A4A",
  },
  tint_grape_jelly: {
    base: "#7A6AE8",
    shade: "#5C4DD0",
    highlight: "#B5ABF5",
    ink: "#F4F1FF",
  },
  tint_matcha_swirl: {
    base: "#6FCF97",
    shade: "#54B07A",
    highlight: "#B8E8C4",
    ink: "#2A2A4A",
  },
  tint_midnight: {
    base: "#4A3A6A",
    shade: "#35284F",
    highlight: "#7A6A9A",
    ink: "#F4F1FF",
  },
  tint_gold: {
    base: "#F5A623",
    shade: "#D48C12",
    highlight: "#FFE7A0",
    ink: "#4A3208",
    gradient: { from: "#FFD766", to: "#F5A623" },
  },
  tint_holo: {
    base: "#E0B0FF",
    shade: "#C490E8",
    highlight: "#F5DEFF",
    ink: "#4A3A6A",
    gradient: { from: "#B8E8FF", to: "#E0B0FF" },
  },
};

export const EYES: Record<string, FacePart> = {
  eyes_dots: (ink) => (
    <g>
      <circle cx={-11} cy={0} r={5} fill={ink} />
      <circle cx={11} cy={0} r={5} fill={ink} />
      <circle cx={-9.3} cy={-1.6} r={1.7} fill="#FFFFFF" />
      <circle cx={12.7} cy={-1.6} r={1.7} fill="#FFFFFF" />
    </g>
  ),
  eyes_happy: (ink) => (
    <g fill="none" stroke={ink} strokeWidth={2.8} {...STROKE}>
      <path d="M -16.5 2.5 Q -11 -6 -5.5 2.5" />
      <path d="M 5.5 2.5 Q 11 -6 16.5 2.5" />
    </g>
  ),
  eyes_wink: (ink) => (
    <g>
      <circle cx={-11} cy={0} r={5} fill={ink} />
      <circle cx={-9.3} cy={-1.6} r={1.7} fill="#FFFFFF" />
      <path
        d="M 5.5 2 Q 11 -5.5 16.5 2"
        fill="none"
        stroke={ink}
        strokeWidth={2.8}
        {...STROKE}
      />
    </g>
  ),
  eyes_wide: (ink) => (
    <g>
      <circle cx={-11} cy={0} r={5.6} fill="#FFFFFF" stroke={ink} strokeWidth={2} />
      <circle cx={11} cy={0} r={5.6} fill="#FFFFFF" stroke={ink} strokeWidth={2} />
      <circle cx={-11} cy={0.8} r={2.2} fill={ink} />
      <circle cx={11} cy={0.8} r={2.2} fill={ink} />
      <circle cx={-9.8} cy={-0.6} r={0.9} fill="#FFFFFF" />
      <circle cx={12.2} cy={-0.6} r={0.9} fill="#FFFFFF" />
    </g>
  ),
  eyes_shy: (ink) => (
    <g>
      <ellipse cx={-12} cy={6.2} rx={4.2} ry={2} fill="#FF9CB8" opacity={0.6} />
      <ellipse cx={10} cy={6.2} rx={4.2} ry={2} fill="#FF9CB8" opacity={0.6} />
      <circle cx={-12} cy={1.4} r={3.6} fill={ink} />
      <circle cx={10} cy={1.4} r={3.6} fill={ink} />
      <circle cx={-13.2} cy={0.4} r={1.15} fill="#FFFFFF" />
      <circle cx={8.8} cy={0.4} r={1.15} fill="#FFFFFF" />
    </g>
  ),
  eyes_sleepy: (ink) => (
    <g fill="none" stroke={ink} {...STROKE}>
      <path d="M -16.5 1.5 Q -11 -3.5 -5.5 1.5" strokeWidth={2.6} />
      <path d="M 5.5 1.5 Q 11 -3.5 16.5 1.5" strokeWidth={2.6} />
      <path d="M -15.2 -0.6 L -16.2 -3.6" strokeWidth={1.8} />
      <path d="M -11 -1.8 L -11.3 -4.6" strokeWidth={1.8} />
      <path d="M -6.8 -0.6 L -5.8 -3.6" strokeWidth={1.8} />
      <path d="M 6.8 -0.6 L 5.8 -3.6" strokeWidth={1.8} />
      <path d="M 11 -1.8 L 10.7 -4.6" strokeWidth={1.8} />
      <path d="M 15.2 -0.6 L 16.2 -3.6" strokeWidth={1.8} />
    </g>
  ),
  eyes_panic: (ink) => (
    <g>
      <path
        d="M -16.2 -3.2 C -17.6 0 -16.4 5.4 -11.2 6.2 C -5.6 6.8 -4.4 1.2 -5.6 -3 C -6.8 -6.2 -14.4 -6.6 -16.2 -3.2 Z"
        fill="none"
        stroke={ink}
        strokeWidth={2.2}
        {...STROKE}
      />
      <path
        d="M 5.4 -4 C 4.4 -0.4 6.6 5.6 11.6 5.4 C 16.8 5.2 17.6 -0.6 16.2 -3.8 C 14.6 -6.6 6.6 -7 5.4 -4 Z"
        fill="none"
        stroke={ink}
        strokeWidth={2.2}
        {...STROKE}
      />
      <circle cx={-10.2} cy={0.8} r={1.55} fill={ink} />
      <circle cx={13.2} cy={-0.4} r={1.4} fill={ink} />
    </g>
  ),
  eyes_sparkle: (ink) => (
    <g>
      <path d={sparkleD(-11, 0, 6)} fill={ink} />
      <path d={sparkleD(11, 0, 6)} fill={ink} />
      <circle cx={-9.4} cy={-1.5} r={1.2} fill="#FFFFFF" />
      <circle cx={12.6} cy={-1.5} r={1.2} fill="#FFFFFF" />
    </g>
  ),
  eyes_hearts: (ink) => (
    <g>
      <path d={heartD(-11, 0.4, 5.2)} fill="#FF5C8A" stroke={ink} strokeWidth={1.6} {...STROKE} />
      <path d={heartD(11, 0.4, 5.2)} fill="#FF5C8A" stroke={ink} strokeWidth={1.6} {...STROKE} />
      <circle cx={-12.4} cy={-1.4} r={1.05} fill="#FFFFFF" />
      <circle cx={9.6} cy={-1.4} r={1.05} fill="#FFFFFF" />
    </g>
  ),
  eyes_cool: (ink) => (
    <g>
      <path
        d="M -17.2 -5.4 C -17.8 -7.6 -15.8 -8 -13.5 -8 L -4.2 -8 C -2.2 -8 -1.2 -6.4 -0.8 -4.4 L 0.8 -4.4 C 1.2 -6.4 2.2 -8 4.2 -8 L 13.5 -8 C 15.8 -8 17.8 -7.6 17.2 -5.4 L 17.2 4.2 C 17.8 6.6 15.8 7.2 13.5 7.2 L 4.2 7.2 C 2.4 7.2 1.4 5.6 1 3.8 L -1 3.8 C -1.4 5.6 -2.4 7.2 -4.2 7.2 L -13.5 7.2 C -15.8 7.2 -17.8 6.6 -17.2 4.2 Z"
        fill="#1A1A28"
        stroke={ink}
        strokeWidth={1.15}
        {...STROKE}
      />
      <rect x={-16} y={-6.4} width={12.6} height={12} rx={2.4} fill="#1C1C2E" />
      <rect x={3.4} y={-6.4} width={12.6} height={12} rx={2.4} fill="#1C1C2E" />
      <path
        d="M -14.6 -4.2 Q -12.2 -5.6 -9.4 -3.6"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.3}
        opacity={0.7}
        {...STROKE}
      />
      <path
        d="M 5 -4.2 Q 7.4 -5.6 10.2 -3.6"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.3}
        opacity={0.7}
        {...STROKE}
      />
    </g>
  ),
  eyes_glitch: (ink) => (
    <g>
      <rect x={-15.2} y={-4.2} width={8} height={8} rx={1} fill={ink} />
      <rect x={7.2} y={-4.2} width={8} height={8} rx={1} fill={ink} />
      <rect x={-12.6} y={-2} width={2.2} height={2.2} fill="#FFFFFF" />
      <rect x={10} y={-2} width={2.2} height={2.2} fill="#FFFFFF" />
      <rect x={-16.6} y={-6.2} width={3.6} height={3.6} rx={0.5} fill="#35E0D6" />
      <rect x={13.4} y={2.2} width={3.6} height={3.6} rx={0.5} fill="#FF5C8A" />
    </g>
  ),
};

export const MOUTHS: Record<string, FacePart> = {
  mouth_grin: (ink) => (
    <g>
      <path
        d="M -11 -2.4 C -6 10.8 6 10.8 11 -2.4 C 6 1.8 -6 1.8 -11 -2.4 Z"
        fill={ink}
        stroke={ink}
        strokeWidth={1.2}
        {...STROKE}
      />
      <path d="M -3.6 3.2 C -2 7.6 2 7.6 3.6 3.2 Q 0 5.2 -3.6 3.2 Z" fill="#FF7D93" />
    </g>
  ),
  mouth_smile: (ink) => (
    <path
      d="M -9 0 Q 0 7.2 9 0"
      fill="none"
      stroke={ink}
      strokeWidth={2.7}
      {...STROKE}
    />
  ),
  mouth_oops: (ink) => <circle cx={0} cy={1.2} r={4} fill={ink} />,
  mouth_shy: (ink) => (
    <path
      d="M -5.2 0.4 Q -2.6 3.4 0 0.6 Q 2.6 3.4 5.2 0.4"
      fill="none"
      stroke={ink}
      strokeWidth={2.5}
      {...STROKE}
    />
  ),
  mouth_wavy: (ink) => (
    <path
      d="M -10 0.6 C -6.5 -4.2 -3.2 4.8 0 0.6 C 3.2 -3.6 6.5 5.2 10 0.6"
      fill="none"
      stroke={ink}
      strokeWidth={2.6}
      {...STROKE}
    />
  ),
  mouth_panic: (ink) => (
    <path
      d="M -10 -2.6 C -11.6 0.6 -10.2 6.2 -5.8 7.2 C -1.6 8.2 3.4 7.4 6.4 5.4 C 10.4 3.2 11.6 -1.2 9 -3 C 5.4 -0.8 -0.2 -0.6 -4.6 -1.6 C -7.4 -2.4 -9 -2.2 -10 -2.6 Z"
      fill={ink}
    />
  ),
  mouth_smirk: (ink) => (
    <path
      d="M -8.2 2.2 Q 2.4 8.2 9.4 -0.6 Q 10.6 -2.6 8.4 -3.4"
      fill="none"
      stroke={ink}
      strokeWidth={2.7}
      {...STROKE}
    />
  ),
  mouth_kiss: (ink) => (
    <g>
      <path
        d="M 0 -3.2 Q -4.2 -4.2 -3.6 0 Q -4.2 4 0 3 Q 4.2 4 3.6 0 Q 4.2 -4.2 0 -3.2 Z"
        fill={ink}
      />
      <path d={heartD(9.2, -3.2, 2.15)} fill="#FF5C8A" />
    </g>
  ),
  mouth_tongue: (ink) => (
    <g>
      <path
        d="M -9 -1.2 Q 0 6.4 9 -1.2"
        fill="none"
        stroke={ink}
        strokeWidth={2.7}
        {...STROKE}
      />
      <path
        d="M 0.6 3.2 C 1.8 8.4 7.2 9.2 7.4 3.8 C 5.8 6.2 2.6 6 0.6 3.2 Z"
        fill="#FF7D93"
        stroke="#E85A74"
        strokeWidth={0.6}
        {...STROKE}
      />
      <path d="M 4.2 4.2 L 5.1 7.4" fill="none" stroke="#E85A74" strokeWidth={1.15} {...STROKE} />
    </g>
  ),
  mouth_rainbow: (ink) => (
    <g>
      <path d="M -11 -2.2 C -6 10.6 6 10.6 11 -2.2 C 6 2 -6 2 -11 -2.2 Z" fill="#FF5C8A" />
      <path d="M -10.2 -0.2 C -5.5 9.2 5.5 9.2 10.2 -0.2 C 5.2 2.2 -5.2 2.2 -10.2 -0.2 Z" fill="#FFB86B" />
      <path d="M -8.8 1.6 C -5 8 5 8 8.8 1.6 C 4.6 3.2 -4.6 3.2 -8.8 1.6 Z" fill="#FFD766" />
      <path d="M -7.2 3.2 C -4.2 7 4.2 7 7.2 3.2 C 4 4.4 -4 4.4 -7.2 3.2 Z" fill="#6FCF97" />
      <path d="M -5.4 4.8 C -3.2 6.4 3.2 6.4 5.4 4.8 C 3 5.4 -3 5.4 -5.4 4.8 Z" fill="#7EB6FF" />
      <path
        d="M -11 -2.2 C -6 10.6 6 10.6 11 -2.2 C 6 2 -6 2 -11 -2.2 Z"
        fill="none"
        stroke={ink}
        strokeWidth={2.2}
        {...STROKE}
      />
    </g>
  ),
  mouth_glitch: (ink) => (
    <g fill="none" {...STROKE}>
      <path d="M -10.4 -2.6 L -1.6 -2.6" stroke="#35E0D6" strokeWidth={2.2} />
      <path d="M 0.4 2.6 L 6.2 2.6" stroke="#FF5C8A" strokeWidth={2.2} />
      <path d="M -10 -1.2 L -2 -1.2" stroke={ink} strokeWidth={2.8} />
      <path d="M -0.6 0.6 L 4.4 0.6" stroke={ink} strokeWidth={2.8} />
      <path d="M 5.2 -0.4 L 11.2 -0.4" stroke={ink} strokeWidth={2.8} />
    </g>
  ),
};

export const BACKGROUNDS: Record<string, BackgroundDef> = {
  bg_cream: {
    kind: "solid",
    render: () => (
      <g>
        <rect width={100} height={100} fill="#FFF3E2" />
        <ellipse cx={22} cy={28} rx={22} ry={16} fill="#F6E4C8" opacity={0.7} />
        <ellipse cx={78} cy={22} rx={18} ry={14} fill="#F6E4C8" opacity={0.55} />
        <ellipse cx={70} cy={78} rx={26} ry={18} fill="#F3DDBB" opacity={0.65} />
        <ellipse cx={18} cy={82} rx={16} ry={12} fill="#F6E4C8" opacity={0.5} />
      </g>
    ),
  },
  bg_mint: {
    kind: "solid",
    render: () => (
      <g>
        <rect width={100} height={100} fill="#DFF6EC" />
        <path d="M 0 72 C 18 64 28 76 42 70 C 58 63 70 78 82 68 C 90 62 96 68 100 66 L 100 100 L 0 100 Z" fill="#C4EDD9" />
      </g>
    ),
  },
  bg_sky: {
    kind: "solid",
    render: () => (
      <g>
        <rect width={100} height={100} fill="#E3F0FF" />
        <g fill="#FFFFFF" opacity={0.92}>
          <ellipse cx={24} cy={26} rx={14} ry={7} />
          <ellipse cx={16} cy={28} rx={8} ry={5.5} />
          <ellipse cx={32} cy={28} rx={9} ry={5} />
          <ellipse cx={72} cy={20} rx={12} ry={6} />
          <ellipse cx={64} cy={22} rx={7} ry={4.5} />
          <ellipse cx={80} cy={22} rx={8} ry={5} />
          <ellipse cx={58} cy={48} rx={11} ry={5.5} />
          <ellipse cx={50} cy={50} rx={7} ry={4} />
          <ellipse cx={66} cy={50} rx={7.5} ry={4.2} />
        </g>
      </g>
    ),
  },
  bg_lilac: {
    kind: "solid",
    render: (uid) => (
      <g>
        <defs>
          <pattern id={`${uid}-dots`} x={0} y={0} width={14} height={14} patternUnits="userSpaceOnUse">
            <circle cx={3.5} cy={3.5} r={2.1} fill="#DCD2FF" />
          </pattern>
        </defs>
        <rect width={100} height={100} fill="#EFEAFF" />
        <rect width={100} height={100} fill={`url(#${uid}-dots)`} />
      </g>
    ),
  },
  bg_sunset: {
    kind: "gradient",
    render: (uid) => (
      <g>
        <defs>
          <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD9A0" />
            <stop offset="100%" stopColor="#FF9AA8" />
          </linearGradient>
        </defs>
        <rect width={100} height={100} fill={`url(#${uid}-sky)`} />
        <circle cx={72} cy={28} r={16} fill="#FFE8B0" opacity={0.85} />
        <circle cx={72} cy={28} r={10} fill="#FFF6D6" opacity={0.7} />
      </g>
    ),
  },
  bg_bubbles: {
    kind: "pattern",
    render: (uid) => (
      <g>
        <defs>
          <pattern id={`${uid}-bubbles`} x={0} y={0} width={36} height={36} patternUnits="userSpaceOnUse">
            <circle cx={8} cy={10} r={5} fill="#FFFFFF" fillOpacity={0.28} stroke="#A8DDE2" strokeWidth={1.3} />
            <circle cx={24} cy={6} r={3} fill="none" stroke="#A8DDE2" strokeWidth={1.2} />
            <circle cx={28} cy={24} r={4.5} fill="#FFFFFF" fillOpacity={0.2} stroke="#A8DDE2" strokeWidth={1.3} />
            <circle cx={12} cy={28} r={2.4} fill="none" stroke="#A8DDE2" strokeWidth={1.1} />
          </pattern>
        </defs>
        <rect width={100} height={100} fill="#DFF4F6" />
        <rect width={100} height={100} fill={`url(#${uid}-bubbles)`} />
        <circle cx={18} cy={22} r={8} fill="#FFFFFF" fillOpacity={0.3} stroke="#A8DDE2" strokeWidth={1.4} />
        <circle cx={78} cy={16} r={6.5} fill="#FFFFFF" fillOpacity={0.25} stroke="#A8DDE2" strokeWidth={1.4} />
        <circle cx={62} cy={58} r={9} fill="#FFFFFF" fillOpacity={0.18} stroke="#A8DDE2" strokeWidth={1.5} />
      </g>
    ),
  },
  bg_stars: {
    kind: "gradient",
    render: (uid) => (
      <g>
        <defs>
          <linearGradient id={`${uid}-night`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A2A4A" />
            <stop offset="100%" stopColor="#4A3A6A" />
          </linearGradient>
        </defs>
        <rect width={100} height={100} fill={`url(#${uid}-night)`} />
        <path d={sparkleD(18, 18, 4.2)} fill="#FFF6D6" />
        <path d={sparkleD(78, 14, 3.2)} fill="#FFFFFF" />
        <path d={sparkleD(88, 38, 3.6)} fill="#FFF6D6" />
        <path d={sparkleD(14, 48, 2.8)} fill="#FFFFFF" />
        <path d={sparkleD(68, 52, 4.8)} fill="#FFFFFF" />
        <path d={sparkleD(40, 28, 2.4)} fill="#FFF6D6" />
        <path d={sparkleD(22, 78, 3.4)} fill="#FFFFFF" />
        <path d={sparkleD(82, 82, 4)} fill="#FFF6D6" />
        <path d={sparkleD(50, 10, 2.2)} fill="#FFFFFF" />
      </g>
    ),
  },
  bg_gold: {
    kind: "gradient",
    render: (uid) => (
      <g>
        <defs>
          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF0C4" />
            <stop offset="100%" stopColor="#FFD766" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="38%" r="48%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={100} height={100} fill={`url(#${uid}-gold)`} />
        <rect width={100} height={100} fill={`url(#${uid}-glow)`} />
        <path d={sparkleD(16, 16, 3)} fill="#FFE9A0" />
        <path d={sparkleD(86, 22, 2.4)} fill="#FFFFFF" opacity={0.85} />
        <path d={sparkleD(74, 78, 2.8)} fill="#FFFFFF" opacity={0.7} />
        <path d={sparkleD(28, 84, 2.2)} fill="#FFE9A0" />
      </g>
    ),
  },
  bg_holo: {
    kind: "gradient",
    render: (uid) => (
      <g>
        <defs>
          <linearGradient id={`${uid}-holo`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B8E8FF" />
            <stop offset="50%" stopColor="#E0B0FF" />
            <stop offset="100%" stopColor="#FFD1E8" />
          </linearGradient>
        </defs>
        <rect width={100} height={100} fill={`url(#${uid}-holo)`} />
        <ellipse cx={32} cy={28} rx={28} ry={8} fill="#FFFFFF" opacity={0.28} transform="rotate(-18 32 28)" />
        <ellipse cx={70} cy={68} rx={26} ry={7} fill="#FFFFFF" opacity={0.22} transform="rotate(-18 70 68)" />
      </g>
    ),
  },
};
