"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { xpProgressInLevel } from "@/lib/progression";
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

export type HomePanelId = "friends" | "stats" | "achievements" | "shop";

function StatsPanel({ onBack }: { onBack: () => void }) {
  const { user, isGuest, profile, profileLoading } = useAuth();
  const { games, wins } = useMatchStats(user && !isGuest ? user.id : null);

  if (!isGuest && profileLoading) {
    return (
      <PanelShell title="Statistik" onBack={onBack}>
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          Laden…
        </p>
      </PanelShell>
    );
  }

  if (isGuest || !profile) {
    return (
      <PanelShell title="Statistik" onBack={onBack}>
        <EmptyCard
          headline="Stats brauchen ein Konto"
          body="Als Gast speichern wir keine XP, Spiele oder Siege. Melde dich an, dann zählen die Matches hier."
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

  const xp = xpProgressInLevel(profile.xp);
  const streak = profile.current_streak ?? 0;

  const rows: { label: string; value: string }[] = [
    { label: "Level", value: String(xp.level) },
    { label: "XP gesamt", value: String(profile.xp) },
    { label: "XP in diesem Level", value: `${xp.current} / ${xp.needed}` },
    { label: "Hirncoins", value: String(profile.hirncoins) },
    { label: "Spiele beendet", value: games === null ? "…" : String(games) },
    { label: "Siege", value: wins === null ? "…" : String(wins) },
    { label: "Tage-Streak", value: String(streak) },
  ];

  return (
    <PanelShell title="Statistik" onBack={onBack}>
      {games === 0 && (
        <div className="mb-4">
          <EmptyCard
            headline="Noch keine Spiele"
            body="Level, XP und Hirncoins kommen aus echten Matches. Spiel eine Runde, dann füllen sich die Zahlen."
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
        Nur echte Match-Daten. Level schaltet noch nichts frei.
      </p>
    </PanelShell>
  );
}

function AchievementsPanel({ onBack }: { onBack: () => void }) {
  const { user, isGuest } = useAuth();
  const guestView = !user || isGuest;
  const { catalog, unlocked, loaded } = useAchievements(
    guestView ? null : user.id
  );

  return (
    <PanelShell title="Erfolge" onBack={onBack}>
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
          Laden…
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
                    {isOn ? ACHIEVEMENT_UNLOCKED_COPY : "Noch nicht"}
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
}: {
  id: HomePanelId;
  onBack: () => void;
}) {
  switch (id) {
    case "friends":
      return <FriendsPanel onBack={onBack} />;
    case "stats":
      return <StatsPanel onBack={onBack} />;
    case "achievements":
      return <AchievementsPanel onBack={onBack} />;
    case "shop":
      return <ShopPanel onBack={onBack} />;
  }
}
