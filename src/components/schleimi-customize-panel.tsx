"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useCosmetics } from "@/lib/use-cosmetics";
import {
  COSMETIC_SLOTS,
  type CosmeticSlot,
} from "@/lib/schleimi-catalog";
import { CosmeticTileArt, SchleimiPreview } from "@/components/schleimi-preview";
import { RarityBadge } from "@/components/rarity-badge";
import { EmptyCard, PanelShell } from "@/components/home-panel-shell";

export function SchleimiCustomizePanel({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { user, isGuest, profile, profileLoading } = useAuth();
  const { catalog, owned, loadout, equippedItems, loading, equipSlot } = useCosmetics(
    user && !isGuest ? user.id : null,
  );
  const [slot, setSlot] = useState<CosmeticSlot>("shape");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsInSlot = useMemo(() => {
    const inSlot = catalog.filter((item) => item.slot === slot);
    const ownedItems = inSlot
      .filter((item) => owned.has(item.id))
      .sort((a, b) => a.sort_order - b.sort_order);
    const unknownItems = inSlot
      .filter((item) => !owned.has(item.id))
      .sort((a, b) => a.id.localeCompare(b.id));
    return [...ownedItems, ...unknownItems];
  }, [catalog, slot, owned]);

  /** owned/total per slot for the collection counters on the chips. */
  const slotProgress = useMemo(() => {
    const progress = {} as Record<CosmeticSlot, { owned: number; total: number }>;
    for (const id of COSMETIC_SLOTS) progress[id] = { owned: 0, total: 0 };
    for (const item of catalog) {
      progress[item.slot].total += 1;
      if (owned.has(item.id)) progress[item.slot].owned += 1;
    }
    return progress;
  }, [catalog, owned]);

  const canUnequip = slot === "background";

  async function handleEquip(itemId: string | null) {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const result = await equipSlot(slot, itemId);
      if (!result.ok) setError(result.error);
    } finally {
      setBusy(false);
    }
  }

  if (!isGuest && profileLoading) {
    return (
      <PanelShell title={t.cosmetics.customize} onBack={onBack}>
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          {t.common.loading}
        </p>
      </PanelShell>
    );
  }

  if (isGuest || !profile) {
    return (
      <PanelShell title={t.cosmetics.customize} onBack={onBack}>
        <EmptyCard
          headline={t.cosmetics.customizeNeedsAccountHeadline}
          body={t.cosmetics.customizeNeedsAccountBody}
        />
        <Link
          href="/auth/login"
          className="nb-btn mt-4 flex h-11 items-center justify-center text-sm text-white"
          style={{
            background: "var(--rp-nb-peach)",
          }}
        >
          {t.landing.login}
        </Link>
      </PanelShell>
    );
  }

  return (
    <PanelShell title={t.cosmetics.customize} onBack={onBack}>
      <div className="flex flex-col items-center pb-4 pt-3">
        <SchleimiPreview layers={equippedItems} size={168} label="Schleimi" />
      </div>

      <div className="mb-4 grid grid-cols-5 gap-1.5">
        {COSMETIC_SLOTS.map((id) => {
          const active = slot === id;
          const label =
            id === "shape"
              ? t.cosmetics.slotShape
              : id === "body_tint"
                ? t.cosmetics.slotBodyTint
                : id === "eyes"
                  ? t.cosmetics.slotEyes
                  : id === "mouth"
                    ? t.cosmetics.slotMouth
                    : t.cosmetics.slotBackground;
          const progress = slotProgress[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSlot(id)}
              className="nb-btn flex h-12 flex-col items-center justify-center gap-0 text-[10px] leading-tight"
              style={{
                background: active ? "var(--rp-nb-purple)" : "var(--rp-nb-white)",
                color: active ? "#fff" : "var(--rp-nb-black)",
              }}
            >
              <span>{label}</span>
              <span className="text-[9px] font-bold opacity-70">
                {progress.owned}/{progress.total}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          {t.common.loading}
        </p>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          {canUnequip && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleEquip(null)}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className="nb-card flex items-center justify-center text-xs font-bold"
                style={{
                  width: 72,
                  height: 72,
                  background: loadout[slot] == null ? "var(--rp-nb-lilac)" : "var(--rp-nb-white)",
                  color: "var(--rp-nb-text-secondary)",
                }}
              >
                {t.cosmetics.emptySlot}
              </span>
            </button>
          )}
          {itemsInSlot.map((item) => {
            if (!owned.has(item.id)) {
              return (
                <div key={item.id} className="flex flex-col items-center gap-1.5" style={{ padding: 4 }}>
                  <span
                    className="nb-card flex items-center justify-center text-3xl font-extrabold"
                    style={{
                      width: 72,
                      height: 72,
                      background: "#C8C8C8",
                      color: "var(--rp-nb-black)",
                    }}
                    aria-label={t.cosmetics.unknownItem}
                  >
                    ?
                  </span>
                </div>
              );
            }
            const equipped = loadout[slot] === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={busy}
                onClick={() => void handleEquip(item.id)}
                className="flex flex-col items-center gap-1.5"
                style={{
                  outline: equipped ? "3px solid var(--rp-nb-black)" : "none",
                  borderRadius: "var(--rp-nb-radius)",
                  padding: 4,
                }}
              >
                <CosmeticTileArt item={item} size={72} />
                <RarityBadge rarity={item.rarity} compact />
                <span
                  className="text-[10px] font-bold leading-tight text-center"
                  style={{ color: "var(--rp-text)" }}
                >
                  {item.name_de}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-4 text-center text-sm font-medium" style={{ color: "var(--rp-danger)" }}>
          {error}
        </p>
      )}
    </PanelShell>
  );
}
