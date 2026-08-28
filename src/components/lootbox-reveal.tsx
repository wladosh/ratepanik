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
        background: "rgba(26, 26, 46, 0.6)",
      }}
    >
      <div
        className="nb-card-lg w-full max-w-sm px-5 py-6 text-center animate-fade-in"
        style={{
          background: "var(--rp-nb-white)",
          borderRadius: "var(--rp-nb-radius)",
          border: "var(--rp-nb-border)",
          boxShadow: "var(--rp-nb-shadow-lg)",
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
              className="nb-heading text-xl font-extrabold uppercase"
              style={{ color: "var(--rp-nb-black)" }}
            >
              {result.name_de}
            </h2>
            {result.duplicate ? (
              <p
                className="flex items-center gap-1.5 text-sm font-bold"
                style={{ color: "var(--rp-nb-black)" }}
              >
                Schon da —
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={HIRNCOIN_ICON_20} alt="" width={18} height={18} />
                +{result.consolation_hc}
              </p>
            ) : (
              <p className="text-sm font-bold" style={{ color: "var(--rp-nb-purple-deep)" }}>
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
              className="nb-btn h-11 text-sm font-bold text-white uppercase transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--rp-nb-shadow-pressed)]"
              style={{
                background: "var(--rp-nb-peach)",
                border: "var(--rp-nb-border)",
                borderRadius: "var(--rp-nb-radius)",
                boxShadow: "var(--rp-nb-shadow)",
              }}
            >
              {t.cosmetics.equip}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="h-11 text-sm font-bold uppercase"
              style={{ color: "var(--rp-nb-black)" }}
            >
              {t.cosmetics.keepShopping}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
