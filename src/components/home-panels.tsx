"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { ACHIEVEMENTS, type AchievementId } from "@/lib/rp-assets";
import { xpProgressInLevel } from "@/lib/progression";
import { EmptyCard, PanelShell } from "@/components/home-panel-shell";
import { FriendsPanel } from "@/components/friends-panel";

export type HomePanelId = "friends" | "stats" | "achievements" | "shop";

const CATALOG_IDS = Object.keys(ACHIEVEMENTS) as AchievementId[];

function ShopPanel({ onBack }: { onBack: () => void }) {
  return (
    <PanelShell title="Shop" onBack={onBack}>
      <EmptyCard
        kicker="Bald"
        headline="Shop kommt später"
        body="Lootboxen und Cosmetics sind für Phase C geplant. Hirncoins sammelst du trotzdem schon am Match-Ende."
      />
    </PanelShell>
  );
}

function StatsPanel({ onBack }: { onBack: () => void }) {
  const { user, isGuest, profile, profileLoading } = useAuth();
  const [games, setGames] = useState<number | null>(null);
  const [wins, setWins] = useState<number | null>(null);

  useEffect(() => {
    if (!user || isGuest) return;

    const supabase = createBrowserSupabase();
    let cancelled = false;

    (async () => {
      const [gamesRes, winsRes] = await Promise.all([
        supabase
          .from("match_rewards")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("match_rewards")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("placement", 1),
      ]);
      if (cancelled) return;
      setGames(gamesRes.count ?? 0);
      setWins(winsRes.count ?? 0);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isGuest]);

  if (!isGuest && profileLoading) {
    return (
      <PanelShell title="Stats" onBack={onBack}>
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          Laden…
        </p>
      </PanelShell>
    );
  }

  if (isGuest || !profile) {
    return (
      <PanelShell title="Stats" onBack={onBack}>
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
    { label: "XP in diesem Level", value: `${xp.current} / ${xp.needed}` },
    { label: "Hirncoins", value: String(profile.hirncoins) },
    { label: "Spiele beendet", value: games === null ? "…" : String(games) },
    { label: "Siege", value: wins === null ? "…" : String(wins) },
    { label: "Tage-Streak", value: String(streak) },
  ];

  return (
    <PanelShell title="Stats" onBack={onBack}>
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
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (guestView || !user) return;

    const supabase = createBrowserSupabase();
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);

      if (cancelled) return;
      setUnlocked(new Set((data ?? []).map((r: { achievement_id: string }) => r.achievement_id)));
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [guestView, user]);

  const ready = guestView || loaded;

  return (
    <PanelShell title="Achievements" onBack={onBack}>
      {isGuest && (
        <p
          className="text-sm mb-4 px-1"
          style={{ color: "var(--rp-text-secondary)" }}
        >
          Als Gast bleiben Erfolge gesperrt. Mit Konto sammelst du sie in Matches.
        </p>
      )}
      <ul className="space-y-3">
        {CATALOG_IDS.map((id) => {
          const meta = ACHIEVEMENTS[id];
          const isOn = unlocked.has(id);
          return (
            <li
              key={id}
              className="flex items-center gap-3 p-3"
              style={{
                background: "var(--rp-bg-elevated)",
                borderRadius: "var(--rp-radius-md)",
                boxShadow: "var(--rp-shadow-card)",
                opacity: ready && !isOn ? 0.55 : 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meta.badge48}
                alt=""
                width={48}
                height={48}
                className="w-12 h-12 rounded-xl object-contain shrink-0"
                style={{ filter: ready && !isOn ? "grayscale(1)" : "none" }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-extrabold truncate"
                  style={{ color: "var(--rp-text)" }}
                >
                  {meta.name_de}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--rp-text-secondary)" }}
                >
                  {!ready ? "…" : isOn ? "Freigeschaltet" : "Noch nicht"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
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
