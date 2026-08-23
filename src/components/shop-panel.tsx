"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useCosmetics } from "@/lib/use-cosmetics";
import { SHOP_AVATARS } from "@/lib/shop-catalog";
import { HIRNCOIN_ICON_20 } from "@/lib/rp-assets";
import { AvatarTile, type AvatarTileState } from "@/components/avatar-tile";
import { EmptyCard, PanelShell } from "@/components/home-panel-shell";

export function ShopPanel({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { user, isGuest, profile, profileLoading, refetchProfile } = useAuth();
  const { owned, loading, buy, equip } = useCosmetics(
    user && !isGuest ? user.id : null
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function handleTap(itemId: string, state: AvatarTileState, price: number) {
    if (busyId) return;
    setError(null);
    if (state === "equipped") return;
    setBusyId(itemId);
    try {
      if (state === "owned") {
        const result = await equip(itemId);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        await refetchProfile();
        flash("Avatar angezogen");
        return;
      }
      if (state === "locked") {
        const balance = profile?.hirncoins ?? 0;
        if (balance < price) {
          setError("Nicht genug Hirncoins. Spiel ein Match!");
          return;
        }
        const result = await buy(itemId);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        await refetchProfile();
        flash("Gekauft — tippe zum Anziehen");
      }
    } finally {
      setBusyId(null);
    }
  }

  if (!isGuest && profileLoading) {
    return (
      <PanelShell title={t.home.shop} onBack={onBack}>
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          Laden…
        </p>
      </PanelShell>
    );
  }

  if (isGuest || !profile) {
    return (
      <PanelShell title={t.home.shop} onBack={onBack}>
        <EmptyCard
          headline="Shop braucht ein Konto"
          body="Als Gast kannst du keine Avatare kaufen. Melde dich an — Hirncoins nimmst du aus Matches mit."
        />
        <Link
          href="/auth/login"
          className="mt-4 flex h-11 items-center justify-center rounded-[var(--rp-radius-pill)] text-sm font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
          }}
        >
          Anmelden
        </Link>
      </PanelShell>
    );
  }

  return (
    <PanelShell title={t.home.shop} onBack={onBack}>
      {toast && (
        <div
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-6 py-3 text-center font-bold text-white shadow-xl animate-fade-in"
          style={{ background: "var(--rp-purple)" }}
        >
          {toast}
        </div>
      )}

      <div
        className="flex items-center justify-between gap-3 px-4 py-3 mb-5"
        style={{
          background: "var(--rp-bg-elevated)",
          borderRadius: "var(--rp-radius-md)",
          boxShadow: "var(--rp-shadow-card)",
        }}
      >
        <p className="text-sm font-bold" style={{ color: "var(--rp-text)" }}>
          Avatare
        </p>
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HIRNCOIN_ICON_20} alt="" width={20} height={20} className="w-5 h-5" />
          <span className="text-sm font-extrabold" style={{ color: "var(--rp-text)" }}>
            {profile.hirncoins}
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          Laden…
        </p>
      ) : (
        <div
          className="grid gap-4 justify-items-center"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          {SHOP_AVATARS.map((item) => {
            const isOwned = owned.has(item.id);
            const isEquipped = profile.avatar_id === item.id;
            const state: AvatarTileState = isEquipped
              ? "equipped"
              : isOwned
                ? "owned"
                : "locked";
            return (
              <AvatarTile
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                state={state}
                disabled={busyId !== null || (state === "locked" && item.price === 0)}
                onClick={() => void handleTap(item.id, state, item.price)}
              />
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-4 text-center text-sm font-medium" style={{ color: "var(--rp-danger)" }}>
          {error}
        </p>
      )}

      <p
        className="mt-5 text-xs leading-relaxed px-1"
        style={{ color: "var(--rp-text-secondary)" }}
      >
        Nur Looks aus dem Avatar-Grid. Anziehen geht nur bei Besitz.
      </p>
    </PanelShell>
  );
}
