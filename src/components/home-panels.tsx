"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { xpProgressInLevel } from "@/lib/progression";
import { dailyPlayStreakDays } from "@/lib/daily-play-streak";
import { BADGE_FIRST_WIN_48 } from "@/lib/rp-assets";
import { ACHIEVEMENT_UNLOCKED_COPY } from "@/lib/achievement-toast-context";
import {
  achievementBadgeSrc,
  useAchievements,
} from "@/lib/use-achievements";
import { useMatchStats } from "@/lib/use-match-stats";
import { EmptyCard, PanelShell } from "@/components/home-panel-shell";
import { FriendsPanel } from "@/components/friends-panel";
import { ShopPanel } from "@/components/shop-panel";
import { SchleimiCustomizePanel } from "@/components/schleimi-customize-panel";
import { SettingsPanel } from "@/components/settings-panel";

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
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: "var(--rp-bg-elevated)",
              borderRadius: "var(--rp-radius-md)",
              boxShadow: "var(--rp-shadow-card)",
            }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--rp-text-secondary)" }}
            >
              {row.label}
            </span>
            <span
              className="text-sm font-extrabold"
              style={{ color: "var(--rp-text)" }}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      <p
        className="mt-4 text-xs leading-relaxed px-1"
        style={{ color: "var(--rp-text-secondary)" }}
      >
        {t.home.statsDisclaimer}
      </p>
    </PanelShell>
  );
}

function AchievementsPanel({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { user, isGuest } = useAuth();
  const guestView = !user || isGuest;
  const { catalog, unlocked, loaded } = useAchievements(
    guestView ? null : user.id
  );

  return (
    <PanelShell title={t.home.achievements} onBack={onBack}>
      {isGuest && (
        <p
          className="text-sm mb-4 px-1"
          style={{ color: "var(--rp-text-secondary)" }}
        >
          Als Gast bleiben Erfolge gesperrt. Mit Konto sammelst du sie in Matches.
        </p>
      )}
      {!loaded ? (
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          {t.common.loading}
        </p>
      ) : catalog.length === 0 ? (
        <EmptyCard
          headline="Keine Erfolge"
          body="Der Katalog ist leer. Nach dem nächsten Content-Update erscheinen sie hier."
        />
      ) : (
        <ul className="space-y-3">
          {catalog.map((item) => {
            const isOn = unlocked.has(item.id);
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 p-3"
                style={{
                  background: "var(--rp-bg-elevated)",
                  borderRadius: "var(--rp-radius-md)",
                  boxShadow: "var(--rp-shadow-card)",
                  opacity: isOn ? 1 : 0.55,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={achievementBadgeSrc(item.icon_key)}
                  alt=""
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl object-contain shrink-0"
                  style={{ filter: isOn ? "none" : "grayscale(1)" }}
                  onError={(e) => {
                    e.currentTarget.src = BADGE_FIRST_WIN_48;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-extrabold truncate"
                    style={{ color: "var(--rp-text)" }}
                  >
                    {item.name_de}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: isOn ? "var(--rp-purple)" : "var(--rp-text-secondary)" }}
                  >
                    {isOn ? ACHIEVEMENT_UNLOCKED_COPY : t.home.locked}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
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
