"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n-context";
import { PlayerSchleimi } from "@/components/player-schleimi";
import {
  VS_MS_PER_PLAYER,
  readVsIntroUntil,
  vsSlideIndex,
} from "@/lib/schleimi-layers";

gsap.registerPlugin(useGSAP);

export function VsIntroScreen() {
  const game = useGame();
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const players = useMemo(
    () =>
      [...game.players].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [game.players],
  );

  const untilMs = readVsIntroUntil(game.room?.settings);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(id);
  }, []);

  const index =
    untilMs == null ? 0 : vsSlideIndex(nowMs, untilMs, Math.max(players.length, 1), VS_MS_PER_PLAYER);
  const player = players[index] ?? players[0];

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || !player) return;
      gsap.fromTo(
        "[data-vs-card]",
        { opacity: 0, scale: 0.86, y: 18 },
        { opacity: 1, scale: 1, y: 0, duration: 0.42, ease: "back.out(1.6)" },
      );
    },
    { scope: rootRef, dependencies: [player?.id], revertOnUpdate: true },
  );

  if (!player) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "var(--rp-bg-hero)" }}
      >
        <p className="animate-pulse font-medium" style={{ color: "var(--rp-text-secondary)" }}>
          {t.match.vsTitle}
        </p>
      </div>
    );
  }

  const isYou = player.id === game.myPlayerId;

  return (
    <div
      ref={rootRef}
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <p
        className="mb-2 text-[11px] font-black uppercase tracking-[0.22em]"
        style={{ color: "var(--rp-peach-deep)" }}
      >
        {t.match.vsKicker}
      </p>
      <h1 className="mb-8 text-2xl font-black tracking-[-0.04em]" style={{ color: "var(--rp-text)" }}>
        {t.match.vsTitle}
      </h1>

      <div data-vs-card className="flex flex-col items-center">
        <div
          className="mb-4 flex h-[220px] w-[220px] items-center justify-center rounded-[40px]"
          style={{
            background: "rgba(255, 255, 255, 0.72)",
            boxShadow: "0 18px 40px rgba(108, 58, 41, 0.14)",
          }}
        >
          <PlayerSchleimi playerId={player.id} size={200} label={player.display_name} />
        </div>
        <p className="max-w-[260px] truncate text-[22px] font-black" style={{ color: "var(--rp-text)" }}>
          {player.display_name}
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
          {isYou ? t.match.vsYou : player.is_host ? t.match.vsHost : t.common.player}
        </p>
      </div>

      <div className="mt-10 flex gap-2" aria-hidden="true">
        {players.map((p, i) => (
          <span
            key={p.id}
            className="h-2 w-2 rounded-full"
            style={{
              background: i === index ? "var(--rp-purple)" : "rgba(42, 42, 74, 0.18)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
