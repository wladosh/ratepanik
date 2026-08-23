"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { generateGuestName } from "@/lib/guest-name";
import { xpProgressInLevel } from "@/lib/progression";
import { avatarSrc, HIRNCOIN_ICON_20, XP_BADGE_16 } from "@/lib/rp-assets";
import { HomePanel, type HomePanelId } from "@/components/home-panels";

function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const FALLBACK_AVATAR = "/rp/rp_avatar_default_01_128@2x.png";

export function HomeScreen() {
  const game = useGame();
  const { user, canHost, isGuest, signOut, loading: authLoading, profile, refetchProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user && !isGuest) {
      refetchProfile();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayName =
    profile?.username ||
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Spieler";

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
      setJoinError("Code muss genau 6 Zeichen haben.");
      return;
    }
    setJoinError(null);
    const playerName = displayName || generateGuestName();
    await game.joinRoom(trimmedCode, playerName);
  }

  function handleToast() {
    showToast("Bald");
  }

  if (authLoading) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "var(--rp-bg-hero)" }}
      >
        <div className="text-lg text-[var(--rp-text-secondary)] animate-pulse font-medium">
          Laden...
        </div>
      </div>
    );
  }

  if (panel) {
    return <HomePanel id={panel} onBack={() => setPanel(null)} />;
  }

  return (
    <div
      className="rp-home-root flex flex-1 flex-col"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      {/* ── Toast overlay ──────────────────────── */}
      {toastMsg && (
        <div
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-6 py-3 text-center font-bold text-white shadow-xl animate-fade-in"
          style={{ background: "var(--rp-purple)" }}
        >
          {toastMsg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {/* ── Header ──────────────────────────────── */}
        <header className="py-4">
          <div className="flex items-center gap-3">
            {/* Avatar + Level badge */}
            <button
              onClick={() => showToast("Bald")}
              className="relative shrink-0"
              aria-label="Profil"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile ? avatarSrc(profile.avatar_id) : FALLBACK_AVATAR}
                alt={displayName}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
              {!isGuest && xpProgress && (
                <span
                  className="absolute flex items-center justify-center"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--rp-level)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    lineHeight: 1,
                    bottom: -4,
                    left: -4,
                    border: "2px solid #fff",
                  }}
                  aria-label={`Level ${xpProgress.level}`}
                >
                  {xpProgress.level}
                </span>
              )}
            </button>

            {/* Name + Title + XP */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <h2
                    className="truncate text-[var(--rp-text)]"
                    style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25 }}
                  >
                    {displayName}
                  </h2>
                  <p
                    className="text-[var(--rp-text-secondary)] truncate"
                    style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}
                  >
                    {isGuest ? "Gast" : "Party-Spieler"}
                  </p>
                </div>

                {/* Hirncoin pill */}
                {!isGuest && profile && (
                  <button
                    onClick={() => setPanel("shop")}
                    className="flex items-center gap-1.5 shrink-0"
                    style={{
                      height: 32,
                      padding: "8px 12px",
                      background: "var(--rp-hirncoin-soft)",
                      borderRadius: 999,
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
                      className="text-[var(--rp-text)]"
                      style={{ fontSize: 14, fontWeight: 700 }}
                    >
                      {profile.hirncoins}
                    </span>
                  </button>
                )}

                {/* Settings gear */}
                <button
                  onClick={signOut}
                  className="flex items-center justify-center rounded-full transition-colors hover:bg-black/5 shrink-0"
                  style={{ width: 40, height: 40 }}
                  aria-label="Abmelden"
                  title="Abmelden"
                >
                  <GearIcon className="w-5 h-5 text-[var(--rp-text-secondary)]" />
                </button>
              </div>

              {/* XP bar (logged-in only) */}
              {!isGuest && xpProgress && (
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      background: "var(--rp-xp-track)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 999,
                        background: "var(--rp-xp)",
                        width: `${Math.min(xpProgress.ratio * 100, 100)}%`,
                        transition: "width 500ms ease-out",
                        animation: "xp-fill 500ms ease-out",
                      }}
                    />
                  </div>
                  <p
                    className="flex items-center gap-1 text-[var(--rp-text-secondary)]"
                    style={{ fontSize: 11, fontWeight: 500, marginTop: 2 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={XP_BADGE_16} alt="" width={14} height={14} className="w-3.5 h-3.5" />
                    XP {xpProgress.current} / {xpProgress.needed}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Hero card ───────────────────────────── */}
        <div
          className="relative overflow-hidden p-5 mb-4"
          style={{
            background: "linear-gradient(135deg, #D8CCFF 0%, #C9C0FF 40%, #B8D4FF 100%)",
            borderRadius: "var(--rp-radius-lg)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-3 left-[15%] w-1.5 h-1.5 rounded-full bg-white/50" />
            <div className="absolute top-6 right-[20%] w-2 h-2 rounded-full bg-[var(--rp-pink)] opacity-40" />
            <div className="absolute bottom-4 left-[10%] w-1 h-3 rounded-full bg-[var(--rp-yellow)] opacity-40 rotate-45" />
            <div className="absolute top-8 left-[40%] w-1.5 h-1.5 rounded-full bg-[var(--rp-mint)] opacity-50" />
            <div className="absolute bottom-6 right-[15%] w-1 h-3 rounded-full bg-white/40 -rotate-12" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-extrabold text-[var(--rp-text)] leading-tight mb-1">
                Werde<br />Ratepanik-Champion
              </h3>
              <p className="text-xs text-[var(--rp-text-secondary)] leading-snug">
                Gewinne Runden, sammle Punkte<br />und hol dir den Champion-Pokal!
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/rp/rp_trophy_gold_512.png"
              alt="Trophy"
              width={96}
              height={96}
              className="shrink-0 drop-shadow-[0_6px_20px_rgba(255,214,107,0.5)]"
            />
          </div>
        </div>

        {/* ── Raum erstellen ──────────────────────── */}
        <button
          onClick={handleCreate}
          disabled={game.loading}
          className="w-full flex items-center gap-4 p-4 mb-3 transition-all active:scale-[0.98] disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #FFECD2 0%, #FFE0CC 100%)",
            borderRadius: "var(--rp-radius-md)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <div
            className="w-11 h-11 flex items-center justify-center rounded-xl shrink-0"
            style={{ background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)" }}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-base font-bold text-[var(--rp-text)]">
              {game.loading ? "Erstelle Raum…" : "Raum erstellen"}
            </h3>
            <p className="text-xs text-[var(--rp-text-secondary)]">
              Erstelle deinen eigenen<br />Quiz-Raum und lade Freunde ein!
            </p>
          </div>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[var(--rp-text-secondary)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* ── Beitreten card ──────────────────────── */}
        <div
          className="w-full p-4 mb-4"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-md)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <h3 className="text-base font-bold text-[var(--rp-text)] mb-0.5">Beitreten</h3>
          <p className="text-xs text-[var(--rp-text-secondary)] mb-3">
            Tritt einem Spiel mit einem Code bei
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={roomCode[i] ?? ""}
                  readOnly
                  tabIndex={-1}
                  className="w-full aspect-square max-w-[42px] rounded-xl border-2 text-center text-lg font-bold text-[var(--rp-text)] bg-[#F5F3FF]"
                  style={{ borderColor: "var(--rp-border)" }}
                  aria-label={`Code Stelle ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={handleJoin}
              disabled={roomCode.trim().length !== 6 || game.loading}
              className="h-10 px-5 rounded-full text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-40 shrink-0"
              style={{
                background: roomCode.trim().length === 6
                  ? "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)"
                  : "var(--rp-peach)",
                color: "white",
              }}
            >
              {game.loading ? "..." : "Beitreten"}
            </button>
          </div>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
              setJoinError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Code eingeben"
            maxLength={6}
            className="w-full h-10 mt-2 rounded-xl border-2 px-4 text-sm font-medium text-[var(--rp-text)] placeholder:text-gray-300 transition-all focus:outline-none"
            style={{
              borderColor: joinError ? "var(--rp-danger)" : "var(--rp-border)",
              background: "#FAFAFA",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--rp-focus-ring)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 124, 255, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = joinError ? "var(--rp-danger)" : "var(--rp-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {joinError && (
            <p className="mt-1 text-xs text-[var(--rp-danger)] font-medium">{joinError}</p>
          )}
        </div>

        {/* ── 2×2 feature grid ────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => setPanel("friends")}
            className="flex items-center gap-3 p-3.5 transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #D6ECFF 0%, #C8E0FF 100%)",
              borderRadius: "var(--rp-radius-md)",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(126, 182, 255, 0.3)" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-sky)">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-[var(--rp-text)]">Freunde</span>
              <p className="text-[10px] text-[var(--rp-text-secondary)] leading-tight">Bald</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--rp-text-secondary)] ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setPanel("stats")}
            className="flex items-center gap-3 p-3.5 transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #EDE6FF 0%, #DDD4FF 100%)",
              borderRadius: "var(--rp-radius-md)",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139, 124, 255, 0.2)" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-purple)">
                <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-[var(--rp-text)]">Statistik</span>
              <p className="text-[10px] text-[var(--rp-text-secondary)] leading-tight">XP, Level, Spiele</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--rp-text-secondary)] ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setPanel("achievements")}
            className="flex items-center gap-3 p-3.5 transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #FFF5D6 0%, #FFEDB8 100%)",
              borderRadius: "var(--rp-radius-md)",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255, 214, 107, 0.3)" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-yellow)">
                <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-[var(--rp-text)]">Erfolge</span>
              <p className="text-[10px] text-[var(--rp-text-secondary)] leading-tight">Deine Erfolge<br />und Abzeichen</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--rp-text-secondary)] ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setPanel("shop")}
            className="flex items-center gap-3 p-3.5 transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #D6FFF0 0%, #C0F5E0 100%)",
              borderRadius: "var(--rp-radius-md)",
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(111, 207, 178, 0.25)" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-mint)">
                <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-13c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-[var(--rp-text)]">Shop</span>
              <p className="text-[10px] text-[var(--rp-text-secondary)] leading-tight">Bald</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--rp-text-secondary)] ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ── Streak card ─────────────────────────── */}
        {!isGuest && (
          <div
            className="flex items-center gap-3 p-4 mb-4"
            style={{
              background: "var(--rp-bg-elevated)",
              borderRadius: "var(--rp-radius-md)",
              boxShadow: "var(--rp-shadow-card)",
            }}
          >
            <span className="text-2xl" role="img" aria-label="Feuer">🔥</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-[var(--rp-text)]">Streak</h4>
              <p className="text-[10px] text-[var(--rp-text-secondary)]">
                {(profile?.current_streak ?? 0) >= 3
                  ? "Kalendertage in Folge gespielt."
                  : "Spiele an 3 Tagen in Folge für den Streak-Erfolg."}
              </p>
            </div>
            <span
              className="w-9 h-9 flex items-center justify-center rounded-full text-base font-bold"
              style={{ background: "#FFF0F0", color: "var(--rp-danger)" }}
            >
              {profile?.current_streak ?? 0}
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom nav ────────────────────────────── */}
      <nav
        className="shrink-0 flex items-center justify-around border-t px-2 py-2"
        style={{
          background: "var(--rp-bg-elevated)",
          borderColor: "var(--rp-border)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
        }}
      >
        <button className="flex flex-col items-center gap-0.5 py-1 px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rp/rp_nav_home_24.svg" alt="" width={24} height={24} className="w-6 h-6" />
          <span className="text-[10px] font-semibold" style={{ color: "var(--rp-peach)" }}>Start</span>
        </button>
        <button onClick={handleToast} className="flex flex-col items-center gap-0.5 py-1 px-2 text-[var(--rp-text-secondary)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rp/rp_nav_quiz_24.svg" alt="" width={24} height={24} className="w-6 h-6 opacity-50" />
          <span className="text-[10px] font-medium">Quiz</span>
        </button>
        <button onClick={handleToast} className="flex flex-col items-center gap-0.5 py-1 px-2 text-[var(--rp-text-secondary)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rp/rp_nav_play_24.svg" alt="" width={24} height={24} className="w-6 h-6 opacity-50" />
          <span className="text-[10px] font-medium">Spielen</span>
        </button>
        <button onClick={handleToast} className="flex flex-col items-center gap-0.5 py-1 px-2 text-[var(--rp-text-secondary)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rp/rp_nav_rank_24.svg" alt="" width={24} height={24} className="w-6 h-6 opacity-50" />
          <span className="text-[10px] font-medium">Rangliste</span>
        </button>
        <button onClick={handleToast} className="flex flex-col items-center gap-0.5 py-1 px-2 text-[var(--rp-text-secondary)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rp/rp_nav_profile_24.svg" alt="" width={24} height={24} className="w-6 h-6 opacity-50" />
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </nav>
    </div>
  );
}
