"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n-context";
import { PlayerSchleimi } from "@/components/player-schleimi";

gsap.registerPlugin(useGSAP);

const SCHLEIMI_SIZE: Record<number, number> = {
  1: 140,
  2: 130,
  3: 100,
  4: 86,
};

function schleimiSize(count: number): number {
  return SCHLEIMI_SIZE[Math.min(count, 4)] ?? 86;
}

export function VsIntroScreen() {
  const game = useGame();
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);

  const players = useMemo(
    () =>
      [...game.players].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [game.players],
  );

  const size = schleimiSize(players.length);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || players.length === 0) return;

      const items = gsap.utils.toArray<HTMLElement>("[data-vs-player]");
      const names = gsap.utils.toArray<HTMLElement>("[data-vs-name]");

      gsap.set(items, { opacity: 0, y: 60 });
      gsap.set(names, { opacity: 0, y: 10 });

      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
        stagger: {
          each: 0.12,
          from: "edges",
        },
      });

      gsap.to(names, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        stagger: {
          each: 0.12,
          from: "edges",
        },
        delay: 0.22,
      });

      gsap.to("[data-vs-crew]", {
        y: -3,
        duration: 1.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.7,
      });
    },
    { scope: rootRef, dependencies: [players.length] },
  );

  if (players.length === 0) {
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

  return (
    <div
      ref={rootRef}
      className="flex flex-1 flex-col items-center justify-center px-4 text-center"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <p
        className="mb-1 text-[11px] font-black uppercase tracking-[0.22em]"
        style={{ color: "var(--rp-peach-deep)" }}
      >
        {t.match.vsKicker}
      </p>
      <h1
        className="mb-8 text-2xl font-black tracking-[-0.04em]"
        style={{ color: "var(--rp-text)" }}
      >
        {t.match.vsTitle}
      </h1>

      <div
        data-vs-crew
        className="flex flex-wrap items-end justify-center"
        style={{ gap: players.length <= 2 ? "28px" : "16px" }}
      >
        {players.map((player) => {
          const isYou = player.id === game.myPlayerId;
          return (
            <div key={player.id} className="flex flex-col items-center" data-vs-player>
              <div
                className="flex items-center justify-center rounded-[28px]"
                style={{
                  width: size + 16,
                  height: size + 16,
                  background: "rgba(255, 255, 255, 0.38)",
                }}
              >
                <PlayerSchleimi playerId={player.id} size={size} label={player.display_name} />
              </div>
              <p
                data-vs-name
                className="mt-2 max-w-[110px] truncate text-sm font-bold leading-tight"
                style={{ color: "var(--rp-text)" }}
              >
                {player.display_name}
              </p>
              <span
                data-vs-name
                className="mt-0.5 text-[11px] font-semibold"
                style={{ color: "var(--rp-text-secondary)" }}
              >
                {isYou ? t.match.vsYou : player.is_host ? t.match.vsHost : t.common.player}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
