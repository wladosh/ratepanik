"use client";

import { useCallback } from "react";
import { useGame } from "@/lib/game-context";
import { AVATAR_POOL } from "@/lib/rp-assets";

function getAvatarSrc(index: number) {
  return AVATAR_POOL[index % AVATAR_POOL.length];
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2v2h14v-2H5z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="white" opacity="0.3" />
      <path d="M10 8l6 4-6 4V8z" fill="white" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function PeopleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

export function LobbyScreen() {
  const game = useGame();

  const playersSorted = [...game.players].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  async function handleStart() {
    if (game.players.length < 2) return;
    await game.startGame();
  }

  const handleCopy = useCallback(() => {
    if (!game.room?.code) return;
    navigator.clipboard.writeText(game.room.code).catch(() => {});
  }, [game.room?.code]);

  const canStart = game.players.length >= 2;

  return (
    <div
      className="flex flex-1 flex-col"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      {/* Confetti decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[6%] left-[8%] text-lg opacity-80">&#10022;</div>
        <div className="absolute top-[10%] right-[10%] text-sm opacity-60" style={{ color: "var(--rp-peach)" }}>&#10022;</div>
        <div className="absolute top-[4%] left-[40%] text-xs opacity-50" style={{ color: "var(--rp-yellow)" }}>&#10022;</div>
        <div className="absolute top-[14%] right-[30%] w-2 h-2 rounded-full opacity-40" style={{ background: "var(--rp-sky)" }} />
        <div className="absolute top-[8%] left-[25%] w-1.5 h-1.5 rounded-full opacity-50" style={{ background: "var(--rp-purple-soft)" }} />
        <div className="absolute top-[18%] right-[8%] w-1.5 h-4 rounded-full opacity-30 rotate-45" style={{ background: "var(--rp-pink)" }} />
        <div className="absolute top-[12%] left-[60%] w-1 h-3 rounded-full opacity-30 -rotate-12" style={{ background: "var(--rp-mint)" }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-5 pb-6">
        {/* Back button */}
        <button
          onClick={() => void game.leaveRoom()}
          className="self-start inline-flex items-center min-h-11 min-w-11 -ml-2 px-2 mt-1 mb-1 text-sm font-medium transition-colors"
          style={{ color: "var(--rp-text-secondary)" }}
        >
          &larr; Verlassen
        </button>

        {/* Room code card */}
        <div className="flex flex-col items-center mb-5">
          <span
            className="text-xs font-semibold tracking-wider mb-1"
            style={{ color: "var(--rp-purple)" }}
          >
            Raumcode
          </span>
          <div className="flex items-center gap-3">
            <span
              className="text-[2.5rem] font-black tracking-[0.2em] leading-none"
              style={{ color: "var(--rp-text)" }}
            >
              {game.room?.code}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={{
                background: "var(--rp-purple-soft)",
                color: "var(--rp-purple)",
              }}
            >
              <CopyIcon className="w-3.5 h-3.5" />
              Kopieren
            </button>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-1.5 mt-3">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: canStart ? "var(--rp-success)" : "var(--rp-yellow)" }}
            />
            <span className="text-sm font-semibold" style={{ color: "var(--rp-text)" }}>
              {canStart ? "Host kann starten" : "Warten auf Spieler…"}
            </span>
          </div>
        </div>

        {/* Player list */}
        <div className="flex-1 space-y-2.5 mb-4">
          {playersSorted.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 px-4 py-3 animate-fade-in"
              style={{
                background: "var(--rp-bg-elevated)",
                borderRadius: "var(--rp-radius-md)",
                boxShadow: "var(--rp-shadow-card)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getAvatarSrc(i)}
                alt={player.display_name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <span className="flex-1 text-base font-bold" style={{ color: "var(--rp-text)" }}>
                {player.display_name}
                {player.id === game.myPlayerId && (
                  <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--rp-text-secondary)" }}>
                    (Du)
                  </span>
                )}
              </span>
              {player.is_host && (
                <span
                  className="flex items-center gap-1 h-7 px-3 rounded-full text-xs font-bold"
                  style={{
                    background: "rgba(139, 124, 255, 0.12)",
                    color: "var(--rp-purple)",
                  }}
                >
                  <CrownIcon className="w-3.5 h-3.5" />
                  Host
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Micro hint */}
        <div className="flex items-center gap-2.5 mb-4 px-1">
          <PeopleIcon className="w-6 h-6 shrink-0" style={{ color: "var(--rp-purple-soft)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--rp-text)" }}>
              {game.players.length < 2
                ? "Noch einer und es wird ungemütlich."
                : game.players.length < 3
                  ? "Noch einer und es wird ungemütlich."
                  : `${game.players.length} Spieler bereit!`}
            </p>
            <p className="text-xs" style={{ color: "var(--rp-text-secondary)" }}>
              2–4 Spieler pro Runde
            </p>
          </div>
        </div>

        {/* CTA */}
        {game.isHost ? (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-[var(--rp-radius-md)] text-lg font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
            style={{
              background: canStart
                ? "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)"
                : "var(--rp-peach)",
              boxShadow: canStart ? "0 8px 24px rgba(255, 138, 113, 0.35)" : "none",
            }}
          >
            <PlayIcon className="w-7 h-7" />
            Runde starten
          </button>
        ) : (
          <div
            className="w-full py-4 text-center rounded-[var(--rp-radius-md)]"
            style={{
              background: "rgba(139, 124, 255, 0.08)",
              border: "2px dashed var(--rp-purple-soft)",
            }}
          >
            <p className="text-base font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
              Warten auf Host…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
