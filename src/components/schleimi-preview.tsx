"use client";

import { useState, type ReactNode } from "react";
import {
  SCHLEIMI_BASE_PATH,
  TINT_FILL,
  type CosmeticSlot,
} from "@/lib/schleimi-catalog";
import type { CosmeticItemView } from "@/lib/use-cosmetics";
import { RARITY_COLOR, RARITY_SOFT } from "@/lib/schleimi-catalog";

type LayerMap = Partial<Record<CosmeticSlot, CosmeticItemView | null>>;

function SlimeBlob({ color, size }: { color: string; size: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden>
      <ellipse cx="64" cy="82" rx="50" ry="34" fill={color} opacity={0.35} />
      <path
        d="M24 72c4-28 24-46 40-46s36 18 40 46c2 16-8 34-40 34S22 88 24 72z"
        fill={color}
      />
      <ellipse cx="48" cy="58" rx="10" ry="6" fill="#fff" opacity={0.45} />
    </svg>
  );
}

function FacePlaceholder({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden>
      <circle cx="48" cy="62" r="7" fill="#2A2A4A" />
      <circle cx="80" cy="62" r="7" fill="#2A2A4A" />
      <circle cx="50" cy="60" r="2.2" fill="#fff" />
      <circle cx="82" cy="60" r="2.2" fill="#fff" />
      <path
        d="M52 82c6 8 18 8 24 0"
        stroke="#2A2A4A"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HatPlaceholder({ color, size }: { color: string; size: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden>
      <polygon points="64,8 96,44 32,44" fill={color} />
      <rect x="28" y="42" width="72" height="10" rx="4" fill={color} />
    </svg>
  );
}

function ExtraPlaceholder({ color, size }: { color: string; size: number }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden>
      <ellipse cx="48" cy="64" rx="16" ry="10" fill="none" stroke={color} strokeWidth="6" />
      <ellipse cx="80" cy="64" rx="16" ry="10" fill="none" stroke={color} strokeWidth="6" />
      <path d="M64 64h0" stroke={color} strokeWidth="6" />
      <line x1="64" y1="64" x2="64" y2="64" />
      <path d="M62 64h4" stroke={color} strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function LayerImage({
  src,
  size,
  fallback,
}: {
  src: string;
  size: number;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className="absolute inset-0 h-full w-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export function SchleimiPreview({
  layers,
  size = 160,
  label,
}: {
  layers: LayerMap;
  size?: number;
  label?: string;
}) {
  const tint = layers.body_tint;
  const fill = (tint && TINT_FILL[tint.id]) || "#FF8A71";
  const face = layers.face;
  const extra = layers.extra;
  const hat = layers.hat;

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
      aria-label={label ?? "Schleimi"}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <LayerImage
          src={tint?.asset_path || SCHLEIMI_BASE_PATH}
          size={size}
          fallback={<SlimeBlob color={fill} size={size} />}
        />
      </div>
      {face ? (
        <div className="absolute inset-0">
          <LayerImage
            src={face.asset_path}
            size={size}
            fallback={<FacePlaceholder size={size} />}
          />
        </div>
      ) : (
        <div className="absolute inset-0">
          <FacePlaceholder size={size} />
        </div>
      )}
      {extra ? (
        <div className="absolute inset-0">
          <LayerImage
            src={extra.asset_path}
            size={size}
            fallback={
              <ExtraPlaceholder color={RARITY_COLOR[extra.rarity]} size={size} />
            }
          />
        </div>
      ) : null}
      {hat ? (
        <div className="absolute inset-0">
          <LayerImage
            src={hat.asset_path}
            size={size}
            fallback={<HatPlaceholder color={RARITY_COLOR[hat.rarity]} size={size} />}
          />
        </div>
      ) : null}
    </div>
  );
}

export function CosmeticTileArt({
  item,
  size = 72,
}: {
  item: CosmeticItemView;
  size?: number;
}) {
  const fill = TINT_FILL[item.id] ?? RARITY_COLOR[item.rarity];
  const fallback =
    item.slot === "body_tint" ? (
      <SlimeBlob color={fill} size={size} />
    ) : item.slot === "face" ? (
      <FacePlaceholder size={size} />
    ) : item.slot === "hat" ? (
      <HatPlaceholder color={fill} size={size} />
    ) : (
      <ExtraPlaceholder color={fill} size={size} />
    );

  return (
    <div
      className="relative overflow-hidden flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        background: RARITY_SOFT[item.rarity],
      }}
    >
      <LayerImage src={item.asset_path} size={size} fallback={fallback} />
    </div>
  );
}
