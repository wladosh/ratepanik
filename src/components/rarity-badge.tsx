"use client";

import { useI18n } from "@/lib/i18n-context";
import type { CosmeticRarity } from "@/lib/schleimi-catalog";
import { RARITY_UX_PILL } from "@/lib/schleimi-ux";

function rarityLabel(rarity: CosmeticRarity, t: ReturnType<typeof useI18n>["t"]): string {
  if (rarity === "selten") return t.cosmetics.raritySelten;
  if (rarity === "legendaer") return t.cosmetics.rarityLegendaer;
  return t.cosmetics.rarityGewoehnlich;
}

export function RarityBadge({ rarity, compact }: { rarity: CosmeticRarity; compact?: boolean }) {
  const { t } = useI18n();
  const tone = RARITY_UX_PILL[rarity];
  return (
    <span
      className="inline-flex items-center rounded-full font-bold"
      style={{
        background: tone.fill,
        color: tone.text,
        boxShadow: tone.cap ? `inset 3px 0 0 ${tone.cap}` : undefined,
        fontSize: compact ? 9 : 11,
        padding: compact ? "2px 6px" : "3px 8px",
        paddingLeft: tone.cap ? (compact ? 8 : 11) : undefined,
        letterSpacing: 0.2,
      }}
    >
      {rarityLabel(rarity, t)}
    </span>
  );
}
