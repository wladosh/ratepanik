import type { ReactNode } from "react";
import type { AchievementId } from "@/lib/achievement-catalog";
import { ACHIEVEMENT_BY_ID } from "@/lib/achievement-catalog";

type StickerArtProps = {
  ink: string;
  locked: boolean;
};

function polarPath(cx: number, cy: number, radii: number[], offset = -Math.PI / 2): string {
  return (
    radii
      .map((radius, index) => {
        const angle = offset + (index / radii.length) * Math.PI * 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ") + "Z"
  );
}

const SHAPES: Record<AchievementId, string> = {
  first_game:
    "M80 16c10 2 22 10 30 20 14-8 28 4 24 18 14 6 14 24 4 32 10 14-4 30-18 26-6 16-26 24-36 20-10 8-30-2-34-16-16 4-26-12-16-26-12-8-12-28 0-34-4-16 14-30 28-24 6-12 12-16 18-16z",
  first_win:
    "M80 14l50 16c1 50-12 90-50 112C42 120 29 80 30 30z",
  first_room:
    "M80 18l58 48h-14v60H36V66H22z",
  streak_3:
    "M82 148c-42-26-50-62-28-90-10 20 6 26 10 8 6-32 24-46 32-58 14 34 34 48 28 80 18-8 18 24-42 60z",
  exact_hit: polarPath(80, 80, [62, 50, 62, 50, 62, 50, 62, 50, 62, 50, 62, 50]),
  exact_streak_3: "M80 12l44 40-8 62L80 148 44 114l-8-62z",
  close_call:
    "M44 28c0-18 18-24 36-24s36 6 36 24v62c0 14-10 24-22 24V86c0-18-8-30-14-30s-14 12-14 30v28c-12 0-22-10-22-24z",
  wild_guess: polarPath(80, 80, [70, 40, 68, 36, 72, 42, 64, 38, 70, 34, 66, 40]),
  perfect_pick:
    "M38 28h84a14 14 0 0 1 14 14v76a14 14 0 0 1-14 14H38a14 14 0 0 1-14-14V42a14 14 0 0 1 14-14zm-6 40a8 8 0 1 0 0 16h0a8 8 0 0 0 0-16zm100 0a8 8 0 1 0 0 16h0a8 8 0 0 0 0-16z",
  pick_streak_3:
    "M48 18h64a12 12 0 0 1 12 12v100a12 12 0 0 1-12 12H48a12 12 0 0 1-12-12V30a12 12 0 0 1 12-12z",
  almost:
    "M80 16a64 64 0 1 1-45.3 18.7L80 80z",
  panic_pick:
    "M46 20h28l6 20 6-20h28l-20 36 22 38H84l-4-18-4 18H54l22-38z",
  clutch: "M92 12l-44 70h28L62 148l54-78H90z",
  rematch:
    "M80 16a64 64 0 1 1 0 128 64 64 0 0 1 0-128z",
  full_lobby:
    "M48 70c-2-22 16-36 34-30 6-18 30-22 40-6 18-4 32 12 28 28 18 6 16 32-2 38H28c-16-4-18-22-2-30z",
  night_owl:
    "M108 28a54 54 0 1 0 8 96 42 42 0 1 1-8-96z",
  games_10:
    "M28 46h104a8 8 0 0 1 8 8v10c-7 0-7 14 0 14v8c-7 0-7 14 0 14v12a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8v-12c7 0 7-14 0-14v-8c7 0 7-14 0-14V54a8 8 0 0 1 8-8z",
  wins_5:
    "M28 58l16-28 20 18 16-30 16 30 20-18 16 28-10 10v40c0 12-18 22-46 22s-46-10-46-22V68z",
  exact_10: polarPath(80, 80, [70, 32, 70, 32, 70, 32, 70, 32, 70, 32, 70, 32, 70, 32, 70, 32, 70, 32, 70, 32]),
  perfect_10: "M80 14l50 28v56L80 146 30 98V42z",
};

function FirstGameArt({ ink }: StickerArtProps) {
  return (
    <g fill={ink} stroke={ink} strokeLinecap="round" strokeLinejoin="round">
      <path d="M58 78c0-14 10-24 22-24s22 10 22 24v10c0 8-6 14-14 16v8H72v-8c-8-2-14-8-14-16z" fill="none" strokeWidth="5" />
      <circle cx="70" cy="76" r="3" stroke="none" />
      <circle cx="90" cy="76" r="3" stroke="none" />
      <path d="M72 92h16" fill="none" strokeWidth="4" />
      <path d="M52 58l-8-10M108 58l8-10M80 50V38" fill="none" strokeWidth="4" />
    </g>
  );
}

function FirstWinArt({ ink }: StickerArtProps) {
  return (
    <g fill={ink}>
      <path d="M56 58h48v18c0 14-10 24-24 24s-24-10-24-24z" />
      <path d="M64 100h32v10H64z" />
      <path d="M58 110h44v8c0 4-6 8-22 8s-22-4-22-8z" />
      <path d="M50 58c-8 2-14 10-12 20 6-6 12-8 18-8z" />
      <path d="M110 58c8 2 14 10 12 20-6-6-12-8-18-8z" />
    </g>
  );
}

function FirstRoomArt({ ink }: StickerArtProps) {
  return (
    <g fill={ink}>
      <path d="M80 46l36 28H44z" />
      <path d="M52 76h56v40H52z" />
      <rect x="70" y="90" width="20" height="26" rx="3" fill="#fff" opacity="0.35" />
    </g>
  );
}

function StreakArt({ ink }: StickerArtProps) {
  return (
    <g fill={ink}>
      <path d="M80 118c-16-12-20-28-10-42-4 10 4 12 6 4 4-16 12-22 16-28 6 16 16 24 14 38 8-4 8 12-26 28z" />
      <text x="80" y="78" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">
        3
      </text>
    </g>
  );
}

function ExactHitArt({ ink }: StickerArtProps) {
  return (
    <g fill="none" stroke={ink} strokeWidth="6">
      <circle cx="80" cy="80" r="28" />
      <circle cx="80" cy="80" r="14" />
      <circle cx="80" cy="80" r="5" fill={ink} stroke="none" />
    </g>
  );
}

function ClairvoyantArt({ ink }: StickerArtProps) {
  return (
    <g fill="none" stroke={ink} strokeWidth="5" strokeLinejoin="round">
      <path d="M36 80c16-22 32-32 44-32s28 10 44 32c-16 22-32 32-44 32s-28-10-44-32z" />
      <circle cx="80" cy="80" r="12" fill={ink} stroke="none" />
      <circle cx="84" cy="76" r="4" fill="#fff" stroke="none" />
    </g>
  );
}

function CloseCallArt({ ink }: StickerArtProps) {
  return (
    <g fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round">
      <circle cx="80" cy="80" r="26" />
      <path d="M80 54v16M98 92l-10-8" />
      <circle cx="104" cy="104" r="7" fill={ink} stroke="none" />
    </g>
  );
}

function WildGuessArt({ ink }: StickerArtProps) {
  return (
    <g fill={ink}>
      <rect x="56" y="56" width="48" height="48" rx="8" transform="rotate(-12 80 80)" />
      <circle cx="70" cy="74" r="4" fill="#fff" />
      <circle cx="90" cy="90" r="4" fill="#fff" />
      <circle cx="90" cy="70" r="4" fill="#fff" />
    </g>
  );
}

function PerfectPickArt({ ink }: StickerArtProps) {
  return (
    <g fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M52 82l16 16 40-40" />
    </g>
  );
}

function PickStreakArt({ ink }: StickerArtProps) {
  return (
    <g fill={ink}>
      <rect x="50" y="46" width="36" height="50" rx="6" transform="rotate(-16 68 71)" opacity="0.55" />
      <rect x="62" y="44" width="36" height="50" rx="6" transform="rotate(14 80 69)" opacity="0.75" />
      <rect x="62" y="50" width="36" height="52" rx="6" />
      <text x="80" y="84" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff">
        3
      </text>
    </g>
  );
}

function AlmostArt({ ink }: StickerArtProps) {
  return (
    <g fill={ink}>
      <path d="M80 50a30 30 0 1 1-21 9" opacity="0.3" />
      <path d="M80 50a30 30 0 1 1-21 9L80 80z" />
    </g>
  );
}

function PanicPickArt({ ink }: StickerArtProps) {
  return (
    <g stroke={ink} strokeWidth="10" strokeLinecap="round">
      <path d="M56 56l48 48M104 56l-48 48" />
    </g>
  );
}

function ClutchArt({ ink }: StickerArtProps) {
  return (
    <g fill={ink}>
      <path d="M90 40l-28 44h18l-8 36 32-48H86z" />
    </g>
  );
}

function RematchArt({ ink }: StickerArtProps) {
  return (
    <g fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M52 70a28 28 0 0 1 46-12" />
      <path d="M108 90a28 28 0 0 1-46 12" />
      <path d="M92 48l10 12-14 2" fill={ink} stroke="none" />
      <path d="M68 112l-10-12 14-2" fill={ink} stroke="none" />
    </g>
  );
}

function FullLobbyArt({ ink }: StickerArtProps) {
  return (
    <g fill={ink}>
      <circle cx="56" cy="74" r="10" />
      <circle cx="80" cy="68" r="11" />
      <circle cx="104" cy="74" r="10" />
      <path d="M40 108c2-16 12-22 24-22 6 8 16 10 22 2 6 8 16 6 22-2 12 0 22 6 24 22z" />
    </g>
  );
}

function NightOwlArt({ ink }: StickerArtProps) {
  return (
    <g fill={ink}>
      <path d="M96 52a28 28 0 1 0 4 52 22 22 0 1 1-4-52z" />
      <circle cx="118" cy="46" r="4" />
      <circle cx="128" cy="62" r="2.5" />
    </g>
  );
}

function Games10Art({ ink }: StickerArtProps) {
  return (
    <text x="80" y="92" textAnchor="middle" fontSize="36" fontWeight="800" fill={ink}>
      10
    </text>
  );
}

function Wins5Art({ ink }: StickerArtProps) {
  return (
    <text x="80" y="100" textAnchor="middle" fontSize="36" fontWeight="800" fill={ink}>
      5
    </text>
  );
}

function Exact10Art({ ink }: StickerArtProps) {
  return (
    <g>
      <circle cx="80" cy="80" r="16" fill="none" stroke={ink} strokeWidth="5" />
      <text x="80" y="88" textAnchor="middle" fontSize="18" fontWeight="800" fill={ink}>
        10
      </text>
    </g>
  );
}

function Perfect10Art({ ink }: StickerArtProps) {
  return (
    <g fill={ink}>
      <path d="M80 48l8 16 18 2-13 13 4 18-17-10-17 10 4-18-13-13 18-2z" />
    </g>
  );
}

const ART: Record<AchievementId, (props: StickerArtProps) => ReactNode> = {
  first_game: FirstGameArt,
  first_win: FirstWinArt,
  first_room: FirstRoomArt,
  streak_3: StreakArt,
  exact_hit: ExactHitArt,
  exact_streak_3: ClairvoyantArt,
  close_call: CloseCallArt,
  wild_guess: WildGuessArt,
  perfect_pick: PerfectPickArt,
  pick_streak_3: PickStreakArt,
  almost: AlmostArt,
  panic_pick: PanicPickArt,
  clutch: ClutchArt,
  rematch: RematchArt,
  full_lobby: FullLobbyArt,
  night_owl: NightOwlArt,
  games_10: Games10Art,
  wins_5: Wins5Art,
  exact_10: Exact10Art,
  perfect_10: Perfect10Art,
};

const LOCKED = {
  from: "#D8D8E4",
  to: "#A8A8BA",
  ink: "#6E6E82",
};

export function AchievementSticker({
  id,
  unlocked,
  size = 120,
  className,
  hero = false,
}: {
  id: string;
  unlocked: boolean;
  size?: number;
  className?: string;
  hero?: boolean;
}) {
  const def = isKnownId(id) ? ACHIEVEMENT_BY_ID[id] : null;
  const path = def ? SHAPES[def.id] : SHAPES.first_win;
  const colors = unlocked && def ? def.colors : LOCKED;
  const Art = def ? ART[def.id] : FirstWinArt;
  const uid = `sticker-${id}-${unlocked ? "on" : "off"}-${size}`;

  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        {unlocked ? (
          <filter id={`${uid}-shadow`} x="-30%" y="-20%" width="160%" height="170%">
            <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#2A2A4A" floodOpacity="0.22" />
          </filter>
        ) : (
          <filter id={`${uid}-shadow`} x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#1a1a2e" floodOpacity="0.18" />
          </filter>
        )}
        <linearGradient id={`${uid}-face`} x1="18%" y1="8%" x2="86%" y2="94%">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
        <linearGradient id={`${uid}-gloss`} x1="30%" y1="0%" x2="70%" y2="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.72" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <path d={path} />
        </clipPath>
      </defs>

      <path
        d={path}
        fill={`url(#${uid}-face)`}
        stroke={unlocked ? "#FFFFFF" : "#1a1a2e"}
        strokeWidth={hero ? 14 : unlocked ? 11 : 6}
        strokeLinejoin="round"
        paintOrder="stroke fill"
        filter={`url(#${uid}-shadow)`}
      />
      <g clipPath={`url(#${uid}-clip)`}>
        <ellipse cx="62" cy="44" rx="42" ry="22" fill={`url(#${uid}-gloss)`} />
        <path d={path} fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="3" />
        <Art ink={colors.ink} locked={!unlocked} />
        {!unlocked ? (
          <g>
            <rect x="0" y="0" width="160" height="160" fill="#8B8B9C" opacity="0.18" />
            <g transform="translate(80 118)">
              <circle r="13" fill="#6B6B7E" />
              <path
                d="M-5 1v-5a5 5 0 0 1 10 0v5"
                fill="none"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <rect x="-7" y="1" width="14" height="10" rx="2" fill="#fff" />
            </g>
          </g>
        ) : null}
      </g>
    </svg>
  );
}

function isKnownId(id: string): id is AchievementId {
  return Object.prototype.hasOwnProperty.call(ACHIEVEMENT_BY_ID, id);
}
