"use client";

import { useId } from "react";
import {
  RARITY_SOFT,
  STARTER_EYES_ID,
  STARTER_MOUTH_ID,
  STARTER_SHAPE_ID,
  STARTER_TINT_ID,
  type CosmeticSlot,
} from "@/lib/schleimi-catalog";
import {
  BACKGROUNDS,
  EYES,
  MOUTHS,
  PALETTES,
  SHAPES,
  type PaletteDef,
  type ShapeDef,
} from "@/lib/schleimi-parts";
import type { CosmeticItemView } from "@/lib/use-cosmetics";

type LayerMap = Partial<Record<CosmeticSlot, CosmeticItemView | null>>;

const FALLBACK_SHAPE = SHAPES[STARTER_SHAPE_ID];
const FALLBACK_PALETTE = PALETTES[STARTER_TINT_ID];
const FALLBACK_EYES = EYES[STARTER_EYES_ID];
const FALLBACK_MOUTH = MOUTHS[STARTER_MOUTH_ID];

function BodyLayer({
  shape,
  palette,
  uid,
}: {
  shape: ShapeDef;
  palette: PaletteDef;
  uid: string;
}) {
  const gradientId = `${uid}-body`;
  const clipId = `${uid}-bodyclip`;
  const fill = palette.gradient ? `url(#${gradientId})` : palette.base;
  return (
    <g>
      {palette.gradient || palette.overlay ? (
        <defs>
          {palette.gradient ? (
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2={palette.gradient.diagonal ? "1" : "0"}
              y2="1"
            >
              <stop offset="0%" stopColor={palette.gradient.from} />
              {palette.gradient.mid ? (
                <stop offset="50%" stopColor={palette.gradient.mid} />
              ) : null}
              <stop offset="100%" stopColor={palette.gradient.to} />
            </linearGradient>
          ) : null}
          {palette.overlay ? (
            <clipPath id={clipId}>
              <path d={shape.path} />
            </clipPath>
          ) : null}
        </defs>
      ) : null}
      <path d={shape.path} fill={fill} />
      {shape.shadowPath ? <path d={shape.shadowPath} fill={palette.shade} opacity={0.5} /> : null}
      {shape.highlightPath ? (
        <path d={shape.highlightPath} fill={palette.highlight} opacity={0.55} />
      ) : null}
      {palette.overlay ? (
        <g clipPath={`url(#${clipId})`}>{palette.overlay(`${uid}-ov`)}</g>
      ) : null}
    </g>
  );
}

/**
 * Parametric Schleimi renderer. All parts share one 0..100 viewBox; eyes and
 * mouth are placed at anchors defined per body shape, so every combination
 * of shape, color, eyes, mouth, and background is guaranteed to fit.
 */
export function SchleimiPreview({
  layers,
  size = 160,
  label,
}: {
  layers: LayerMap;
  size?: number;
  label?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const shape = (layers.shape && SHAPES[layers.shape.id]) || FALLBACK_SHAPE;
  const palette = (layers.body_tint && PALETTES[layers.body_tint.id]) || FALLBACK_PALETTE;
  const eyes = (layers.eyes && EYES[layers.eyes.id]) || FALLBACK_EYES;
  const mouth = (layers.mouth && MOUTHS[layers.mouth.id]) || FALLBACK_MOUTH;
  const background = layers.background ? BACKGROUNDS[layers.background.id] : null;

  const clipId = `${uid}-bgclip`;

  return (
    <div
      className="relative shrink-0 overflow-visible"
      style={{ width: size, height: size }}
      aria-label={label ?? "Schleimi"}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        {background ? (
          <>
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width="100" height="100" rx="18" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>{background.render(`${uid}-bg`)}</g>
          </>
        ) : null}
        <BodyLayer shape={shape} palette={palette} uid={uid} />
        <g transform={`translate(50 ${shape.eyeY}) scale(${shape.faceScale})`}>
          {eyes(palette.ink)}
        </g>
        <g transform={`translate(50 ${shape.mouthY}) scale(${shape.faceScale})`}>
          {mouth(palette.ink)}
        </g>
      </svg>
    </div>
  );
}

/** Neutral body used in tiles that showcase a non-shape part. */
const TILE_BODY: { shape: string; tint: string } = {
  shape: STARTER_SHAPE_ID,
  tint: STARTER_TINT_ID,
};

function TileSvg({ item, uid }: { item: CosmeticItemView; uid: string }) {
  switch (item.slot) {
    case "shape": {
      const shape = SHAPES[item.id] ?? FALLBACK_SHAPE;
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
          <BodyLayer shape={shape} palette={PALETTES[TILE_BODY.tint] ?? FALLBACK_PALETTE} uid={uid} />
        </svg>
      );
    }
    case "body_tint": {
      const palette = PALETTES[item.id] ?? FALLBACK_PALETTE;
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
          <BodyLayer shape={SHAPES[TILE_BODY.shape] ?? FALLBACK_SHAPE} palette={palette} uid={uid} />
        </svg>
      );
    }
    case "eyes": {
      const eyes = EYES[item.id] ?? FALLBACK_EYES;
      return (
        <svg viewBox="-25 -25 50 50" width="100%" height="100%" aria-hidden>
          {eyes("#2A2A4A")}
        </svg>
      );
    }
    case "mouth": {
      const mouth = MOUTHS[item.id] ?? FALLBACK_MOUTH;
      return (
        <svg viewBox="-20 -20 40 40" width="100%" height="100%" aria-hidden>
          {mouth("#2A2A4A")}
        </svg>
      );
    }
    case "background": {
      const bg = BACKGROUNDS[item.id];
      if (!bg) return null;
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
          {bg.render(uid)}
        </svg>
      );
    }
  }
}

export function CosmeticTileArt({
  item,
  size = 72,
}: {
  item: CosmeticItemView;
  size?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <div
      className="relative overflow-hidden flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        background: item.slot === "background" ? "var(--rp-nb-white)" : RARITY_SOFT[item.rarity],
        border: "2px solid var(--rp-nb-black)",
        boxShadow: "3px 3px 0 var(--rp-nb-black)",
      }}
    >
      <TileSvg item={item} uid={uid} />
    </div>
  );
}
