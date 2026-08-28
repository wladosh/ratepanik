"use client";

import { type ReactNode, useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useGame } from "@/lib/game-context";
import { useI18n } from "@/lib/i18n-context";
import { PlayerSchleimi } from "@/components/player-schleimi";
import styles from "./vs-intro-screen.module.css";

gsap.registerPlugin(useGSAP);

const SCHLEIMI_SIZE: Record<number, number> = {
  1: 140,
  2: 150,
  3: 100,
  4: 82,
};

function schleimiSize(count: number): number {
  return SCHLEIMI_SIZE[Math.min(count, 4)] ?? 82;
}

export type VsIntroFighter = {
  id: string;
  displayName: string;
  role: "you" | "host" | "player";
  mascot: ReactNode;
};

function VsStamp({ variant }: { variant: "banner" | "gutter" }) {
  return (
    <p
      data-vs-stamp
      className={`${styles.stamp} ${variant === "banner" ? styles.stampBanner : styles.stampGutter}`}
      aria-hidden="true"
    >
      VS
    </p>
  );
}

function FighterCard({
  fighter,
  size,
  youLabel,
  hostLabel,
  playerLabel,
}: {
  fighter: VsIntroFighter;
  size: number;
  youLabel: string;
  hostLabel: string;
  playerLabel: string;
}) {
  const roleLabel =
    fighter.role === "you" ? youLabel : fighter.role === "host" ? hostLabel : playerLabel;

  return (
    <div className={styles.fighter} data-vs-player>
      <div className={styles.mascotWrap} data-vs-mascot style={{ width: size, height: size + 8 }}>
        <span className={styles.floor} aria-hidden="true" />
        <span
          className={`${styles.footSpark} ${styles.footSparkLeft}`}
          data-vs-foot-spark
          aria-hidden="true"
        />
        <span
          className={`${styles.footSpark} ${styles.footSparkRight}`}
          data-vs-foot-spark
          aria-hidden="true"
        />
        {fighter.mascot}
      </div>
      <div className={styles.plate} data-vs-plate>
        <div className={styles.plateInner}>
          <span className={styles.name}>{fighter.displayName}</span>
          <span className={styles.meta}>
            {fighter.role === "you" ? (
              <span className={styles.youBadge} data-vs-you-badge>
                {youLabel}
              </span>
            ) : (
              <span className={styles.role}>{roleLabel}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export function VsIntroStage({
  fighters,
  kicker,
  title,
  youLabel,
  hostLabel,
  playerLabel,
}: {
  fighters: VsIntroFighter[];
  kicker: string;
  title: string;
  youLabel: string;
  hostLabel: string;
  playerLabel: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const faceOff = fighters.length === 2;
  const size = schleimiSize(fighters.length);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || fighters.length === 0) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stage = root.querySelector<HTMLElement>("[data-vs-stage]");
      const stamp = root.querySelector<HTMLElement>("[data-vs-stamp]");
      const kickerEl = root.querySelector<HTMLElement>("[data-vs-kicker]");
      const sparks = gsap.utils.toArray<HTMLElement>("[data-vs-spark]");
      const lines = gsap.utils.toArray<HTMLElement>("[data-vs-line]");
      const mascots = gsap.utils.toArray<HTMLElement>("[data-vs-mascot]");
      const plates = gsap.utils.toArray<HTMLElement>("[data-vs-plate]");
      const badges = gsap.utils.toArray<HTMLElement>("[data-vs-you-badge]");
      const footSparks = gsap.utils.toArray<HTMLElement>("[data-vs-foot-spark]");

      if (reduced) {
        gsap.set(kickerEl, { opacity: 1, y: 0 });
        gsap.set(stamp, { opacity: 1, scale: 1, rotation: -8 });
        gsap.set(sparks, { opacity: 1, scale: 1, rotation: 45 });
        gsap.set(lines, { opacity: 0.35, xPercent: 0 });
        gsap.set(mascots, { opacity: 1, y: 0, scale: 1, rotation: 0 });
        gsap.set(plates, { opacity: 1, y: 0, scale: 1 });
        gsap.set(badges, { opacity: 1, scale: 1 });
        gsap.set(footSparks, { opacity: 1, scale: 1 });
        gsap.from(root, { opacity: 0, duration: 0.3, ease: "power1.out" });
        return;
      }

      gsap.set(kickerEl, { y: -18, opacity: 0 });
      gsap.set(stamp, { scale: 3.4, rotation: -18, opacity: 0 });
      gsap.set(sparks, { scale: 0, opacity: 0, rotation: 45 });
      gsap.set(lines, { xPercent: -20, opacity: 0 });
      gsap.set(mascots, { y: -220, scale: 0.35, rotation: -12, opacity: 0 });
      gsap.set(plates, { y: 18, scale: 0.78, opacity: 0 });
      gsap.set(badges, { scale: 0, opacity: 0 });
      gsap.set(footSparks, { scale: 0, opacity: 0 });

      const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

      timeline
        .to(root, { backgroundColor: "#FFF8F0", duration: 0.38 }, 0)
        .to(kickerEl, { y: 0, opacity: 1, duration: 0.28 }, 0.06)
        .to(
          stamp,
          { scale: 1, rotation: -8, opacity: 1, duration: 0.5, ease: "back.out(2)" },
          0.08,
        )
        .to(lines, { xPercent: 0, opacity: 0.35, duration: 0.32, stagger: 0.05 }, 0.12)
        .to(sparks, { scale: 1, opacity: 1, duration: 0.28, stagger: 0.04, ease: "back.out(2)" }, 0.2);

      if (stage) {
        timeline
          .to(stage, { x: 5, duration: 0.04 }, 0.3)
          .to(stage, { x: -5, duration: 0.04 })
          .to(stage, { x: 3, duration: 0.04 })
          .to(stage, { x: 0, duration: 0.07 });
      }

      mascots.forEach((mascot, index) => {
        const start = 0.55 + index * 0.42;
        const plate = plates[index];
        const pairSparks = footSparks.slice(index * 2, index * 2 + 2);

        timeline.to(
          mascot,
          {
            y: 0,
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.46,
            ease: "back.out(1.8)",
          },
          start,
        );
        timeline.to(mascot, { scaleY: 0.82, duration: 0.09, ease: "power2.out" }, start + 0.4);
        timeline.to(mascot, { scaleY: 1, duration: 0.14, ease: "back.out(2)" }, start + 0.49);
        if (plate) {
          timeline.to(
            plate,
            { y: 0, scale: 1, opacity: 1, duration: 0.28, ease: "back.out(1.6)" },
            start + 0.18,
          );
        }
        if (pairSparks.length) {
          timeline.to(
            pairSparks,
            { scale: 1, opacity: 1, duration: 0.2, stagger: 0.04, ease: "back.out(2.4)" },
            start + 0.4,
          );
        }
      });

      badges.forEach((badge) => {
        const owner = badge.closest("[data-vs-player]");
        const index = gsap.utils.toArray<HTMLElement>("[data-vs-player]").indexOf(owner as HTMLElement);
        const start = 0.55 + Math.max(0, index) * 0.42;
        timeline.to(
          badge,
          { scale: 1, opacity: 1, duration: 0.24, ease: "back.out(2.2)" },
          start + 0.3,
        );
      });

      const holdAt = 0.55 + mascots.length * 0.42 + 0.35;
      timeline
        .to(stamp, { scale: 1.08, duration: 0.22, ease: "power2.out" }, holdAt)
        .to(stamp, { scale: 1, duration: 0.3, ease: "power2.inOut" });

      mascots.forEach((mascot, index) => {
        timeline.to(
          mascot,
          {
            y: -6,
            duration: 1.35,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
          holdAt + index * 0.08,
        );
      });
    },
    { scope: rootRef, dependencies: [fighters.length, faceOff] },
  );

  if (fighters.length === 0) {
    return (
      <div className={styles.root} style={{ background: "var(--rp-nb-cream)" }}>
        <p className={styles.empty}>{title}</p>
      </div>
    );
  }

  const stamp = <VsStamp variant={faceOff ? "gutter" : "banner"} />;

  const left = fighters[0];
  const right = fighters[1];

  return (
    <div
      ref={rootRef}
      className={styles.root}
      role="img"
      aria-label={`${kicker}. ${title}. ${fighters.map((f) => f.displayName).join(", ")}`}
    >
      <div className={styles.fx} aria-hidden="true">
        <span className={styles.spark} data-vs-spark />
        <span className={styles.spark} data-vs-spark />
        <span className={styles.spark} data-vs-spark />
        <span className={styles.spark} data-vs-spark />
        <span className={styles.spark} data-vs-spark />
        <span className={styles.spark} data-vs-spark />
        <span className={styles.speedLine} data-vs-line />
        <span className={styles.speedLine} data-vs-line />
      </div>

      <div className={styles.stage} data-vs-stage>
        <p className={styles.kicker} data-vs-kicker>
          {kicker}
        </p>
        {faceOff ? null : stamp}
        <div
          className={`${styles.crew} ${faceOff ? styles.crewFaceoff : styles.crewRoster}`}
          data-vs-crew
        >
          {faceOff && left && right ? (
            <>
              <FighterCard
                key={left.id}
                fighter={left}
                size={size}
                youLabel={youLabel}
                hostLabel={hostLabel}
                playerLabel={playerLabel}
              />
              {stamp}
              <FighterCard
                key={right.id}
                fighter={right}
                size={size}
                youLabel={youLabel}
                hostLabel={hostLabel}
                playerLabel={playerLabel}
              />
            </>
          ) : (
            fighters.map((fighter) => (
              <FighterCard
                key={fighter.id}
                fighter={fighter}
                size={size}
                youLabel={youLabel}
                hostLabel={hostLabel}
                playerLabel={playerLabel}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function VsIntroScreen() {
  const game = useGame();
  const { t } = useI18n();

  const players = useMemo(
    () =>
      [...game.players].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [game.players],
  );

  const size = schleimiSize(players.length);
  const fighters = useMemo<VsIntroFighter[]>(
    () =>
      players.map((player) => ({
        id: player.id,
        displayName: player.display_name,
        role:
          player.id === game.myPlayerId ? "you" : player.is_host ? "host" : "player",
        mascot: (
          <PlayerSchleimi playerId={player.id} size={size} label={player.display_name} />
        ),
      })),
    [players, game.myPlayerId, size],
  );

  return (
    <VsIntroStage
      fighters={fighters}
      kicker={t.match.vsKicker}
      title={t.match.vsTitle}
      youLabel={t.match.vsYou}
      hostLabel={t.match.vsHost}
      playerLabel={t.common.player}
    />
  );
}
