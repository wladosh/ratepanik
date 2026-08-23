"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useCosmetics, type OpenLootboxSuccess } from "@/lib/use-cosmetics";
import { HIRNCOIN_ICON_20, LOOT_BOX_RARE_128 } from "@/lib/rp-assets";
import { EmptyCard, PanelShell } from "@/components/home-panel-shell";
import { LootboxReveal } from "@/components/lootbox-reveal";

export function ShopPanel({
  onBack,
  onCustomize,
}: {
  onBack: () => void;
  onCustomize: () => void;
}) {
  const { t } = useI18n();
  const { user, isGuest, profile, profileLoading, refetchProfile } = useAuth();
  const { catalogById, lootbox, loading, openLootbox } = useCosmetics(
    user && !isGuest ? user.id : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<OpenLootboxSuccess | null>(null);
  const [boxFailed, setBoxFailed] = useState(false);

  const balance = profile?.hirncoins ?? 0;
  const canAfford = balance >= lootbox.price_hc;
  const revealItem = reveal ? catalogById.get(reveal.item_id) : undefined;

  async function handleOpen() {
    if (busy || !canAfford) return;
    setError(null);
    setBusy(true);
    try {
      const requestId = crypto.randomUUID();
      const result = await openLootbox(requestId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await refetchProfile();
      setReveal(result);
    } finally {
      setBusy(false);
    }
  }

  if (!isGuest && profileLoading) {
    return (
      <PanelShell title={t.home.shop} onBack={onBack}>
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          {t.common.loading}
        </p>
      </PanelShell>
    );
  }

  if (isGuest || !profile) {
    return (
      <PanelShell title={t.home.shop} onBack={onBack}>
        <EmptyCard
          headline={t.cosmetics.shopNeedsAccountHeadline}
          body={t.cosmetics.shopNeedsAccountBody}
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
    <div className="relative flex min-h-0 flex-1 flex-col">
      <PanelShell title={t.home.shop} onBack={onBack}>
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 mb-5"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-md)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <p className="text-sm font-bold" style={{ color: "var(--rp-text)" }}>
            {t.cosmetics.hirncoins}
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
            {t.common.loading}
          </p>
        ) : (
          <article
            className="flex flex-col items-center px-4 py-6"
            style={{
              background: "var(--rp-bg-elevated)",
              borderRadius: "var(--rp-radius-lg)",
              boxShadow: "var(--rp-shadow-card)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={boxFailed ? LOOT_BOX_RARE_128 : lootbox.art_closed}
              alt=""
              width={160}
              height={160}
              className="h-40 w-40 object-contain"
              onError={() => setBoxFailed(true)}
            />
            <h2
              className="mt-3 text-xl font-extrabold"
              style={{ color: "var(--rp-text)" }}
            >
              {t.cosmetics.boxName}
            </h2>
            <p className="mt-1 text-sm font-bold" style={{ color: "var(--rp-text-secondary)" }}>
              {lootbox.price_hc} {t.cosmetics.hirncoins}
            </p>
            <p
              className="mt-4 text-center text-xs leading-relaxed"
              style={{ color: "var(--rp-text-secondary)" }}
            >
              {lootbox.weight_gewoehnlich} % {t.cosmetics.rarityGewoehnlich}
              {" · "}
              {lootbox.weight_selten} % {t.cosmetics.raritySelten}
              {" · "}
              {lootbox.weight_legendaer} % {t.cosmetics.rarityLegendaer}
            </p>
            <button
              type="button"
              onClick={() => void handleOpen()}
              disabled={busy || !canAfford}
              className="mt-5 h-12 w-full rounded-[var(--rp-radius-pill)] text-sm font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
                opacity: busy || !canAfford ? 0.5 : 1,
              }}
            >
              {busy
                ? t.cosmetics.opening
                : canAfford
                  ? t.cosmetics.open
                  : t.cosmetics.notEnoughShort}
            </button>
            {!canAfford && (
              <p className="mt-3 text-center text-xs font-medium" style={{ color: "var(--rp-danger)" }}>
                {t.cosmetics.notEnough}
              </p>
            )}
          </article>
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
          {t.cosmetics.shopFinePrint}
        </p>
      </PanelShell>

      {reveal && revealItem && (
        <LootboxReveal
          result={reveal}
          item={revealItem}
          artClosed={lootbox.art_closed}
          artOpen={lootbox.art_open}
          onDismiss={() => setReveal(null)}
          onCustomize={() => {
            setReveal(null);
            onCustomize();
          }}
        />
      )}
    </div>
  );
}
