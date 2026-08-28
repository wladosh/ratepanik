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
        <p className="text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
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
          className="nb-btn mt-4 flex h-11 items-center justify-center text-sm text-white"
          style={{ background: "var(--rp-nb-peach)" }}
        >
          {t.landing.login}
        </Link>
      </PanelShell>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <PanelShell title={t.home.shop} onBack={onBack}>
        <div className="nb-card flex items-center justify-between gap-3 px-4 py-3 mb-5">
          <p className="text-sm font-black uppercase" style={{ color: "var(--rp-nb-text)" }}>
            {t.cosmetics.hirncoins}
          </p>
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HIRNCOIN_ICON_20} alt="" width={20} height={20} className="w-5 h-5" />
            <span className="text-sm font-black" style={{ color: "var(--rp-nb-text)" }}>
              {profile.hirncoins}
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
            {t.common.loading}
          </p>
        ) : (
          <article className="nb-card-lg flex flex-col items-center px-4 py-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={boxFailed ? LOOT_BOX_RARE_128 : lootbox.art_closed}
              alt=""
              width={160}
              height={160}
              className="h-40 w-40 object-contain"
              style={{ filter: "drop-shadow(3px 3px 0 rgba(0,0,0,0.2))" }}
              onError={() => setBoxFailed(true)}
            />
            <h2 className="nb-heading mt-3 text-xl">
              {t.cosmetics.boxName}
            </h2>
            <p className="mt-1 text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
              {lootbox.price_hc} {t.cosmetics.hirncoins}
            </p>
            <p className="mt-4 text-center text-xs leading-relaxed font-semibold" style={{ color: "var(--rp-nb-text-secondary)" }}>
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
              className="nb-btn mt-5 h-12 w-full text-sm text-white"
              style={{ background: "var(--rp-nb-peach)" }}
            >
              {busy
                ? t.cosmetics.opening
                : canAfford
                  ? t.cosmetics.open
                  : t.cosmetics.notEnoughShort}
            </button>
            {!canAfford && (
              <p className="mt-3 text-center text-xs font-bold" style={{ color: "var(--rp-nb-red)" }}>
                {t.cosmetics.notEnough}
              </p>
            )}
          </article>
        )}

        {error && (
          <p className="mt-4 text-center text-sm font-bold" style={{ color: "var(--rp-nb-red)" }}>
            {error}
          </p>
        )}

        <p className="mt-5 text-xs leading-relaxed px-1 font-semibold" style={{ color: "var(--rp-nb-text-secondary)" }}>
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
