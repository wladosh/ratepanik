"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { CosmeticRarity } from "@/lib/schleimi-catalog";
import { interpolate } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n-context";
import {
  RARITY_UX_SOFT,
  markRevealSeen,
  prefersReducedMotion,
  shouldSkipReveal,
} from "@/lib/schleimi-ux";
import { RarityBadge } from "@/components/rarity-badge";

export type RevealBeat = "shake" | "rarity" | "item";

/**
 * Presentational 3-beat stage. Parent supplies already-rolled item data.
 * Does not call RPCs or spend Hirncoins.
 */
export function SchleimiRevealStage({
  rarity,
  nameDe,
  duplicate,
  consolationHc,
  boxClosed,
  boxOpen,
  itemArt,
  onWear,
  onKeepShopping,
}: {
  rarity: CosmeticRarity;
  nameDe: string;
  duplicate: boolean;
  consolationHc: number;
  boxClosed: string;
  boxOpen: string;
  itemArt: ReactNode;
  onWear: () => void;
  onKeepShopping: () => void;
}) {
  const { t } = useI18n();
  const skip = shouldSkipReveal() || prefersReducedMotion();
  const [beat, setBeat] = useState<RevealBeat>(skip ? "item" : "shake");

  useEffect(() => {
    if (skip) {
      markRevealSeen();
      return;
    }
    const t1 = window.setTimeout(() => setBeat("rarity"), 450);
    const t2 = window.setTimeout(() => {
      setBeat("item");
      markRevealSeen();
    }, 850);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [skip, nameDe, duplicate]);

  const wash = beat === "shake" ? "var(--rp-bg-elevated)" : RARITY_UX_SOFT[rarity];
  const boxSrc = beat === "shake" ? boxClosed : boxOpen;

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schleimi-reveal-title"
      style={{
        background: "rgba(42, 42, 74, 0.55)",
        backdropFilter: "blur(3px)",
      }}
    >
      {beat !== "item" && (
        <button
          type="button"
          onClick={() => {
            setBeat("item");
            markRevealSeen();
          }}
          className="absolute right-5 top-5 min-h-11 text-sm font-semibold text-white/90"
        >
          {t.cosmetics.skip}
        </button>
      )}

      <div
        className="w-full rounded-[28px] px-5 py-6 text-center"
        style={{ background: wash, boxShadow: "var(--rp-shadow-card)" }}
      >
        {beat !== "item" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={boxSrc}
            alt=""
            width={160}
            height={160}
            className={`mx-auto h-40 w-40 object-contain ${beat === "shake" ? "rp-box-shake" : ""}`}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            {itemArt}
            <RarityBadge rarity={rarity} />
            <h2
              id="schleimi-reveal-title"
              className="text-xl font-extrabold"
              style={{ color: "var(--rp-text)" }}
            >
              {nameDe}
            </h2>
            <p className="text-sm font-semibold" style={{ color: "var(--rp-text)" }}>
              {duplicate
                ? interpolate(t.cosmetics.dropDupe, { n: consolationHc })
                : t.cosmetics.dropNew}
            </p>
          </div>
        )}

        {beat === "item" && (
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={onWear}
              className="h-[52px] rounded-[var(--rp-radius-pill)] text-sm font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
              }}
            >
              {t.cosmetics.equip}
            </button>
            <button
              type="button"
              onClick={onKeepShopping}
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
