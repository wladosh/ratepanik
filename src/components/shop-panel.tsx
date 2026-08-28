"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useCosmetics, type LootboxView, type OpenLootboxSuccess } from "@/lib/use-cosmetics";
import { HIRNCOIN_ICON_20, LOOT_BOX_RARE_128 } from "@/lib/rp-assets";
import { EmptyCard, PanelShell } from "@/components/home-panel-shell";
import { LootboxReveal } from "@/components/lootbox-reveal";
import {
  LOOTBOX_BASIC_ID,
  LOOTBOX_DEFS,
  lootboxDefById,
  type LootboxDef,
  type LootboxId,
} from "@/lib/schleimi-catalog";
import { getDailyDeal, type DailyDeal } from "@/lib/daily-deal";

function useDailyDeal(): DailyDeal {
  return useMemo(() => getDailyDeal(), []);
}

function CrateCard({
  def,
  lootboxView,
  deal,
  balance,
  busy,
  onOpen,
}: {
  def: LootboxDef;
  lootboxView: LootboxView | undefined;
  deal: DailyDeal;
  balance: number;
  busy: boolean;
  onOpen: (boxId: LootboxId, useDeal: boolean) => void;
}) {
  const { t, locale } = useI18n();
  const [imgFailed, setImgFailed] = useState(false);

  const isDeal = deal.boxId === def.id;
  const effectivePrice = isDeal ? deal.dealPrice : def.price_hc;
  const canAfford = balance >= effectivePrice;
  const isHero = def.id === LOOTBOX_BASIC_ID;
  const artClosed = def.art_closed ?? lootboxView?.art_closed ?? "/rp/schleimi/lootbox_closed.png";

  const name = locale === "de" ? def.name_de : def.name_en;
  const subtitle = locale === "de" ? def.subtitle_de : def.subtitle_en;

  return (
    <article
      className="nb-card relative flex flex-col items-center px-4 py-5 overflow-hidden"
      style={{
        border: isDeal ? `3px solid ${def.accent}` : undefined,
      }}
    >
      {isDeal && (
        <span
          className="absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
          style={{ background: def.accent }}
        >
          {t.cosmetics.dealBadge}
        </span>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgFailed ? LOOT_BOX_RARE_128 : artClosed}
        alt=""
        width={isHero ? 128 : 96}
        height={isHero ? 128 : 96}
        className="object-contain"
        style={{
          width: isHero ? 128 : 96,
          height: isHero ? 128 : 96,
          filter: "drop-shadow(3px 3px 0 rgba(0,0,0,0.2))",
        }}
        onError={() => setImgFailed(true)}
      />

      <h3 className="nb-heading mt-2 text-sm">
        {name}
      </h3>
      <p
        className="text-xs font-bold"
        style={{ color: def.accent }}
      >
        {subtitle}
      </p>

      <div className="mt-2 flex items-center gap-1.5">
        {isDeal ? (
          <>
            <span
              className="text-xs font-bold line-through"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              {def.price_hc}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HIRNCOIN_ICON_20} alt="" width={16} height={16} className="w-4 h-4" />
            <span className="text-sm font-black" style={{ color: def.accent }}>
              {deal.dealPrice}
            </span>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HIRNCOIN_ICON_20} alt="" width={16} height={16} className="w-4 h-4" />
            <span className="text-sm font-black" style={{ color: "var(--rp-nb-text)" }}>
              {def.price_hc}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpen(def.id, isDeal)}
        disabled={busy || !canAfford}
        className="nb-btn mt-3 h-10 w-full text-xs text-white"
        style={{ background: canAfford ? def.accent : "var(--rp-nb-text-secondary)" }}
      >
        {busy
          ? t.cosmetics.opening
          : canAfford
            ? t.cosmetics.open
            : t.cosmetics.notEnoughShort}
      </button>
    </article>
  );
}

export function ShopPanel({
  onBack,
  onCustomize,
}: {
  onBack: () => void;
  onCustomize: () => void;
}) {
  const { t, locale } = useI18n();
  const { user, isGuest, profile, profileLoading, refetchProfile } = useAuth();
  const { catalogById, lootboxMap, loading, openLootbox } = useCosmetics(
    user && !isGuest ? user.id : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<OpenLootboxSuccess | null>(null);
  const [activeBoxId, setActiveBoxId] = useState<LootboxId>(LOOTBOX_BASIC_ID);

  const deal = useDailyDeal();
  const balance = profile?.hirncoins ?? 0;
  const revealItem = reveal ? catalogById.get(reveal.item_id) : undefined;

  const activeLootbox = lootboxMap.get(activeBoxId) ?? lootboxMap.get(LOOTBOX_BASIC_ID);

  async function handleOpen(boxId: LootboxId, useDeal: boolean) {
    if (busy) return;
    setError(null);
    setBusy(true);
    setActiveBoxId(boxId);
    try {
      const requestId = crypto.randomUUID();
      const result = await openLootbox(requestId, boxId, useDeal);
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

        {/* Daily deal banner */}
        <div
          className="nb-card mb-4 flex items-center gap-2 px-3 py-2"
          style={{ border: `3px solid ${deal.def.accent}` }}
        >
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
            style={{ background: deal.def.accent }}
          >
            {t.cosmetics.dealBadge}
          </span>
          <span className="text-xs font-black uppercase" style={{ color: "var(--rp-nb-text)" }}>
            {t.cosmetics.dailyDeal}:
          </span>
          <span className="text-xs font-bold" style={{ color: deal.def.accent }}>
            {locale === "de" ? deal.def.name_de : deal.def.name_en} −30%
          </span>
        </div>

        {loading ? (
          <p className="text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
            {t.common.loading}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {LOOTBOX_DEFS.map((def) => (
              <CrateCard
                key={def.id}
                def={def}
                lootboxView={lootboxMap.get(def.id)}
                deal={deal}
                balance={balance}
                busy={busy}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}

        {error && (
          <p className="mt-4 text-center text-sm font-bold" style={{ color: "var(--rp-nb-red)" }}>
            {error}
          </p>
        )}
      </PanelShell>

      {reveal && revealItem && activeLootbox && (
        <LootboxReveal
          result={reveal}
          item={revealItem}
          artClosed={lootboxDefById(activeBoxId)?.art_closed ?? activeLootbox.art_closed}
          artOpen={lootboxDefById(activeBoxId)?.art_open ?? activeLootbox.art_open}
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
