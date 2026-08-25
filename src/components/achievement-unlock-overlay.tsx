"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useI18n } from "@/lib/i18n-context";
import {
  ACHIEVEMENT_BY_ID,
  achievementCopy,
  isAchievementId,
} from "@/lib/achievement-catalog";
import { AchievementSticker } from "@/components/achievement-sticker";
import styles from "./achievement-unlock-overlay.module.css";

gsap.registerPlugin(useGSAP);

const SPARKLES = [
  { top: 18, left: 18, delay: 0 },
  { top: 8, left: 148, delay: 0.08 },
  { top: 132, left: 8, delay: 0.14 },
  { top: 150, left: 150, delay: 0.2 },
  { top: 70, left: -6, delay: 0.1 },
  { top: 64, left: 168, delay: 0.16 },
];

function SparkleMark() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M8 0l1.8 5.2L16 8l-6.2 2.8L8 16l-1.8-5.2L0 8l6.2-2.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AchievementUnlockOverlay({
  achievementId,
  visible,
  onDismiss,
}: {
  achievementId: string;
  visible: boolean;
  onDismiss: () => void;
}) {
  const { t, locale } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const def = isAchievementId(achievementId) ? ACHIEVEMENT_BY_ID[achievementId] : null;
  const copy = def ? achievementCopy(def, locale) : { title: achievementId, description: "" };

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const backdrop = root.querySelector("[data-unlock-backdrop]");
      const sticker = root.querySelector("[data-unlock-sticker]");
      const glow = root.querySelector("[data-unlock-glow]");
      const shine = root.querySelector("[data-unlock-shine]");
      const copyNodes = root.querySelectorAll("[data-unlock-copy]");
      const sparkles = root.querySelectorAll("[data-unlock-sparkle]");
      const close = root.querySelector("[data-unlock-close]");

      if (reduced) {
        gsap.set([backdrop, sticker, glow, copyNodes, sparkles, close], { opacity: 1, y: 0, scale: 1, rotate: 0 });
        return;
      }

      gsap.set(backdrop, { opacity: 0 });
      gsap.set(sticker, { y: -90, scale: 0.18, rotate: -28, opacity: 0 });
      gsap.set(glow, { scale: 0.2, opacity: 0 });
      gsap.set(shine, { x: -160, opacity: 0 });
      gsap.set(copyNodes, { y: 18, opacity: 0 });
      gsap.set(sparkles, { scale: 0, opacity: 0, rotate: -20 });
      gsap.set(close, { y: 10, opacity: 0 });

      const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
      timeline
        .to(backdrop, { opacity: 1, duration: 0.28 })
        .to(
          sticker,
          { y: 0, scale: 1, rotate: 0, opacity: 1, duration: 0.78, ease: "back.out(1.85)" },
          0.08,
        )
        .to(glow, { scale: 1, opacity: 1, duration: 0.5 }, 0.16)
        .to(shine, { x: 220, opacity: 1, duration: 0.62, ease: "power2.inOut" }, 0.36)
        .to(copyNodes, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08 }, 0.38)
        .to(sparkles, { scale: 1, opacity: 1, rotate: 0, duration: 0.35, stagger: 0.05 }, 0.28)
        .to(close, { y: 0, opacity: 1, duration: 0.3 }, 0.62);

      gsap.to(sticker, {
        y: -7,
        duration: 1.7,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.9,
      });
      gsap.to(sparkles, {
        scale: 1.18,
        duration: 0.9,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.08,
        delay: 0.7,
      });
    },
    { scope: rootRef, dependencies: [achievementId, visible] },
  );

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      className={styles.overlay}
      role="dialog"
      aria-live="polite"
      aria-label={`${t.home.achievementUnlocked}: ${copy.title}`}
      onClick={onDismiss}
    >
      <div className={styles.backdrop} data-unlock-backdrop />
      <div className={styles.stage}>
        <div className={styles.glow} data-unlock-glow aria-hidden="true" />
        <div className={styles.sticker} data-unlock-sticker>
          <AchievementSticker id={achievementId} unlocked hero size={168} />
          <div className={styles.shine} aria-hidden="true">
            <div className={styles.shineBar} data-unlock-shine />
          </div>
          {SPARKLES.map((sparkle, index) => (
            <span
              key={index}
              className={styles.sparkle}
              data-unlock-sparkle
              style={{ top: sparkle.top, left: sparkle.left }}
            >
              <SparkleMark />
            </span>
          ))}
        </div>
        <p className={styles.kicker} data-unlock-copy>
          {t.home.achievementUnlocked}
        </p>
        <p className={styles.name} data-unlock-copy>
          {copy.title}
        </p>
        {copy.description ? (
          <p className={styles.description} data-unlock-copy>
            {copy.description}
          </p>
        ) : null}
        <button
          type="button"
          className={styles.close}
          data-unlock-close
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
        >
          {t.home.achievementClose}
        </button>
      </div>
    </div>
  );
}
