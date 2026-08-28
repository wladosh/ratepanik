"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useGame } from "@/lib/game-context";
import { PlayerSchleimi } from "@/components/player-schleimi";
import { useI18n } from "@/lib/i18n-context";
import {
  LEVELUP_FX_128,
  LOOT_BOX_LEGENDARY_256,
  XP_BADGE_48,
  HIRNCOIN_ICON_48,
  TROPHY_GOLD_512,
  avatarSrc,
} from "@/lib/rp-assets";
import styles from "./guest-account-upsell.module.css";

gsap.registerPlugin(useGSAP);

export function GuestAccountUpsell({
  won,
  onSignup,
  onLogin,
}: {
  won: boolean;
  onSignup: () => void;
  onLogin: () => void;
}) {
  const { t } = useI18n();
  const game = useGame();
  const rootRef = useRef<HTMLDivElement>(null);
  const mascotId = game.myPlayerId;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pass = root.querySelector("[data-upsell-pass]");
      const perks = gsap.utils.toArray<HTMLElement>("[data-upsell-perk]", root);
      const cta = root.querySelector("[data-upsell-cta]");
      if (reduce) {
        gsap.from(root, { opacity: 0, duration: 0.25 });
        return;
      }
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (pass) {
        timeline.from(pass, { y: 36, opacity: 0, rotate: -2, duration: 0.55, ease: "back.out(1.4)" });
      }
      timeline.from(
        perks,
        { x: -16, opacity: 0, duration: 0.35, stagger: 0.1, ease: "power2.out" },
        "-=0.15",
      );
      if (cta) {
        timeline.from(cta, { y: 16, opacity: 0, duration: 0.3 }, "-=0.05");
      }
    },
    { scope: rootRef },
  );

  const perks = [
    {
      key: "level",
      title: t.guestUpsell.perkLevelTitle,
      body: t.guestUpsell.perkLevelBody,
      art: LEVELUP_FX_128,
      badge: XP_BADGE_48,
      wash: "var(--rp-nb-lilac)",
    },
    {
      key: "looks",
      title: t.guestUpsell.perkLooksTitle,
      body: t.guestUpsell.perkLooksBody,
      art: avatarSrc("default_03", 128),
      badge: null,
      wash: "var(--rp-nb-peach)",
    },
    {
      key: "loot",
      title: t.guestUpsell.perkLootTitle,
      body: t.guestUpsell.perkLootBody,
      art: LOOT_BOX_LEGENDARY_256,
      badge: HIRNCOIN_ICON_48,
      wash: "var(--rp-nb-yellow)",
    },
  ] as const;

  return (
    <div ref={rootRef} className={won ? `${styles.root} ${styles.won}` : styles.root}>
      <span className={`${styles.spark} ${styles.sparkA}`} aria-hidden>
        ✦
      </span>
      <span className={`${styles.spark} ${styles.sparkB}`} aria-hidden>
        ✦
      </span>
      <span className={`${styles.spark} ${styles.sparkC}`} aria-hidden>
        ✦
      </span>

      <article className={styles.pass} data-upsell-pass>
        <div className={styles.hero}>
          <p className={styles.stamp}>{t.guestUpsell.passStamp}</p>
          <div className={styles.plinth}>
            {mascotId ? <PlayerSchleimi playerId={mascotId} size={104} /> : null}
            {won ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={TROPHY_GOLD_512} alt="" className={styles.trophy} width={44} height={44} />
            ) : null}
          </div>
          <p className={styles.kicker}>
            {won ? t.guestUpsell.kickerWin : t.guestUpsell.kickerLose}
          </p>
          <h1 className={styles.title}>
            {won ? t.guestUpsell.titleWin : t.guestUpsell.titleLose}
          </h1>
          <p className={styles.lede}>
            {won ? t.guestUpsell.bodyWin : t.guestUpsell.bodyLose}
          </p>
        </div>

        <div className={styles.perforation} aria-hidden>
          <span className={styles.notchLeft} />
          <span className={styles.notchRight} />
        </div>

        <ul className={styles.perks}>
          {perks.map((perk) => (
            <li key={perk.key} data-upsell-perk className={styles.perk}>
              <div className={styles.perkArt} style={{ ["--perk-wash" as string]: perk.wash }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={perk.art} alt="" width={64} height={64} />
                {perk.badge ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={perk.badge} alt="" width={26} height={26} className={styles.perkBadge} />
                ) : null}
              </div>
              <div>
                <p className={styles.perkTitle}>{perk.title}</p>
                <p className={styles.perkBody}>{perk.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.cta} data-upsell-cta>
          <button type="button" className={styles.signup} onClick={onSignup}>
            {t.guestUpsell.ctaSignup}
          </button>
          <button type="button" className={styles.login} onClick={onLogin}>
            {t.guestUpsell.ctaLogin}
          </button>
        </div>
      </article>
    </div>
  );
}
