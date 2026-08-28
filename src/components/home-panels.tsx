"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { xpProgressInLevel } from "@/lib/progression";
import { dailyPlayStreakDays } from "@/lib/daily-play-streak";
import { useMatchStats } from "@/lib/use-match-stats";
import { HIRNCOIN_ICON_48 } from "@/lib/rp-assets";
import { EmptyCard, PanelShell } from "@/components/home-panel-shell";
import { FriendsPanel } from "@/components/friends-panel";
import { ShopPanel } from "@/components/shop-panel";
import { SchleimiCustomizePanel } from "@/components/schleimi-customize-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { AchievementsPanel } from "@/components/achievements-panel";
import s from "@/components/stats-panel.module.css";

export type HomePanelId =
  | "friends"
  | "stats"
  | "achievements"
  | "shop"
  | "customize"
  | "settings";

function StatsPanel({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { user, isGuest, profile, profileLoading } = useAuth();
  const { games, wins } = useMatchStats(user && !isGuest ? user.id : null);

  if (!isGuest && profileLoading) {
    return (
      <PanelShell title={t.home.stats} onBack={onBack}>
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          {t.common.loading}
        </p>
      </PanelShell>
    );
  }

  if (isGuest || !profile) {
    return (
      <PanelShell title={t.home.stats} onBack={onBack}>
        <EmptyCard
          headline={t.home.connectAccount}
          body={t.settings.guestHint}
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

  const xp = xpProgressInLevel(profile.xp);
  const streakDays = dailyPlayStreakDays(profile);

  const gamesNum = games ?? 0;
  const winsNum = wins ?? 0;
  const gamesLoaded = games !== null;
  const winsLoaded = wins !== null;
  const ratioPercent =
    gamesNum > 0 ? Math.round((winsNum / gamesNum) * 100) : 0;

  return (
    <PanelShell title={t.home.stats} onBack={onBack}>
      <div className={s.container}>
        {/* ── 1) HERO — Level + XP bar ─────────────────────────── */}
        <div className={s.hero}>
          <span className={s.heroLabel}>LEVEL</span>
          <span className={s.heroLevel}>{xp.level}</span>
          <div
            className={s.xpBarTrack}
            role="progressbar"
            aria-valuenow={xp.current}
            aria-valuemin={0}
            aria-valuemax={xp.needed}
            aria-label="XP"
          >
            <div
              className={s.xpBarFill}
              style={{ width: `${Math.round(xp.ratio * 100)}%` }}
            />
          </div>
          <span className={s.xpCaption}>
            {xp.current} / {xp.needed} XP
          </span>
          <span className={s.xpTotal}>
            XP GESAMT&nbsp;&nbsp;{profile.xp.toLocaleString("de-DE")}
          </span>
        </div>

        {/* ── 2) Highlight 2-column grid ───────────────────────── */}
        <div className={s.highlightGrid}>
          <div className={`${s.tile} ${s.tileCoin}`}>
            <div className={s.tileLabelRow}>
              <Image
                src={HIRNCOIN_ICON_48}
                alt=""
                width={20}
                height={20}
                className={s.coinIcon}
                aria-hidden="true"
              />
              <span className={s.tileLabel}>HIRNCOINS</span>
            </div>
            <span className={s.tileNumber}>
              {profile.hirncoins.toLocaleString("de-DE")}
            </span>
          </div>

          <div className={`${s.tile} ${s.tileStreak}`}>
            <span className={s.tileLabel}>STREAK</span>
            <span className={s.tileNumber}>
              {streakDays === null ? "–" : streakDays}
            </span>
            <span className={s.tileSub}>TAGE</span>
          </div>
        </div>

        {/* ── 3) MATCHES card ──────────────────────────────────── */}
        <div className={s.matchesCard}>
          <div className={s.matchesTitle}>MATCHES</div>

          {gamesLoaded && gamesNum === 0 ? (
            <div className={s.matchesEmpty}>NOCH KEINE MATCHES</div>
          ) : (
            <>
              <div className={s.matchesCols}>
                <div className={s.matchesStat}>
                  <span className={s.matchesBig}>
                    {gamesLoaded ? gamesNum : "…"}
                  </span>
                  <span className={s.matchesCaption}>SPIELE</span>
                </div>
                <div className={s.matchesStat}>
                  <span className={s.matchesBig}>
                    {winsLoaded ? winsNum : "…"}
                  </span>
                  <span className={s.matchesCaption}>SIEGE</span>
                </div>
              </div>

              {gamesNum > 0 && (
                <>
                  <div
                    className={s.ratioBarTrack}
                    role="progressbar"
                    aria-valuenow={winsNum}
                    aria-valuemin={0}
                    aria-valuemax={gamesNum}
                    aria-label="Siegquote"
                  >
                    <div
                      className={s.ratioBarFill}
                      style={{ width: `${ratioPercent}%` }}
                    />
                  </div>
                  <div className={s.ratioCaption}>
                    {winsNum} / {gamesNum}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── 4) Disclaimer ────────────────────────────────────── */}
        <p className={s.disclaimer}>{t.home.statsDisclaimer}</p>
      </div>
    </PanelShell>
  );
}

export function HomePanel({
  id,
  onBack,
  onNavigate,
}: {
  id: HomePanelId;
  onBack: () => void;
  onNavigate: (panel: HomePanelId) => void;
}) {
  switch (id) {
    case "friends":
      return <FriendsPanel onBack={onBack} />;
    case "stats":
      return <StatsPanel onBack={onBack} />;
    case "achievements":
      return <AchievementsPanel onBack={onBack} />;
    case "shop":
      return (
        <ShopPanel onBack={onBack} onCustomize={() => onNavigate("customize")} />
      );
    case "customize":
      return <SchleimiCustomizePanel onBack={onBack} />;
    case "settings":
      return <SettingsPanel onBack={onBack} />;
  }
}
