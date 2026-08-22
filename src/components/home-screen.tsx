"use client";

import { useState, useMemo } from "react";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "idle" | "create" | "join";

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="10" fill="#FFD66B" stroke="#E6B84D" strokeWidth="1.5" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#8B6914">$</text>
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function NavHomeIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? "var(--rp-peach)" : "none"} stroke={active ? "var(--rp-peach)" : "currentColor"} strokeWidth="1.8">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" fill={active ? "#fff" : "none"} stroke={active ? "#fff" : "currentColor"} />
    </svg>
  );
}

function NavQuizIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9a3 3 0 0 1 5.83 1c0 2-3 2.5-3 4.5" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function NavPlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <polygon points="10,8 17,12 10,16" fill="currentColor" stroke="none" />
    </svg>
  );
}

function NavRanglisteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9H2v12h4V9z M14 4h-4v17h4V4z M22 14h-4v7h4v-7z" fill="none" />
      <circle cx="12" cy="2" r="1.5" fill="var(--rp-yellow)" stroke="var(--rp-yellow)" />
    </svg>
  );
}

function NavProfilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 12 0v1" />
    </svg>
  );
}

function AvatarPlaceholder() {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
      style={{
        background: "linear-gradient(135deg, var(--rp-purple-soft) 0%, var(--rp-pink) 100%)",
      }}
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
      </svg>
    </div>
  );
}

export function HomeScreen() {
  const game = useGame();
  const { user, canHost, isGuest, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Spieler";

  const initialJoinCode = useMemo(() => {
    const joinCode = searchParams.get("join");
    return joinCode && joinCode.length === 6 ? joinCode.toUpperCase() : "";
  }, [searchParams]);

  const [mode, setMode] = useState<Mode>(initialJoinCode ? "join" : "idle");
  const [name, setName] = useState(initialJoinCode ? displayName || "Gast" : "");
  const [roomCode, setRoomCode] = useState(initialJoinCode);
  const [joinError, setJoinError] = useState<string | null>(null);

  function handleStartCreate() {
    if (!canHost) {
      router.push("/auth/login");
      return;
    }
    setMode("create");
    setName(displayName);
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || !user?.id) return;
    await game.createRoom(trimmed, user.id);
  }

  async function handleJoin() {
    const trimmedCode = roomCode.trim();
    if (trimmedCode.length !== 6) {
      setJoinError("Code muss genau 6 Zeichen haben.");
      return;
    }
    setJoinError(null);
    const playerName = displayName || "Gast";
    await game.joinRoom(trimmedCode, playerName);
  }

  function handleToast() {
    // Phase B placeholder
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

  if (mode === "create") {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center px-5"
        style={{
          background: "var(--rp-bg-hero)",
          paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
        }}
      >
        <div className="w-full max-w-sm space-y-4 animate-fade-in">
          <h2 className="text-2xl font-extrabold text-[var(--rp-text)] text-center">
            Raum erstellen
          </h2>
          <label htmlFor="host-name" className="block text-sm font-semibold text-[var(--rp-text-secondary)]">
            Dein Spielername
          </label>
          <input
            id="host-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="z.B. QuizMaster"
            maxLength={20}
            autoFocus
            className="w-full h-[52px] rounded-2xl border-2 px-5 text-lg font-bold text-[var(--rp-text)] placeholder:text-gray-300 transition-all focus:outline-none"
            style={{
              borderColor: "var(--rp-border)",
              background: "var(--rp-bg-elevated)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--rp-focus-ring)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 124, 255, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--rp-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!name.trim() || game.loading}
            className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
            }}
          >
            {game.loading ? "Erstelle Raum..." : "Spiel erstellen"}
          </button>
          <button
            onClick={() => { setMode("idle"); setName(""); }}
            className="w-full text-sm text-[var(--rp-text-secondary)] hover:text-[var(--rp-text)] transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rp-home-root flex flex-1 flex-col"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {/* ── Header ──────────────────────────────── */}
        <header className="flex items-center gap-3 py-4">
          <AvatarPlaceholder />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[var(--rp-text)] truncate">{displayName}</h2>
            <p className="text-xs text-[var(--rp-text-secondary)]">
              {isGuest ? "Gast" : "Party-Spieler"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 h-8 px-3 rounded-full"
              style={{ background: "rgba(255, 214, 107, 0.2)", border: "1px solid rgba(255, 214, 107, 0.4)" }}
            >
              <CoinIcon className="w-4 h-4" />
              <span className="text-sm font-bold text-[var(--rp-text)]">0</span>
            </div>
            <button
              onClick={signOut}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
              aria-label="Einstellungen"
            >
              <GearIcon className="w-5 h-5 text-[var(--rp-text-secondary)]" />
            </button>
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
          onClick={handleStartCreate}
          className="w-full flex items-center gap-4 p-4 mb-3 transition-all active:scale-[0.98]"
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
            <h3 className="text-base font-bold text-[var(--rp-text)]">Raum erstellen</h3>
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
          {/* Hidden full input overlaying the digit boxes for actual typing */}
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
            onClick={handleToast}
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
              <p className="text-[10px] text-[var(--rp-text-secondary)] leading-tight">Sieh, wer online ist<br />und lade ein</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--rp-text-secondary)] ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={handleToast}
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
              <span className="text-sm font-bold text-[var(--rp-text)]">Stats</span>
              <p className="text-[10px] text-[var(--rp-text-secondary)] leading-tight">Deine Punkte<br />im Überblick</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--rp-text-secondary)] ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={handleToast}
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
              <span className="text-sm font-bold text-[var(--rp-text)]">Achievements</span>
              <p className="text-[10px] text-[var(--rp-text-secondary)] leading-tight">Deine Erfolge<br />und Abzeichen</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--rp-text-secondary)] ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={handleToast}
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
              <p className="text-[10px] text-[var(--rp-text-secondary)] leading-tight">Coole Items<br />entdecken</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--rp-text-secondary)] ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ── Streak card ─────────────────────────── */}
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
              Spiele an 3 Tagen in Folge, um deine Streak zu starten!
            </p>
          </div>
          <span
            className="w-9 h-9 flex items-center justify-center rounded-full text-base font-bold"
            style={{ background: "#FFF0F0", color: "var(--rp-danger)" }}
          >
            0
          </span>
        </div>
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
          <NavHomeIcon active />
          <span className="text-[10px] font-semibold" style={{ color: "var(--rp-peach)" }}>Home</span>
        </button>
        <button onClick={handleToast} className="flex flex-col items-center gap-0.5 py-1 px-2 text-[var(--rp-text-secondary)]">
          <NavQuizIcon />
          <span className="text-[10px] font-medium">Quiz</span>
        </button>
        <button onClick={handleToast} className="flex flex-col items-center gap-0.5 py-1 px-2 text-[var(--rp-text-secondary)]">
          <NavPlayIcon />
          <span className="text-[10px] font-medium">Play</span>
        </button>
        <button onClick={handleToast} className="flex flex-col items-center gap-0.5 py-1 px-2 text-[var(--rp-text-secondary)]">
          <NavRanglisteIcon />
          <span className="text-[10px] font-medium">Rangliste</span>
        </button>
        <button onClick={handleToast} className="flex flex-col items-center gap-0.5 py-1 px-2 text-[var(--rp-text-secondary)]">
          <NavProfilIcon />
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </nav>
    </div>
  );
}
