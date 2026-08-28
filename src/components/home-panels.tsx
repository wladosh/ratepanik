"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { xpProgressInLevel } from "@/lib/progression";
import { dailyPlayStreakDays } from "@/lib/daily-play-streak";
import { useMatchStats } from "@/lib/use-match-stats";
import { EmptyCard, PanelShell } from "@/components/home-panel-shell";
import { FriendsPanel } from "@/components/friends-panel";
import { ShopPanel } from "@/components/shop-panel";
import { SchleimiCustomizePanel } from "@/components/schleimi-customize-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { AchievementsPanel } from "@/components/achievements-panel";

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
        <p className="text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
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

  const xp = xpProgressInLevel(profile.xp);
  const streakDays = dailyPlayStreakDays(profile);

  const rows: { label: string; value: string }[] = [
    { label: "Level", value: String(xp.level) },
    { label: t.home.statsXpTotal, value: String(profile.xp) },
    { label: t.home.statsXpInLevel, value: `${xp.current} / ${xp.needed}` },
    { label: t.cosmetics.hirncoins, value: String(profile.hirncoins) },
    { label: t.home.statsGames, value: games === null ? "…" : String(games) },
    { label: t.home.statsWins, value: wins === null ? "…" : String(wins) },
    { label: t.home.statsStreak, value: streakDays === null ? t.common.soon : String(streakDays) },
  ];

  return (
    <PanelShell title={t.home.stats} onBack={onBack}>
      {games === 0 && (
        <div className="mb-4">
            <EmptyCard
              headline={t.home.statsEmptyHeadline}
              body={t.home.statsEmptyBody}
            />
        </div>
      )}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="nb-card flex items-center justify-between px-4 py-3"
          >
            <span
              className="text-sm font-bold"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              {row.label}
            </span>
            <span
              className="text-sm font-black"
              style={{ color: "var(--rp-nb-text)" }}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      <p
        className="mt-4 text-xs leading-relaxed px-1 font-semibold"
        style={{ color: "var(--rp-nb-text-secondary)" }}
      >
        {t.home.statsDisclaimer}
      </p>
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
