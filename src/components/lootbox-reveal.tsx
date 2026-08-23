"use client";

import { useEffect, useState } from "react";
import { LOOT_BOX_RARE_128 } from "@/lib/rp-assets";
import { HIRNCOIN_ICON_20 } from "@/lib/rp-assets";
import { RARITY_SOFT } from "@/lib/schleimi-catalog";
import type { OpenLootboxSuccess } from "@/lib/use-cosmetics";
import { CosmeticTileArt } from "@/components/schleimi-preview";
import { RarityBadge } from "@/components/rarity-badge";
import type { CosmeticItemView } from "@/lib/use-cosmetics";
import { useI18n } from "@/lib/i18n-context";

type Phase = "closed" | "open" | "item";

export function LootboxReveal({
  result,
  item,
  artClosed,
  artOpen,
  onDismiss,
  onCustomize,
}: {
  result: OpenLootboxSuccess;
  item: CosmeticItemView;
  artClosed: string;
  artOpen: string;
  onDismiss: () => void;
  onCustomize: () => void;
}) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("closed");

  useEffect(() => {
    const openTimer = window.setTimeout(() => setPhase("open"), 420);
    const itemTimer = window.setTimeout(() => setPhase("item"), 900);
    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(itemTimer);
    };
  }, [result.item_id, result.duplicate]);

  const boxSrc = phase === "closed" ? artClosed : artOpen;

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center px-5"
      style={{
        background: "rgba(42, 42, 74, 0.32)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-[28px] px-5 py-6 text-center animate-fade-in"
        style={{
          background: RARITY_SOFT[result.rarity],
          boxShadow: "var(--rp-shadow-card)",
        }}
      >
        {phase !== "item" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={boxSrc}
            alt=""
            width={160}
            height={160}
            className="mx-auto h-40 w-40 object-contain"
            onError={(event) => {
              event.currentTarget.src = LOOT_BOX_RARE_128;
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <CosmeticTileArt item={item} size={112} />
            <RarityBadge rarity={result.rarity} />
            <h2
              className="text-xl font-extrabold"
              style={{ color: "var(--rp-text)" }}
            >
              {result.name_de}
            </h2>
            {result.duplicate ? (
              <p
                className="flex items-center gap-1.5 text-sm font-bold"
                style={{ color: "var(--rp-text)" }}
              >
                Schon da —
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={HIRNCOIN_ICON_20} alt="" width={18} height={18} />
                +{result.consolation_hc}
              </p>
            ) : (
              <p className="text-sm font-semibold" style={{ color: "var(--rp-purple)" }}>
                Neu im Inventar
              </p>
            )}
          </div>
        )}

        {phase === "item" && (
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={onCustomize}
              className="h-11 rounded-[var(--rp-radius-pill)] text-sm font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
              }}
            >
              {t.cosmetics.equip}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="h-11 text-sm font-semibold"
              style={{ color: "var(--rp-text-secondary)" }}
            >
              {t.cosmetics.keepShopping}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
