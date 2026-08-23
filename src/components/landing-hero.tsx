"use client";

import { useI18n } from "@/lib/i18n-context";
import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./landing-hero.module.css";

gsap.registerPlugin(useGSAP);

const CONFETTI = [
  { x: -112, y: -24, rotation: -120, color: "#8B7CFF", shape: "pill" },
  { x: -92, y: 34, rotation: 90, color: "#FF8A71", shape: "dot" },
  { x: -65, y: -67, rotation: -45, color: "#7EB6FF", shape: "pill" },
  { x: -34, y: -92, rotation: 130, color: "#FF7AB6", shape: "dot" },
  { x: 34, y: -94, rotation: -100, color: "#6FCFB2", shape: "pill" },
  { x: 72, y: -66, rotation: 70, color: "#FFD66B", shape: "dot" },
  { x: 108, y: -20, rotation: 115, color: "#FF7AB6", shape: "pill" },
  { x: 92, y: 37, rotation: -65, color: "#7EB6FF", shape: "dot" },
] as const;

export function LandingHero() {
  const { t } = useI18n();
  const rootRef = useRef<HTMLElement>(null);
  const celebrationRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pieces = gsap.utils.toArray<HTMLElement>("[data-confetti]", root);

      if (reduceMotion) {
        gsap.from(root, { opacity: 0, duration: 0.35, ease: "power1.out" });
        return;
      }

      gsap.set(pieces, { opacity: 0, scale: 0, x: 0, y: 0, rotation: 0 });

      const intro = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      intro
        .from("[data-orbit]", { opacity: 0, scale: 0.55, duration: 0.65 }, 0)
        .from(
          "[data-trophy-drop]",
          {
            opacity: 0,
            y: -74,
            scale: 0.58,
            rotation: -13,
            duration: 0.92,
            ease: "back.out(1.9)",
          },
          0.06,
        )
        .to(
          pieces,
          {
            opacity: 1,
            scale: 1,
            x: (index) => CONFETTI[index].x,
            y: (index) => CONFETTI[index].y,
            rotation: (index) => CONFETTI[index].rotation,
            duration: 0.48,
            stagger: 0.025,
            ease: "power3.out",
          },
          0.48,
        )
        .to(
          pieces,
          {
            opacity: 0,
            y: (index) => CONFETTI[index].y + 20,
            duration: 0.42,
            stagger: 0.02,
            ease: "power1.in",
          },
          0.82,
        )
        .from(
          "[data-word]",
          {
            opacity: 0,
            y: 24,
            scale: 0.88,
            rotation: (index) => (index === 0 ? -3 : 3),
            duration: 0.48,
            stagger: 0.08,
            ease: "back.out(2.2)",
          },
          0.56,
        )
        .from(
          "[data-tagline]",
          { opacity: 0, y: 10, duration: 0.4 },
          0.93,
        )
        .fromTo(
          "[data-shine]",
          { opacity: 0, xPercent: -180 },
          { opacity: 0.75, xPercent: 180, duration: 0.62, ease: "power2.inOut" },
          0.76,
        );

      gsap.to("[data-trophy-float]", {
        y: -5,
        rotation: 1.2,
        duration: 2.1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.2,
      });

      gsap.to("[data-orbit]", {
        scale: 1.05,
        opacity: 0.82,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.1,
      });

      return () => celebrationRef.current?.kill();
    },
    { scope: rootRef },
  );

  const celebrate = () => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pieces = gsap.utils.toArray<HTMLElement>("[data-confetti]", root);
    const trophy = root.querySelector<HTMLElement>("[data-trophy-react]");
    gsap.killTweensOf(pieces);
    gsap.set(pieces, { opacity: 0, scale: 0, x: 0, y: 0, rotation: 0 });
    celebrationRef.current?.kill();

    celebrationRef.current = gsap
      .timeline()
      .to(trophy, {
        keyframes: [
          { rotation: -7, scale: 1.06 },
          { rotation: 7, scale: 1.08 },
          { rotation: 0, scale: 1 },
        ],
        duration: 0.52,
        ease: "power2.out",
      })
      .to(
        pieces,
        {
          opacity: 1,
          scale: 1,
          x: (index) => CONFETTI[index].x,
          y: (index) => CONFETTI[index].y,
          rotation: (index) => CONFETTI[index].rotation,
          duration: 0.42,
          stagger: 0.02,
          ease: "power3.out",
        },
        0.06,
      )
      .to(
        pieces,
        {
          opacity: 0,
          y: (index) => CONFETTI[index].y + 22,
          duration: 0.4,
          stagger: 0.015,
          ease: "power1.in",
        },
        0.4,
      );
  };

  return (
    <section ref={rootRef} className={styles.hero} aria-labelledby="ratepanik-title">
      <div className={styles.ambientOne} aria-hidden="true" />
      <div className={styles.ambientTwo} aria-hidden="true" />
      <div className={styles.orbit} data-orbit aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className={styles.trophyDrop} data-trophy-drop>
        {CONFETTI.map((piece, index) => (
          <span
            key={`${piece.color}-${index}`}
            className={`${styles.confetti} ${piece.shape === "dot" ? styles.confettiDot : ""}`}
            style={{ "--confetti-color": piece.color } as CSSProperties}
            data-confetti
            aria-hidden="true"
          />
        ))}

        <button
          type="button"
          className={styles.trophyButton}
          onClick={celebrate}
          aria-label={t.landing.trophyAria}
        >
          <span className={styles.trophyFloat} data-trophy-float>
            <span className={styles.trophyReact} data-trophy-react>
              <Image
                src="/rp/rp_trophy_gold_512.png"
                alt=""
                width={122}
                height={122}
                priority
                className={styles.trophy}
              />
              <span className={styles.shine} data-shine aria-hidden="true" />
            </span>
          </span>
        </button>
      </div>

      <div className={styles.wordmark}>
        <h1 id="ratepanik-title" className={styles.title} aria-label="RatePanik">
          <span className={styles.rate} data-word aria-hidden="true">Rate</span>
          <span className={styles.panik} data-word aria-hidden="true">Panik</span>
        </h1>
        <span className={styles.swoosh} aria-hidden="true" />
      </div>

      <p className={styles.tagline} data-tagline>
        {t.landing.tagline}
      </p>
    </section>
  );
}
