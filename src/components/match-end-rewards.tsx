"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useMemo, useState, useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useGame } from "@/lib/game-context";
import { PlayerSchleimi } from "@/components/player-schleimi";
import { PlayerNameRow } from "@/components/player-name-row";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { xpProgressInLevel } from "@/lib/progression";
import { GuestAccountUpsell } from "@/components/guest-account-upsell";
import { allScoresTied, competitionRanks, placeGlyph } from "@/lib/match-ui";
import {
  HIRNCOIN_ICON_48,
  XP_BADGE_48,
  LEVELUP_FX_128,
  TROPHY_GOLD_512,
  CONFETTI_SHEET_512,
} from "@/lib/rp-assets";
import type { MatchRewardResult } from "@/lib/match-rewards";

gsap.registerPlugin(useGSAP);

interface MatchEndRewardsProps {
  rewards: MatchRewardResult | null;
  previousXp: number;
  previousLevel: number;
}

/* ── Hook: numeric count-up from 0 → target (rAF-based) ─────────── */

function useCountUp(target: number, durationMs = 800, delayMs = 400): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target <= 0) return;

    let start: number | null = null;
    let cancelled = false;

    const timeout = window.setTimeout(() => {
      const step = (ts: number) => {
        if (cancelled) return;
        if (!start) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, delayMs]);

  return value;
}

/* ── Hook: detect prefers-reduced-motion ─────────────────────────── */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/* ── Confetti background — plays ONCE, respects prefers-reduced-motion ── */

function ConfettiOverlay({ show }: { show: boolean }) {
  const reducedMotion = usePrefersReducedMotion();

  if (!show || reducedMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <Image
        src={CONFETTI_SHEET_512}
        alt=""
        width={512}
        height={512}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md opacity-60"
        style={{ animation: "confetti-drift 6s ease-in 1", animationFillMode: "forwards" }}
        aria-hidden="true"
      />
      <Image
        src={CONFETTI_SHEET_512}
        alt=""
        width={512}
        height={512}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md opacity-40"
        style={{
          animation: "confetti-drift 5s 1.5s ease-in 1",
          animationFillMode: "forwards",
          transform: "translateX(-50%) scaleX(-1)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}

type FinalMood = {
  eyebrow: string;
  title: string;
  message: string;
  accent: string;
  glow: string;
};

function getFinalMood(rank: number, playerCount: number, tied: boolean): FinalMood {
  if (tied && playerCount > 1) {
    return {
      eyebrow: "Gleichstand",
      title: "Unentschieden",
      message: "Ihr liegt gleichauf. Nächste Runde entscheidet.",
      accent: "var(--rp-purple)",
      glow: "rgba(139, 124, 255, 0.28)",
    };
  }
  if (rank === 1) {
    return {
      eyebrow: "Sieg!",
      title: playerCount === 1 ? "Runde geschafft!" : "Du hast gewonnen!",
      message: playerCount === 1
        ? "Starke Runde – das war dein Spiel."
        : `Du hast dich gegen ${playerCount - 1} ${
            playerCount - 1 === 1 ? "Mitspieler" : "Mitspieler"
          } durchgesetzt.`,
      accent: "#C98A16",
      glow: "rgba(255, 214, 107, 0.42)",
    };
  }

  if (rank === 2) {
    return {
      eyebrow: "Platz 2",
      title: "So knapp!",
      message: "Der Pokal war zum Greifen nah. Nächste Runde gehört dir.",
      accent: "var(--rp-purple)",
      glow: "rgba(139, 124, 255, 0.28)",
    };
  }

  return {
    eyebrow: `Platz ${rank}`,
    title: "Stark gekämpft!",
    message: "Heute nicht ganz vorn – aber die Revanche wartet schon.",
    accent: "var(--rp-peach-deep)",
    glow: "rgba(255, 138, 113, 0.25)",
  };
}

function FinalHero({
  rank,
  playerCount,
  score,
  avatar,
  tied,
}: {
  rank: number;
  playerCount: number;
  score: number;
  avatar: ReactNode;
  tied?: boolean;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const winner = rank === 1 && !tied;
  const mood = getFinalMood(rank, playerCount, tied === true);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) return;

      const timeline = gsap.timeline({ defaults: { ease: "back.out(1.5)" } });
      timeline
        .from("[data-final-orb]", { scale: 0.35, rotation: winner ? -14 : 8, opacity: 0, duration: 0.7 })
        .from("[data-final-copy]", { y: 18, opacity: 0, duration: 0.45, stagger: 0.08 }, "-=0.35")
        .from("[data-final-score]", { scale: 0.7, opacity: 0, duration: 0.35 }, "-=0.18");

      if (winner) {
        gsap.to("[data-final-orb]", {
          y: -5,
          duration: 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 0.8,
        });
      }
    },
    { scope: heroRef, dependencies: [winner] },
  );

  return (
    <section ref={heroRef} className="relative mb-5 text-center" aria-label={`${mood.eyebrow}: ${mood.title}`}>
      <div className="relative mx-auto mb-3 h-[132px] w-[132px]">
        <span
          className="absolute inset-2 rounded-full blur-2xl"
          style={{ background: mood.glow }}
          aria-hidden="true"
        />
        <div
          data-final-orb
          className="relative flex h-full w-full items-center justify-center rounded-[42px]"
          style={{
            background: winner
              ? "linear-gradient(145deg, #FFF9D7 0%, #FFE2A4 100%)"
              : "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(237,230,255,0.94) 100%)",
            border: winner ? "1px solid rgba(201, 138, 22, 0.2)" : "1px solid rgba(139, 124, 255, 0.16)",
            boxShadow: winner
              ? "0 18px 42px rgba(166, 112, 26, 0.2)"
              : "0 18px 42px rgba(76, 60, 130, 0.15)",
          }}
        >
          {winner ? (
            <Image
              src={TROPHY_GOLD_512}
              alt="Goldener Siegerpokal"
              width={106}
              height={106}
              className="h-[106px] w-[106px] object-contain"
              priority
            />
          ) : (
            <span className="flex items-center justify-center" aria-hidden="true">
              {avatar}
            </span>
          )}
          <span
            className="absolute -bottom-2 -right-2 flex min-h-11 min-w-11 items-center justify-center rounded-2xl px-2 text-base font-black text-white"
            style={{
              background: winner
                ? "linear-gradient(135deg, #F3B928 0%, #D58A12 100%)"
                : "linear-gradient(135deg, var(--rp-purple) 0%, #6B5CE7 100%)",
              boxShadow: "0 7px 16px rgba(72, 54, 118, 0.22)",
            }}
          >
            #{rank}
          </span>
        </div>
      </div>

      <p
        data-final-copy
        className="mb-1 text-[11px] font-black uppercase tracking-[0.18em]"
        style={{ color: mood.accent }}
      >
        {mood.eyebrow}
      </p>
      <h1
        data-final-copy
        className="text-[30px] font-black leading-tight tracking-[-0.04em]"
        style={{ color: "var(--rp-text)" }}
      >
        {mood.title}
      </h1>
      <p
        data-final-copy
        className="mx-auto mt-2 max-w-[300px] text-sm font-semibold leading-relaxed"
        style={{ color: "var(--rp-text-secondary)" }}
      >
        {mood.message}
      </p>
      <div
        data-final-score
        className="mt-3 inline-flex items-baseline gap-1.5 rounded-full px-4 py-2"
        style={{
          background: "rgba(255, 255, 255, 0.82)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          boxShadow: "0 7px 20px rgba(42, 42, 74, 0.07)",
        }}
      >
        <span className="text-xl font-black tabular-nums" style={{ color: mood.accent }}>
          {score.toLocaleString("de-DE")}
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--rp-text-secondary)" }}>
          Punkte
        </span>
      </div>
    </section>
  );
}

/* ── Scoreboard (brief, shown first) ────────────────────────────── */

function BriefScoreboard({ onContinue }: { onContinue: () => void }) {
  const game = useGame();
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const scores = sortedPlayers.map((player) => player.score);
  const ranks = competitionRanks(scores);
  const myIndex = sortedPlayers.findIndex((p) => p.id === game.myPlayerId);
  const myRank = ranks[myIndex] ?? 1;
  const tied = allScoresTied(scores);
  const myPlayer = sortedPlayers.find((p) => p.id === game.myPlayerId);

  return (
    <div
      className="relative flex flex-1 flex-col items-center overflow-y-auto px-4 pb-6"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <ConfettiOverlay show={myRank === 1 && !tied} />
      <span
        className="pointer-events-none absolute -left-20 top-40 h-52 w-52 rounded-full opacity-35 blur-3xl"
        style={{ background: myRank === 1 && !tied ? "#FFE9A8" : "var(--rp-purple-soft)" }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -right-20 bottom-20 h-48 w-48 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--rp-peach-soft)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mt-8 w-full max-w-sm">
        <FinalHero
          rank={Math.max(myRank, 1)}
          playerCount={sortedPlayers.length}
          score={myPlayer?.score ?? 0}
          avatar={myPlayer ? <PlayerSchleimi playerId={myPlayer.id} size={100} /> : null}
          tied={tied}
        />

        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold" style={{ color: "var(--rp-text)" }}>
            Endstand
          </h2>
          <span className="text-xs font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
            {sortedPlayers.length} Spieler
          </span>
        </div>

        <div className="mb-5 space-y-2">
          {sortedPlayers.map((player, i) => (
            <div
              key={player.id}
              className="animate-fade-in flex items-center gap-3 px-3.5 py-3"
              style={{
                animationDelay: `${500 + i * 100}ms`,
                background:
                  player.id === game.myPlayerId
                    ? "rgba(255, 255, 255, 0.94)"
                    : "rgba(255, 255, 255, 0.7)",
                borderRadius: 20,
                border:
                  player.id === game.myPlayerId
                    ? "1.5px solid rgba(139, 124, 255, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.78)",
                boxShadow:
                  player.id === game.myPlayerId
                    ? "0 8px 22px rgba(92, 77, 175, 0.11)"
                    : "0 5px 16px rgba(42, 42, 74, 0.05)",
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                style={{
                  background: (ranks[i] ?? i + 1) === 1 ? "#FFF2B8" : "var(--rp-bg-muted)",
                  color: (ranks[i] ?? i + 1) === 1 ? "#A87513" : "var(--rp-text-secondary)",
                }}
              >
                {placeGlyph(ranks[i] ?? i + 1)}
              </span>
              <PlayerSchleimi playerId={player.id} size={36} />
              <PlayerNameRow
                className="flex-1 text-left"
                name={player.display_name}
                isMe={player.id === game.myPlayerId}
              />
              <div className="text-right">
                <span className="block text-lg font-black tabular-nums" style={{ color: "var(--rp-purple)" }}>
                  {player.score.toLocaleString("de-DE")}
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--rp-text-secondary)" }}>
                  Punkte
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onContinue}
          className="animate-fade-in h-[56px] w-full rounded-[var(--rp-radius-pill)] text-base font-extrabold text-white transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, var(--rp-purple) 0%, #6B5CE7 100%)",
            boxShadow: "0 10px 26px rgba(107, 92, 231, 0.3)",
            animationDelay: "0.9s",
          }}
        >
          Belohnungen ansehen →
        </button>
      </div>
    </div>
  );
}

/* ── XP reward row ──────────────────────────────────────────────── */

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
            className="text-xl font-extrabold tabular-nums"
            style={{ color: "var(--rp-xp)" }}
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
          {progress.current === 0 && xpAwarded > 0
            ? `Level ${progress.level}! Nächste Stufe: 0 / ${progress.needed}`
            : `${progress.current} / ${progress.needed}`}
        </p>
      </div>
    </div>
  );
}

/* ── Hirncoins reward row ───────────────────────────────────────── */

function HirncoinRow({ hirncoinsAwarded }: { hirncoinsAwarded: number }) {
  const displayCoins = useCountUp(hirncoinsAwarded, 800, 700);

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
          className="text-xl font-extrabold tabular-nums"
          style={{ color: "var(--rp-hirncoin)" }}
        >
          +{displayCoins}
        </span>
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          Hirncoins
        </p>
      </div>
    </div>
  );
}

/* ── Conditional level-up banner ────────────────────────────────── */

function LevelUpBanner({ newLevel }: { newLevel: number }) {
  return (
    <div
      className="flex items-center gap-3 p-4"
      style={{
        background: "var(--rp-level-up-bg)",
        borderRadius: "var(--rp-radius-md)",
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

/* ── Top 3 leaderboard ──────────────────────────────────────────── */

const PLACE_COLORS = ["var(--rp-peach)", "var(--rp-text-secondary)", "var(--rp-hirncoin)"];
const PLACE_BGS = [
  "rgba(255, 138, 113, 0.12)",
  "rgba(107, 107, 138, 0.08)",
  "rgba(245, 166, 35, 0.10)",
];

function Top3Section() {
  const game = useGame();
  const top3 = useMemo(
    () => [...game.players].sort((a, b) => b.score - a.score).slice(0, 3),
    [game.players],
  );
  const ranks = competitionRanks(top3.map((player) => player.score));

  if (top3.length === 0) return null;

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
        {top3.map((player, i) => {
          const rank = ranks[i] ?? i + 1;
          return (
          <div key={player.id} className="flex items-center gap-3">
            <span
              className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
              style={{ background: PLACE_COLORS[Math.min(rank, 3) - 1] }}
            >
              {rank}
            </span>
            <PlayerSchleimi playerId={player.id} size={32} />
            <PlayerNameRow
              className="flex-1"
              name={player.display_name}
              isMe={player.id === game.myPlayerId}
              youLabel="Du"
            />
            <span
              className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg"
              style={{ background: PLACE_BGS[i], color: PLACE_COLORS[i] }}
            >
              {player.score.toLocaleString("de-DE")} Punkte
            </span>
          </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Guest end screen: scoreboard + upsell, NO fake numbers ─────── */

function GuestEndScreen() {
  const game = useGame();
  const { t } = useI18n();
  const [step, setStep] = useState<"results" | "advantages">("results");
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const scores = sortedPlayers.map((player) => player.score);
  const ranks = competitionRanks(scores);
  const myIndex = sortedPlayers.findIndex((p) => p.id === game.myPlayerId);
  const myRank = ranks[myIndex] ?? 1;
  const tied = allScoresTied(scores);
  const myPlayer = sortedPlayers.find((p) => p.id === game.myPlayerId);
  const won = myRank === 1 && !tied;

  if (step === "advantages") {
    return (
      <GuestAccountUpsell
        won={won}
        onSignup={() => void game.leaveRoom({ next: "/auth/signup" })}
        onLogin={() => void game.leaveRoom({ next: "/auth/login" })}
      />
    );
  }

  return (
    <div
      className="relative flex flex-1 flex-col items-center overflow-y-auto px-4 pb-6"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <ConfettiOverlay show={myRank === 1 && !tied} />
      <span
        className="pointer-events-none absolute -left-20 top-40 h-52 w-52 rounded-full opacity-35 blur-3xl"
        style={{ background: myRank === 1 && !tied ? "#FFE9A8" : "var(--rp-purple-soft)" }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -right-20 bottom-24 h-48 w-48 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--rp-peach-soft)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mt-8 w-full max-w-sm text-center">
        <FinalHero
          rank={Math.max(myRank, 1)}
          playerCount={sortedPlayers.length}
          score={myPlayer?.score ?? 0}
          avatar={myPlayer ? <PlayerSchleimi playerId={myPlayer.id} size={100} /> : null}
          tied={tied}
        />

        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold" style={{ color: "var(--rp-text)" }}>
            {t.guestUpsell.standings}
          </h2>
          <span className="text-xs font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
            {t.guestUpsell.guestBadge}
          </span>
        </div>

        {/* Scoreboard */}
        <div className="mb-5 space-y-2">
          {sortedPlayers.map((player, i) => (
            <div
              key={player.id}
              className="animate-fade-in flex items-center gap-3 px-3.5 py-3"
              style={{
                animationDelay: `${500 + i * 100}ms`,
                background:
                  player.id === game.myPlayerId
                    ? "rgba(255, 255, 255, 0.94)"
                    : "rgba(255, 255, 255, 0.7)",
                borderRadius: 20,
                border:
                  player.id === game.myPlayerId
                    ? "1.5px solid rgba(139, 124, 255, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.78)",
                boxShadow:
                  player.id === game.myPlayerId
                    ? "0 8px 22px rgba(92, 77, 175, 0.11)"
                    : "0 5px 16px rgba(42, 42, 74, 0.05)",
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                style={{
                  background: (ranks[i] ?? i + 1) === 1 ? "#FFF2B8" : "var(--rp-bg-muted)",
                  color: (ranks[i] ?? i + 1) === 1 ? "#A87513" : "var(--rp-text-secondary)",
                }}
              >
                {placeGlyph(ranks[i] ?? i + 1)}
              </span>
              <PlayerSchleimi playerId={player.id} size={36} />
              <PlayerNameRow
                className="flex-1 text-left"
                name={player.display_name}
                isMe={player.id === game.myPlayerId}
              />
              <div className="text-right">
                <span className="block text-lg font-black tabular-nums" style={{ color: "var(--rp-purple)" }}>
                  {player.score.toLocaleString("de-DE")}
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--rp-text-secondary)" }}>
                  {t.guestUpsell.points}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStep("advantages")}
          className="mt-1 w-full h-[54px] rounded-[var(--rp-radius-pill)] text-base font-bold text-white transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
            boxShadow: "0 6px 20px rgba(255, 138, 113, 0.35)",
          }}
        >
          {t.guestUpsell.next}
        </button>
      </div>
    </div>
  );
}

/* ── Rewards Card (logged-in flow) ──────────────────────────────── */

function RewardsCard({ rewards, previousXp, previousLevel }: MatchEndRewardsProps) {
  const game = useGame();

  const didLevelUp = rewards
    ? xpProgressInLevel(previousXp + rewards.xpAwarded).level > previousLevel
    : false;
  const newLevel = rewards ? xpProgressInLevel(previousXp + rewards.xpAwarded).level : previousLevel;

  const sortedPlayers = useMemo(
    () => [...game.players].sort((a, b) => b.score - a.score),
    [game.players],
  );
  const myRank = sortedPlayers.findIndex((p) => p.id === game.myPlayerId) + 1;
  const showConfetti = didLevelUp || myRank === 1;

  return (
    <div
      className="flex flex-1 flex-col items-center px-4 py-6 relative overflow-hidden"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <ConfettiOverlay show={showConfetti} />

      <div className="w-full max-w-sm relative z-10 pt-4 animate-fade-in">
        {/* Hero trophy */}
        <div className="text-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TROPHY_GOLD_512}
            alt="Pokal"
            width={80}
            height={80}
            className="w-20 h-20 mx-auto mb-2 animate-bounce-slow"
          />
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--rp-text)" }}>
            Runde vorbei!
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--rp-text-secondary)" }}>
            Gut gespielt! Hier sind deine Belohnungen.
          </p>
        </div>

        {/* XP + Hirncoins + optional Level-up */}
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

/* ── Main export: orchestrates Scoreboard → Rewards flow ────────── */

export function MatchEndRewardsScreen({ rewards, previousXp, previousLevel }: MatchEndRewardsProps) {
  const { isGuest } = useAuth();

  if (isGuest) {
    return <GuestEndScreen />;
  }

  return (
    <RewardsCard rewards={rewards} previousXp={previousXp} previousLevel={previousLevel} />
  );
}

export { BriefScoreboard };
