"use client";

import { useRef } from "react";
import { useI18n } from "@/lib/i18n-context";
import { interpolate } from "@/lib/i18n";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { HomePanelId } from "@/components/home-panels";
import {
  AVATAR_POOL,
  BADGE_FIRST_ROOM_128,
  BADGE_FIRST_WIN_128,
  LOOT_BOX_RARE_128,
  RANK_BADGE_GOLD_128,
  TROPHY_GOLD_512,
} from "@/lib/rp-assets";
import styles from "./home-dashboard-cards.module.css";

gsap.registerPlugin(useGSAP);

type HomeDashboardCardsProps = {
  roomCode: string;
  joinError: string | null;
  loading: boolean;
  isGuest: boolean;
  friendCount: number | null;
  level: number | null;
  matchGames: number | null;
  achievementsLoaded: boolean;
  achievementsUnlocked: number;
  achievementsTotal: number;
  onCreate: () => void;
  onJoin: () => void;
  onCodeChange: (value: string) => void;
  onOpenPanel: (panel: HomePanelId) => void;
};

function ArrowMark() {
  return (
    <span className={styles.arrow} aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none">
        <path d="m7.5 5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ChampionCard() {
  const { t } = useI18n();
  return (
    <section className={styles.championCard} data-home-card aria-labelledby="champion-title">
      <span className={styles.heroGlow} aria-hidden="true" />
      <span className={styles.heroRing} aria-hidden="true" />
      <span className={`${styles.spark} ${styles.sparkOne}`} aria-hidden="true" />
      <span className={`${styles.spark} ${styles.sparkTwo}`} aria-hidden="true" />
      <span className={`${styles.spark} ${styles.sparkThree}`} aria-hidden="true" />

      <div className={styles.championCopy}>
        <p className={styles.kicker}>{t.home.championKicker}</p>
        <h2 id="champion-title" className={styles.championTitle}>
          {t.home.championTitle}
          <span>{t.home.championAccent}</span>
        </h2>
        <p className={styles.championBody}>
          {t.home.championBody}
        </p>
      </div>

      <div className={styles.trophyScene} data-feature-asset aria-hidden="true">
        <span className={styles.trophyShadow} />
        <Image
          src={TROPHY_GOLD_512}
          alt=""
          width={126}
          height={126}
          className={styles.trophy}
          priority
        />
      </div>
    </section>
  );
}

function CreateRoomCard({
  loading,
  onCreate,
}: Pick<HomeDashboardCardsProps, "loading" | "onCreate">) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={loading}
      className={styles.createCard}
      data-home-card
    >
      <span className={styles.createGlow} aria-hidden="true" />
      <span className={styles.createCopy}>
        <span className={styles.actionKicker}>{t.home.createKicker}</span>
        <strong>{loading ? t.home.createLoading : t.home.createTitle}</strong>
        <span>{t.home.createBody}</span>
      </span>
      <span className={styles.hostAsset} data-feature-asset aria-hidden="true">
        <Image src={BADGE_FIRST_ROOM_128} alt="" width={84} height={84} />
      </span>
      <ArrowMark />
    </button>
  );
}

function JoinRoomCard({
  roomCode,
  joinError,
  loading,
  onJoin,
  onCodeChange,
}: Pick<
  HomeDashboardCardsProps,
  "roomCode" | "joinError" | "loading" | "onJoin" | "onCodeChange"
>) {
  const canJoin = roomCode.trim().length === 6 && !loading;
  const { t } = useI18n();

  return (
    <section
      className={`${styles.joinCard} ${joinError ? styles.joinCardError : ""}`}
      data-home-card
      aria-labelledby="join-title"
    >
      <div className={styles.joinHeading}>
        <div>
          <p className={styles.kicker}>{t.home.joinKicker}</p>
          <h2 id="join-title">{t.home.joinTitle}</h2>
        </div>
        <div className={styles.joinAvatars} aria-hidden="true">
          {AVATAR_POOL.slice(1, 4).map((src, index) => (
            <Image key={src} src={src} alt="" width={36} height={36} style={{ zIndex: 3 - index }} />
          ))}
        </div>
      </div>

      <div className={styles.joinDock}>
        <label className={styles.codeField}>
          <span className="sr-only">{t.home.joinCodeAria}</span>
          <span className={styles.codeSlots} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} className={roomCode[index] ? styles.codeSlotFilled : ""}>
                {roomCode[index] ?? ""}
              </span>
            ))}
          </span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={roomCode}
            onChange={(event) => onCodeChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onJoin()}
            maxLength={6}
          />
        </label>

        <button
          type="button"
          onClick={onJoin}
          disabled={!canJoin}
          className={styles.joinButton}
        >
          {loading ? "…" : t.home.joinButton}
        </button>
      </div>

      <p className={styles.joinHint} aria-live="polite">
        {joinError ?? interpolate(t.home.joinChars, { n: roomCode.length })}
      </p>
    </section>
  );
}

function FriendsAsset() {
  return (
    <span className={`${styles.featureAsset} ${styles.friendAsset}`} data-feature-asset aria-hidden="true">
      {AVATAR_POOL.slice(0, 3).map((src, index) => (
        <Image key={src} src={src} alt="" width={52} height={52} style={{ zIndex: 3 - index }} />
      ))}
    </span>
  );
}

type FeatureCardProps = {
  panel: HomePanelId;
  title: string;
  meta: string;
  className: string;
  asset: React.ReactNode;
  onOpen: (panel: HomePanelId) => void;
};

function FeatureCard({
  panel,
  title,
  meta,
  className,
  asset,
  onOpen,
}: FeatureCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(panel)}
      className={`${styles.featureCard} ${className}`}
      data-home-card
    >
      <span className={styles.featureGlow} aria-hidden="true" />
      <span className={styles.featureMeta}>{meta}</span>
      {asset}
      <span className={styles.featureBottom}>
        <strong>{title}</strong>
        <ArrowMark />
      </span>
    </button>
  );
}

function FeatureGrid({
  isGuest,
  friendCount,
  level,
  matchGames,
  achievementsLoaded,
  achievementsUnlocked,
  achievementsTotal,
  onOpenPanel,
}: Pick<
  HomeDashboardCardsProps,
  | "isGuest"
  | "friendCount"
  | "level"
  | "matchGames"
  | "achievementsLoaded"
  | "achievementsUnlocked"
  | "achievementsTotal"
  | "onOpenPanel"
>) {
  const { t } = useI18n();
  const friendsMeta = isGuest
    ? t.home.connectAccount
    : friendCount === null
      ? t.home.loadingMeta
      : friendCount === 0
        ? t.home.buildCrew
        : friendCount === 1
          ? t.home.friendOne
          : interpolate(t.home.friendsMany, { n: friendCount });

  const statsMeta = isGuest || level === null
    ? t.home.connectAccount
    : matchGames && matchGames > 0
      ? interpolate(t.home.levelGames, { level, games: matchGames })
      : interpolate(t.home.levelOnly, { level });

  const achievementsMeta = isGuest
    ? t.home.connectAccount
    : achievementsLoaded
      ? interpolate(t.home.achievementsProgress, {
          unlocked: achievementsUnlocked,
          total: achievementsTotal,
        })
      : t.home.loadingMeta;

  return (
    <div className={styles.featureGrid}>
      <FeatureCard
        panel="friends"
        title={t.home.friends}
        meta={friendsMeta}
        className={styles.friendsCard}
        asset={<FriendsAsset />}
        onOpen={onOpenPanel}
      />
      <FeatureCard
        panel="stats"
        title={t.home.stats}
        meta={statsMeta}
        className={styles.statsCard}
        asset={
          <span className={styles.featureAsset} data-feature-asset aria-hidden="true">
            <Image src={RANK_BADGE_GOLD_128} alt="" width={68} height={68} />
          </span>
        }
        onOpen={onOpenPanel}
      />
      <FeatureCard
        panel="achievements"
        title={t.home.achievements}
        meta={achievementsMeta}
        className={styles.achievementsCard}
        asset={
          <span className={styles.featureAsset} data-feature-asset aria-hidden="true">
            <Image src={BADGE_FIRST_WIN_128} alt="" width={68} height={68} />
          </span>
        }
        onOpen={onOpenPanel}
      />
      <FeatureCard
        panel="shop"
        title={t.home.shop}
        meta={t.home.shopMeta}
        className={styles.shopCard}
        asset={
          <span className={`${styles.featureAsset} ${styles.shopAsset}`} data-feature-asset aria-hidden="true">
            <Image src={LOOT_BOX_RARE_128} alt="" width={78} height={78} />
          </span>
        }
        onOpen={onOpenPanel}
      />
    </div>
  );
}

export function HomeDashboardCards(props: HomeDashboardCardsProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set("[data-home-card]", { opacity: 1 });
        return;
      }

      gsap.from("[data-home-card]", {
        opacity: 0,
        y: 22,
        scale: 0.975,
        duration: 0.62,
        stagger: 0.07,
        ease: "power3.out",
        clearProps: "transform",
      });

      gsap.to("[data-feature-asset]", {
        y: -4,
        rotation: 1.2,
        duration: 2.4,
        stagger: 0.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef}>
      <ChampionCard />
      <CreateRoomCard loading={props.loading} onCreate={props.onCreate} />
      <JoinRoomCard
        roomCode={props.roomCode}
        joinError={props.joinError}
        loading={props.loading}
        onJoin={props.onJoin}
        onCodeChange={props.onCodeChange}
      />
      <FeatureGrid
        isGuest={props.isGuest}
        friendCount={props.friendCount}
        level={props.level}
        matchGames={props.matchGames}
        achievementsLoaded={props.achievementsLoaded}
        achievementsUnlocked={props.achievementsUnlocked}
        achievementsTotal={props.achievementsTotal}
        onOpenPanel={props.onOpenPanel}
      />
    </div>
  );
}
