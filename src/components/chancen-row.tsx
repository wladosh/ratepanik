"use client";

import { RARITY_LABEL_DE, type CosmeticRarity } from "@/lib/schleimi-catalog";
import { RARITY_UX_PILL, SCHLEIMI_UX_COPY } from "@/lib/schleimi-ux";

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
  const values: Record<CosmeticRarity, number> = { gewoehnlich, selten, legendaer };

  return (
    <div>
      <p
        className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider"
        style={{ color: "var(--rp-text-secondary)" }}
      >
        {SCHLEIMI_UX_COPY.chances}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        {ORDER.map((rarity) => {
          const tone = RARITY_UX_PILL[rarity];
          return (
            <li
              key={rarity}
              className="inline-flex items-center rounded-full text-[10px] font-bold"
              style={{
                background: tone.fill,
                color: tone.text,
                padding: "4px 8px",
                boxShadow: tone.cap ? `inset 3px 0 0 ${tone.cap}` : undefined,
                paddingLeft: tone.cap ? 11 : 8,
              }}
            >
              {values[rarity]}% {RARITY_LABEL_DE[rarity]}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
