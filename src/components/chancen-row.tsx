"use client";

import type { CosmeticRarity } from "@/lib/schleimi-catalog";
import { RARITY_UX_PILL } from "@/lib/schleimi-ux";
import { useI18n } from "@/lib/i18n-context";

const ORDER: CosmeticRarity[] = ["gewoehnlich", "selten", "legendaer"];

/** Display-only odds row. Pass percents from lootbox_defs — do not invent rolls. */
export function ChancenRow({
  gewoehnlich,
  selten,
  legendaer,
}: {
  gewoehnlich: number;
  selten: number;
  legendaer: number;
}) {
  const { t } = useI18n();
  const values: Record<CosmeticRarity, number> = { gewoehnlich, selten, legendaer };
  const rarityName = (rarity: CosmeticRarity) =>
    rarity === "selten"
      ? t.cosmetics.raritySelten
      : rarity === "legendaer"
        ? t.cosmetics.rarityLegendaer
        : t.cosmetics.rarityGewoehnlich;

  return (
    <div>
      <p
        className="nb-kicker mb-2 text-center text-[11px] font-bold uppercase tracking-wider"
        style={{ color: "var(--rp-nb-black)" }}
      >
        {t.cosmetics.chances}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        {ORDER.map((rarity) => {
          const tone = RARITY_UX_PILL[rarity];
          return (
            <li
              key={rarity}
              className="inline-flex items-center justify-center text-[10px] font-bold"
              style={{
                background: tone.fill,
                color: tone.text,
                padding: "4px 10px",
                borderRadius: "var(--rp-nb-radius-sm)",
                border: "2px solid var(--rp-nb-black)",
              }}
            >
              {values[rarity]}% {rarityName(rarity)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
