"use client";

import Image from "next/image";
import { modeArtSrc, rankBadgeSrc } from "@/lib/rp-assets";

export function ModeArt({
  mode,
  size = 32,
  className,
  priority = false,
}: {
  mode: string | null | undefined;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const src = modeArtSrc(mode);
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
      priority={priority}
    />
  );
}

export function PlaceBadge({
  rank,
  size = 36,
  className,
}: {
  rank: number;
  size?: number;
  className?: string;
}) {
  const src = rankBadgeSrc(rank);
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: Math.round(size * 0.38),
      }}
    >
      {rank}
    </span>
  );
}
