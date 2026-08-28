"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { generateGuestName } from "@/lib/guest-name";
import { xpProgressInLevel } from "@/lib/progression";
import { HIRNCOIN_ICON_20 } from "@/lib/rp-assets";
import { HomePanel, type HomePanelId } from "@/components/home-panels";
import { SchleimiPreview } from "@/components/schleimi-preview";
import { useCosmetics } from "@/lib/use-cosmetics";
import { guestLayers } from "@/lib/schleimi-layers";
import { dailyPlayStreakDays } from "@/lib/daily-play-streak";
import { HomeDashboardCards } from "@/components/home-dashboard-cards";
import { useI18n } from "@/lib/i18n-context";
import { useAchievements } from "@/lib/use-achievements";
import { useMatchStats } from "@/lib/use-match-stats";
import { createBrowserSupabase } from "@/lib/supabase/client";

function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function StreakCard({
  days,
  loading,
}: {
  days: number | null;
  loading: boolean;
}) {
  const { t } = useI18n();
  const label = loading ? "…" : days === null ? t.common.soon : String(days);
  const copy = loading
    ? t.home.streakLoading
    : days === null
      ? t.home.streakNull
      : days <= 0
        ? t.home.streakZero
        : days < 3
          ? t.home.streakBuilding
          : t.home.streakActive;

  return (
    <div
      className="flex items-center gap-3 p-4 mb-4"
      style={{
        background: "var(--rp-paper-cream)",
        backgroundImage: "var(--rp-paper-grain)",
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
        backgroundBlendMode: "overlay",
        borderRadius: 6,
        boxShadow: "0 4px 14px var(--rp-paper-shadow)",
      }}
    >
      <span className="text-2xl" role="img" aria-label={t.home.streakAria}>
        🔥
      </span>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-[var(--rp-text)]">{t.home.streakTitle}</h4>
        <p className="text-[10px] text-[var(--rp-text-secondary)]">{copy}</p>
      </div>
      <span
        className={`min-w-9 h-9 px-1.5 flex items-center justify-center rounded-full font-bold ${
          loading || days === null ? "text-xs" : "text-base"
        }`}
        style={{ background: "#FFF0F0", color: "var(--rp-danger)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function HomeScreen() {
  const game = useGame();
  const { t } = useI18n();
  const { user, canHost, isGuest, loading: authLoading, profile, profileLoading, refetchProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!user || isGuest) return;
    void refetchProfile();
  }, [user, isGuest, refetchProfile]);

  const displayName =
    profile?.username ||
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    t.common.player;
  const streakDays = dailyPlayStreakDays(profile);

  const initialJoinCode = useMemo(() => {
    const raw = searchParams.get("join");
    if (!raw) return "";
    const sanitized = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    return sanitized.length === 6 ? sanitized : "";
  }, [searchParams]);

  const [roomCode, setRoomCode] = useState(initialJoinCode);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [panel, setPanel] = useState<HomePanelId | null>(null);
  const { catalog: achievementCatalog, unlocked: achievementUnlocked, loaded: achievementsLoaded } =
    useAchievements(user && !isGuest ? user.id : null);
  const { games: matchGames } = useMatchStats(user && !isGuest ? user.id : null);
  const { equippedItems, refetch: refetchCosmetics } = useCosmetics(
    user && !isGuest ? user.id : null,
  );
  const headerLayers = isGuest ? guestLayers(user?.id ?? "guest") : equippedItems;
  const prevPanelRef = useRef<HomePanelId | null>(null);
  useEffect(() => {
    if (prevPanelRef.current && !panel) {
      void refetchCosmetics();
      void refetchProfile();
    }
    prevPanelRef.current = panel;
  }, [panel, refetchCosmetics, refetchProfile]);
  const [friendCountResult, setFriendCountResult] = useState<{ userId: string; count: number } | null>(null);
  const friendCount =
    user && !isGuest && friendCountResult?.userId === user.id
      ? friendCountResult.count
      : null;

  useEffect(() => {
    if (!user || isGuest) return;
    const supabase = createBrowserSupabase();
    let cancelled = false;
    const userId = user.id;
    void supabase
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .then(({ count }) => {
        if (!cancelled) setFriendCountResult({ userId, count: count ?? 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [user, isGuest]);

  const xpProgress = useMemo(() => {
    if (!profile) return null;
    return xpProgressInLevel(profile.xp);
  }, [profile]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  async function handleCreate() {
    if (!canHost) {
      router.push("/auth/login");
      return;
    }
    if (!user?.id) return;
    await game.createRoom(displayName, user.id);
  }

  async function handleJoin() {
    const trimmedCode = roomCode.trim();
    if (trimmedCode.length !== 6) {
      setJoinError(t.home.joinCodeLength);
      return;
    }
    setJoinError(null);
    const playerName = displayName || generateGuestName();
    const err = await game.joinRoom(trimmedCode, playerName);
    if (err) setJoinError(err);
  }

  if (authLoading) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "var(--rp-bg-hero)" }}
      >
        <div className="text-lg text-[var(--rp-text-secondary)] animate-pulse font-medium">
          {t.common.loading}
        </div>
      </div>
    );
  }

  if (panel) {
    return (
      <HomePanel
        id={panel}
        onBack={() => setPanel(null)}
        onNavigate={setPanel}
      />
    );
  }

  return (
    <div
      className="rp-home-root absolute inset-0 flex flex-col overflow-hidden"
      style={{
        background: "var(--rp-paper-bg)",
        backgroundImage: "var(--rp-paper-grain)",
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      {/* ── Toast overlay ──────────────────────── */}
      {toastMsg && (
        <div
          className="rp-shell-banner rounded-lg px-6 py-3 text-center font-bold text-white shadow-xl animate-fade-in"
          style={{ background: "var(--rp-purple)" }}
        >
          {toastMsg}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8">
        {/* ── Header ──────────────────────────────── */}
        <header className="py-4">
          <div className="flex items-center gap-3">
            {/* Avatar + Level badge */}
            <button
              onClick={() =>
                isGuest ? showToast(t.cosmetics.customizeNeedsAccountHeadline) : setPanel("customize")
              }
              className="relative shrink-0"
              aria-label={t.cosmetics.customizeAria}
            >
              <span
                className="block overflow-hidden"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "var(--rp-paper-cream)",
                  boxShadow: "0 3px 10px var(--rp-paper-shadow-light)",
                }}
              >
                <SchleimiPreview layers={headerLayers} size={48} label={displayName} />
              </span>
              {!isGuest && xpProgress && (
                <span
                  className="absolute flex items-center justify-center"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: "var(--rp-level)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    lineHeight: 1,
                    bottom: -6,
                    left: -6,
                    border: "2px solid var(--rp-paper-bg)",
                    boxShadow: "0 2px 6px rgba(139,124,255,0.25)",
                  }}
                  aria-label={`Level ${xpProgress.level}`}
                >
                  {xpProgress.level}
                </span>
              )}
            </button>

            {/* Name + XP under name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <h2
                    className="truncate"
                    style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25, color: "#2a2a3a" }}
                  >
                    {displayName}
                  </h2>
                  {!isGuest && xpProgress ? (
                    <p
                      className="truncate"
                      style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: "#8b7caa" }}
                    >
                      XP {xpProgress.current} / {xpProgress.needed}
                    </p>
                  ) : (
                    <p
                      className="truncate"
                      style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, color: "#8b8ba0" }}
                    >
                      {isGuest ? t.common.guest : t.home.partyPlayer}
                    </p>
                  )}
                </div>

                {/* Hirncoin pill — paper chip style */}
                {!isGuest && profile && (
                  <button
                    onClick={() => setPanel("shop")}
                    className="flex items-center gap-1.5 shrink-0"
                    style={{
                      height: 32,
                      padding: "6px 12px",
                      background: "var(--rp-hirncoin-soft)",
                      borderRadius: 8,
                      boxShadow: "0 2px 6px var(--rp-paper-shadow-light)",
                    }}
                    aria-label={`Hirncoins: ${profile.hirncoins}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={HIRNCOIN_ICON_20}
                      alt=""
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <span
                      style={{ fontSize: 14, fontWeight: 700, color: "#5a4a20" }}
                    >
                      {profile.hirncoins}
                    </span>
                  </button>
                )}

                {/* Settings gear — paper chip */}
                <button
                  onClick={() => setPanel("settings")}
                  className="flex items-center justify-center transition-colors hover:bg-black/5 shrink-0"
                  style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.5)", boxShadow: "0 2px 6px var(--rp-paper-shadow-light)" }}
                  aria-label={t.home.settingsAria}
                  title={t.home.settingsAria}
                >
                  <GearIcon className="w-5 h-5 text-[#8b8ba0]" />
                </button>
              </div>

              {/* XP bar (logged-in only) */}
              {!isGuest && xpProgress && (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      height: 7,
                      borderRadius: 4,
                      background: "rgba(139,124,255,0.14)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 4,
                        background: "linear-gradient(90deg, #c9b8ff, #8b7cff)",
                        width: `${Math.min(xpProgress.ratio * 100, 100)}%`,
                        transition: "width 500ms ease-out",
                        animation: "xp-fill 500ms ease-out",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <HomeDashboardCards
          roomCode={roomCode}
          joinError={joinError}
          loading={game.loading}
          isGuest={isGuest}
          friendCount={friendCount}
          level={profile ? (xpProgress?.level ?? profile.level) : null}
          matchGames={matchGames}
          achievementsLoaded={achievementsLoaded}
          achievementsUnlocked={achievementUnlocked.size}
          achievementsTotal={achievementCatalog.length}
          onCreate={handleCreate}
          onJoin={handleJoin}
          onCodeChange={(value) => {
            setRoomCode(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
            setJoinError(null);
          }}
          onOpenPanel={setPanel}
        />

        {/* ── Streak card (calendar-day play streak, same as streak_3) ── */}
        {!isGuest && (
          <StreakCard
            days={streakDays}
            loading={profileLoading && streakDays === null}
          />
        )}
      </div>

      {/* ── Bottom nav ────────────────────────────── */}
      <nav
        className="shrink-0 flex items-center justify-around px-2 py-2"
        style={{
          background: "var(--rp-paper-cream)",
          borderTop: "1px solid rgba(180,160,140,0.15)",
          boxShadow: "0 -2px 10px rgba(120,100,80,0.06)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
        }}
      >
        <button className="flex flex-col items-center gap-0.5 py-1 px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rp/rp_nav_home_24.svg" alt="" width={24} height={24} className="w-6 h-6" />
          <span className="text-[10px] font-bold" style={{ color: "var(--rp-peach)" }}>{t.home.navStart}</span>
        </button>
        <button
          onClick={() => setPanel("shop")}
          className="flex flex-col items-center gap-0.5 py-1 px-2"
          style={{ color: "#9a9aaa" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rp/rp_nav_quiz_24.svg" alt="" width={24} height={24} className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t.home.navQuiz}</span>
        </button>
        <button
          onClick={() => document.getElementById("join-title")?.scrollIntoView({ behavior: "smooth" })}
          className="flex flex-col items-center gap-0.5 py-1 px-2"
          style={{ color: "#9a9aaa" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rp/rp_nav_play_24.svg" alt="" width={24} height={24} className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t.home.navPlay}</span>
        </button>
        <button
          onClick={() => setPanel("achievements")}
          className="flex flex-col items-center gap-0.5 py-1 px-2"
          style={{ color: "#9a9aaa" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rp/rp_nav_rank_24.svg" alt="" width={24} height={24} className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t.home.navRank}</span>
        </button>
        <button
          onClick={() => setPanel("settings")}
          className="flex flex-col items-center gap-0.5 py-1 px-2"
          style={{ color: "#9a9aaa" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rp/rp_nav_profile_24.svg" alt="" width={24} height={24} className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t.home.navProfile}</span>
        </button>
      </nav>
    </div>
  );
}
