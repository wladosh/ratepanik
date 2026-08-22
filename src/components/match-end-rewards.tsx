"use client";

import { useMemo } from "react";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/auth-context";
import { xpProgressInLevel } from "@/lib/progression";
import { HIRNCOIN_ICON_48, XP_BADGE_48, LEVELUP_FX_128 } from "@/lib/rp-assets";
import type { MatchRewardResult } from "@/lib/match-rewards";

interface MatchEndRewardsProps {
  rewards: MatchRewardResult | null;
  previousXp: number;
  previousLevel: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

const CONFETTI_COLORS = ["#8B7CFF", "#FF8A71", "#FFD66B", "#6FCFB2", "#FF7AB6", "#7EB6FF"];

function ConfettiOverlay() {
  const pieces = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${seededRandom(i * 3 + 1) * 100}%`,
    delay: `${seededRandom(i * 3 + 2) * 2}s`,
    duration: `${2 + seededRandom(i * 3 + 3) * 2}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + seededRandom(i * 3 + 4) * 6,
    shape: i % 3 === 0 ? "circle" : "rect",
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.left,
            top: "-10px",
            width: p.size,
            height: p.shape === "circle" ? p.size : p.size * 1.5,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            background: p.color,
            animation: `confetti-drift ${p.duration} ${p.delay} ease-in infinite`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

function XpRow({
  xpAwarded,
  previousXp,
}: {
  xpAwarded: number;
  previousXp: number;
}) {
  const newXp = previousXp + xpAwarded;
  const progress = xpProgressInLevel(newXp);

  return (
    <div
      className="flex items-center gap-3 p-4 animate-fade-in"
      style={{
        background: "var(--rp-bg-elevated)",
        borderRadius: "var(--rp-radius-md)",
        border: "1px solid var(--rp-border)",
        animationDelay: "0.3s",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={XP_BADGE_48} alt="XP" width={40} height={40} className="w-10 h-10" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1.5">
          <span
            className="text-xl font-extrabold"
            style={{ color: "var(--rp-xp)", animation: "count-up 0.6s 0.5s ease-out both" }}
          >
            +{xpAwarded} XP
          </span>
        </div>
        <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "var(--rp-xp-track)" }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: "var(--rp-xp)",
              width: `${Math.min(progress.ratio * 100, 100)}%`,
              animation: "xp-fill 1.2s 0.5s cubic-bezier(0.4, 0, 0.2, 1) both",
            }}
          />
        </div>
        <p className="text-[11px] mt-1 text-right tabular-nums" style={{ color: "var(--rp-text-secondary)" }}>
          {progress.current} / {progress.needed}
        </p>
      </div>
    </div>
  );
}

function HirncoinRow({ hirncoinsAwarded }: { hirncoinsAwarded: number }) {
  return (
    <div
      className="flex items-center gap-3 p-4 animate-fade-in"
      style={{
        background: "var(--rp-bg-elevated)",
        borderRadius: "var(--rp-radius-md)",
        border: "1px solid var(--rp-border)",
        animationDelay: "0.5s",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HIRNCOIN_ICON_48}
        alt="Hirncoins"
        width={40}
        height={40}
        className="w-10 h-10"
        style={{ animation: "coin-pop 0.6s 0.7s ease-out both" }}
      />
      <div className="flex-1">
        <span
          className="text-xl font-extrabold"
          style={{ color: "var(--rp-hirncoin)", animation: "count-up 0.6s 0.8s ease-out both" }}
        >
          +{hirncoinsAwarded}
        </span>
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          Hirncoins
        </p>
      </div>
    </div>
  );
}

function LevelUpBanner({ newLevel }: { newLevel: number }) {
  return (
    <div
      className="flex items-center gap-3 p-4 animate-fade-in"
      style={{
        background: "var(--rp-level-up-bg)",
        borderRadius: "var(--rp-radius-md)",
        animationDelay: "0.9s",
        animation: "level-up-glow 2s ease-in-out 1.2s, fade-in 0.4s 0.9s ease-out both",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LEVELUP_FX_128}
        alt="Level Up"
        width={48}
        height={48}
        className="w-12 h-12"
      />
      <div>
        <h3 className="text-lg font-extrabold" style={{ color: "var(--rp-level)" }}>
          Level {newLevel}!
        </h3>
        <p className="text-xs" style={{ color: "var(--rp-text-secondary)" }}>
          Weiter so, du wirst immer besser!
        </p>
      </div>
    </div>
  );
}

function Top3Section() {
  const game = useGame();
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const top3 = sortedPlayers.slice(0, 3);

  if (top3.length === 0) return null;

  const placeColors = ["var(--rp-peach)", "var(--rp-text-secondary)", "var(--rp-hirncoin)"];
  const placeBgs = [
    "rgba(255, 138, 113, 0.12)",
    "rgba(107, 107, 138, 0.08)",
    "rgba(245, 166, 35, 0.10)",
  ];

  return (
    <div
      className="mt-4 p-4 animate-fade-in"
      style={{
        background: "var(--rp-bg-elevated)",
        borderRadius: "var(--rp-radius-md)",
        border: "1px solid var(--rp-border)",
        animationDelay: "1.1s",
      }}
    >
      <h4 className="text-sm font-bold mb-3" style={{ color: "var(--rp-text)" }}>
        Top 3 dieser Runde
      </h4>
      <div className="space-y-2">
        {top3.map((player, i) => (
          <div key={player.id} className="flex items-center gap-3">
            <span
              className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
              style={{ background: placeColors[i] }}
            >
              {i + 1}
            </span>
            <span className="text-xl">{game.getAvatar(player.id)}</span>
            <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--rp-text)" }}>
              {player.display_name}
              {player.id === game.myPlayerId && (
                <span className="text-xs font-normal ml-1" style={{ color: "var(--rp-text-secondary)" }}>(Du)</span>
              )}
            </span>
            <span
              className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg"
              style={{ background: placeBgs[i], color: placeColors[i] }}
            >
              {player.score.toLocaleString("de-DE")} Punkte
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuestEndScreen() {
  const game = useGame();
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

  return (
    <div
      className="flex flex-1 flex-col items-center px-4 py-6 relative overflow-hidden"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <ConfettiOverlay />
      <div className="w-full max-w-sm text-center relative z-10 pt-6">
        <div className="text-5xl mb-3 animate-bounce-slow">🏆</div>
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: "var(--rp-text)" }}>
          Runde vorbei!
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--rp-text-secondary)" }}>
          Gut gespielt!
        </p>

        {/* Scoreboard */}
        <div className="space-y-2 mb-5">
          {sortedPlayers.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 px-4 py-3 animate-fade-in"
              style={{
                animationDelay: `${i * 150}ms`,
                background: i === 0 ? "rgba(255, 214, 107, 0.1)" : "var(--rp-bg-elevated)",
                borderRadius: "var(--rp-radius-md)",
                border: "1px solid var(--rp-border)",
              }}
            >
              <span className="w-8 text-center text-lg font-black" style={{ color: "var(--rp-text-secondary)" }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
              </span>
              <span className="text-2xl">{game.getAvatar(player.id)}</span>
              <div className="flex-1 text-left">
                <p className="font-bold" style={{ color: "var(--rp-text)" }}>
                  {player.display_name}
                  {player.id === game.myPlayerId && (
                    <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--rp-text-secondary)" }}>(Du)</span>
                  )}
                </p>
              </div>
              <span className="text-lg font-black tabular-nums" style={{ color: "var(--rp-purple)" }}>
                {player.score}
              </span>
            </div>
          ))}
        </div>

        {/* Guest CTA */}
        <div
          className="p-4 mb-6 text-center animate-fade-in"
          style={{
            background: "var(--rp-level-up-bg)",
            borderRadius: "var(--rp-radius-md)",
            animationDelay: "0.6s",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--rp-level)" }}>
            Melde dich an, um XP & Hirncoins zu behalten
          </p>
        </div>

        {/* CTAs */}
        <div className="flex gap-3">
          {game.isHost ? (
            <button
              onClick={() => void game.resetGame()}
              className="flex-1 h-[52px] rounded-[var(--rp-radius-pill)] text-base font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
                color: "white",
                boxShadow: "0 6px 20px rgba(255, 138, 113, 0.35)",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Nochmal
            </button>
          ) : (
            <div
              className="flex-1 py-3 text-center rounded-[var(--rp-radius-pill)]"
              style={{
                background: "rgba(139, 124, 255, 0.08)",
                border: "2px dashed var(--rp-purple-soft)",
              }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
                Der Host kann eine neue Runde starten
              </p>
            </div>
          )}
          <button
            onClick={() => void game.leaveRoom()}
            className="flex-1 h-[52px] rounded-[var(--rp-radius-pill)] text-base font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
            style={{
              border: "2px solid var(--rp-border)",
              color: "var(--rp-text)",
              background: "var(--rp-bg-elevated)",
            }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
            </svg>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

export function MatchEndRewardsScreen({ rewards, previousXp, previousLevel }: MatchEndRewardsProps) {
  const game = useGame();
  const { isGuest } = useAuth();

  const didLevelUp = rewards
    ? xpProgressInLevel(previousXp + rewards.xpAwarded).level > previousLevel
    : false;
  const newLevel = rewards ? xpProgressInLevel(previousXp + rewards.xpAwarded).level : previousLevel;

  if (isGuest) {
    return <GuestEndScreen />;
  }

  return (
    <div
      className="flex flex-1 flex-col items-center px-4 py-6 relative overflow-hidden"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <ConfettiOverlay />

      <div className="w-full max-w-sm relative z-10 pt-4 animate-fade-in">
        {/* Hero trophy */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-2 animate-bounce-slow">🏆</div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--rp-text)" }}>
            Runde vorbei!
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--rp-text-secondary)" }}>
            Gut gespielt! Hier sind deine Belohnungen.
          </p>
        </div>

        {/* Rewards Card */}
        {rewards && (
          <div className="space-y-3 mb-4">
            <XpRow xpAwarded={rewards.xpAwarded} previousXp={previousXp} />
            <HirncoinRow hirncoinsAwarded={rewards.hirncoinsAwarded} />
            {didLevelUp && <LevelUpBanner newLevel={newLevel} />}
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-3 mb-2">
          {game.isHost ? (
            <button
              onClick={() => void game.resetGame()}
              className="flex-1 h-[52px] rounded-[var(--rp-radius-pill)] text-base font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
                color: "white",
                boxShadow: "0 6px 20px rgba(255, 138, 113, 0.35)",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Nochmal
            </button>
          ) : (
            <div
              className="flex-1 py-3 text-center rounded-[var(--rp-radius-pill)]"
              style={{
                background: "rgba(139, 124, 255, 0.08)",
                border: "2px dashed var(--rp-purple-soft)",
              }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
                Host kann neue Runde starten
              </p>
            </div>
          )}
          <button
            onClick={() => void game.leaveRoom()}
            className="flex-1 h-[52px] rounded-[var(--rp-radius-pill)] text-base font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
            style={{
              border: "2px solid var(--rp-border)",
              color: "var(--rp-text)",
              background: "var(--rp-bg-elevated)",
            }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
            </svg>
            Home
          </button>
        </div>

        {/* Top 3 */}
        <Top3Section />
      </div>
    </div>
  );
}
