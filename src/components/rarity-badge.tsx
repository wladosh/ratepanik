"use client";

import { RARITY_COLOR, RARITY_LABEL_DE, type CosmeticRarity } from "@/lib/schleimi-catalog";

export function RarityBadge({ rarity, compact }: { rarity: CosmeticRarity; compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full font-bold"
      style={{
        background: RARITY_COLOR[rarity],
        color: rarity === "gewoehnlich" ? "#2A2A4A" : "#fff",
        fontSize: compact ? 9 : 11,
        padding: compact ? "2px 6px" : "3px 8px",
        letterSpacing: 0.2,
      }}
    >
      {RARITY_LABEL_DE[rarity]}
    </span>
  );
}
