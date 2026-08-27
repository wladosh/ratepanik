"use client";

import { useRef } from "react";
import { useI18n } from "@/lib/i18n-context";
import { interpolate } from "@/lib/i18n";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { HomePanelId } from "@/components/home-panels";
import { DecorSchleimi } from "@/components/player-schleimi";
import {
  HOME_CREATE_ROOM_256,
  TROPHY_GOLD_512,
} from "@/lib/rp-assets";
import { LOOTBOX_CLOSED_PATH } from "@/lib/schleimi-catalog";
import styles from "./home-dashboard-cards.module.css";

gsap.registerPlugin(useGSAP);

const STATS_CLIPBOARD_PATH = "/rp/rp_icon_stats_clipboard_128@2x.png";

/** Claymorphic clipboard placeholder until the raster at STATS_CLIPBOARD_PATH ships. */
function StatsClipboardIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="10" y="12" width="36" height="40" rx="6" fill="#FFF8EC" />
      <rect x="10" y="12" width="36" height="40" rx="6" stroke="#F5E6D0" strokeWidth="1.2" />
      <rect x="19" y="8" width="18" height="8" rx="3.5" fill="#FFAD8F" />
      <rect x="22" y="6" width="12" height="5" rx="2.5" fill="#FFC4A8" />
      <rect x="16" y="26" width="14" height="4" rx="2" fill="#B8E6D4" />
      <rect x="16" y="33" width="20" height="4" rx="2" fill="#D4C6F9" />
      <rect x="16" y="40" width="10" height="4" rx="2" fill="#FFD4B8" />
      <polyline points="30,42 34,38 37,40 41,34 44,36" stroke="#C989FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

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

function ChampionCard({ onCreate }: { onCreate: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" onClick={onCreate} className={styles.championCard} data-home-card aria-labelledby="champion-title">
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
    </button>
  );
}

function CreateRoomCard({
  loading,
  isGuest,
  onCreate,
}: Pick<HomeDashboardCardsProps, "loading" | "isGuest" | "onCreate">) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={loading}
      className={styles.createCard}
      data-home-card
    >
      <span className={styles.createCopy}>
        <span className={styles.actionKicker}>
          {isGuest ? t.home.createKickerGuest : t.home.createKicker}
        </span>
        <strong>
          {loading
            ? t.home.createLoading
            : isGuest
              ? t.home.createTitleGuest
              : t.home.createTitle}
        </strong>
        <span>{isGuest ? t.home.createBodyGuest : t.home.createBody}</span>
      </span>
      <span className={styles.hostAsset} data-feature-asset aria-hidden="true">
        <Image
          src={HOME_CREATE_ROOM_256}
          alt=""
          width={96}
          height={96}
          unoptimized
        />
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
  const canJoin = !loading;
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
          {["join-a", "join-b", "join-c"].map((seed, index) => (
            <span key={seed} style={{ zIndex: 3 - index }}>
              <DecorSchleimi seed={seed} size={34} />
            </span>
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
          {loading ? t.common.loading : t.home.joinButton}
        </button>
      </div>

      <p className={styles.joinHint} aria-live="polite">
        {joinError ?? interpolate(t.home.joinChars, { n: roomCode.length })}
      </p>
    </section>
  );
}

function IconRow({
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
    ? null
    : friendCount === null
      ? null
      : friendCount === 0
        ? t.home.buildCrew
        : friendCount === 1
          ? t.home.friendOne
          : interpolate(t.home.friendsMany, { n: friendCount });

  const statsMeta = isGuest
    ? null
    : level === null
      ? null
      : matchGames && matchGames > 0
        ? interpolate(t.home.levelGames, { level, games: matchGames })
        : interpolate(t.home.levelOnly, { level });

  const achievementsMeta = isGuest
    ? null
    : achievementsLoaded
      ? interpolate(t.home.achievementsProgress, {
          unlocked: achievementsUnlocked,
          total: achievementsTotal,
        })
      : null;

  return (
    <div className={styles.iconRow} data-home-card>
      <button
        type="button"
        className={`${styles.iconItem} ${styles.iconFriends}`}
        onClick={() => onOpenPanel("friends")}
      >
        <span className={styles.iconWell} aria-hidden="true">
          <span className={styles.iconSchleimiCluster}>
            {["icon-fr-a", "icon-fr-b", "icon-fr-c"].map((seed, i) => (
              <span key={seed} style={{ zIndex: 3 - i }}>
                <DecorSchleimi seed={seed} size={26} />
              </span>
            ))}
          </span>
        </span>
        <span className={styles.iconLabel}>{t.home.friends}</span>
        {friendsMeta && <span className={styles.iconMeta}>{friendsMeta}</span>}
      </button>

      <button
        type="button"
        className={`${styles.iconItem} ${styles.iconStats}`}
        onClick={() => onOpenPanel("stats")}
      >
        <span className={styles.iconWell} aria-hidden="true">
          <StatsClipboardIcon size={30} />
        </span>
        <span className={styles.iconLabel}>{t.home.stats}</span>
        {statsMeta && <span className={styles.iconMeta}>{statsMeta}</span>}
      </button>

      <button
        type="button"
        className={`${styles.iconItem} ${styles.iconAchievements}`}
        onClick={() => onOpenPanel("achievements")}
      >
        <span className={styles.iconWell} aria-hidden="true">
          <Image src={TROPHY_GOLD_512} alt="" width={30} height={30} />
        </span>
        <span className={styles.iconLabel}>{t.home.achievements}</span>
        {achievementsMeta && <span className={styles.iconMeta}>{achievementsMeta}</span>}
      </button>
    </div>
  );
}

function ShopHero({ onOpenPanel }: { onOpenPanel: (panel: HomePanelId) => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => onOpenPanel("shop")}
      className={styles.shopHero}
      data-home-card
    >
      <span className={styles.shopHeroGlow} aria-hidden="true" />
      <span className={styles.shopHeroCopy}>
        <strong>{t.home.shop}</strong>
        <span>{t.home.shopMeta}</span>
      </span>
      <span className={styles.shopHeroAsset} data-feature-asset aria-hidden="true">
        <Image src={LOOTBOX_CLOSED_PATH} alt="" width={110} height={110} style={{ objectFit: "contain" }} unoptimized />
      </span>
      <ArrowMark />
    </button>
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

      gsap.fromTo(
        "[data-home-card]",
        { opacity: 0, y: 22, scale: 0.975 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.62,
          stagger: 0.07,
          ease: "power3.out",
          overwrite: "auto",
          clearProps: "transform",
        },
      );

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
      <ChampionCard onCreate={props.onCreate} />
      <CreateRoomCard
        loading={props.loading}
        isGuest={props.isGuest}
        onCreate={props.onCreate}
      />
      <JoinRoomCard
        roomCode={props.roomCode}
        joinError={props.joinError}
        loading={props.loading}
        onJoin={props.onJoin}
        onCodeChange={props.onCodeChange}
      />
      <IconRow
        isGuest={props.isGuest}
        friendCount={props.friendCount}
        level={props.level}
        matchGames={props.matchGames}
        achievementsLoaded={props.achievementsLoaded}
        achievementsUnlocked={props.achievementsUnlocked}
        achievementsTotal={props.achievementsTotal}
        onOpenPanel={props.onOpenPanel}
      />
      <ShopHero onOpenPanel={props.onOpenPanel} />
    </div>
  );
}
