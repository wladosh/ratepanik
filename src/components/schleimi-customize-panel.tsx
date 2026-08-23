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
  const [slot, setSlot] = useState<CosmeticSlot>("body_tint");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownedInSlot = useMemo(
    () =>
      catalog
        .filter((item) => item.slot === slot && owned.has(item.id))
        .sort((a, b) => a.sort_order - b.sort_order),
    [catalog, owned, slot],
  );

  const canUnequip = slot === "hat" || slot === "extra";

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
          className="mt-4 flex h-11 items-center justify-center rounded-[var(--rp-radius-pill)] text-sm font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
          }}
        >
          {t.landing.login}
        </Link>
      </PanelShell>
    );
  }

  return (
    <PanelShell title={t.cosmetics.customize} onBack={onBack}>
      <div className="flex flex-col items-center pb-4">
        <SchleimiPreview layers={equippedItems} size={168} label="Schleimi" />
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {COSMETIC_SLOTS.map((id) => {
          const active = slot === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSlot(id)}
              className="h-10 rounded-full text-[11px] font-bold"
              style={{
                background: active ? "var(--rp-purple)" : "var(--rp-bg-elevated)",
                color: active ? "#fff" : "var(--rp-text)",
                boxShadow: "var(--rp-shadow-card)",
              }}
            >
              {id === "body_tint"
                ? t.cosmetics.slotBodyTint
                : id === "face"
                  ? t.cosmetics.slotFace
                  : id === "hat"
                    ? t.cosmetics.slotHat
                    : t.cosmetics.slotExtra}
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
                className="flex items-center justify-center text-xs font-bold"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: loadout[slot] == null ? "var(--rp-purple-soft)" : "var(--rp-bg-muted)",
                  color: "var(--rp-text-secondary)",
                }}
              >
                {t.cosmetics.emptySlot}
              </span>
            </button>
          )}
          {ownedInSlot.map((item) => {
            const equipped = loadout[slot] === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={busy}
                onClick={() => void handleEquip(item.id)}
                className="flex flex-col items-center gap-1.5"
                style={{
                  outline: equipped ? "2px solid var(--rp-purple)" : "none",
                  borderRadius: 18,
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
