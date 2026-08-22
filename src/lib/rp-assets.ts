/**
 * Centralised Phase B asset paths.
 *
 * Every image under public/rp/ that the UI references should be imported
 * from here so path changes only need one edit.
 *
 * Naming convention follows the MANIFEST in public/rp/MANIFEST.md.
 */

// ── Hirncoins (currency) ────────────────────────────────────────────
export const HIRNCOIN_ICON_20 = "/rp/rp_hirncoin_24@2x.png"; // 48 px rendered at 20 CSS-px (retina)
export const HIRNCOIN_ICON_24 = "/rp/rp_hirncoin_24.png";
export const HIRNCOIN_ICON_48 = "/rp/rp_hirncoin_48.png";

// ── XP badge ────────────────────────────────────────────────────────
export const XP_BADGE_16 = "/rp/rp_badge_xp_32@2x.png"; // 64 px rendered at 16 CSS-px
export const XP_BADGE_32 = "/rp/rp_badge_xp_32.png";
export const XP_BADGE_48 = "/rp/rp_badge_xp_48.png";

// ── Level-up burst FX ───────────────────────────────────────────────
export const LEVELUP_FX_64 = "/rp/rp_fx_levelup_64.png";
export const LEVELUP_FX_128 = "/rp/rp_fx_levelup_64@2x.png";

// ── Trophy ──────────────────────────────────────────────────────────
export const TROPHY_GOLD_512 = "/rp/rp_trophy_gold_512.png";

// ── Confetti FX ─────────────────────────────────────────────────────
export const CONFETTI_SHEET_512 = "/rp/rp_fx_confetti_sheet_512.webp";

// ── Avatars ─────────────────────────────────────────────────────────
const AVATAR_IDS = ["default_01", "default_02", "default_03", "default_04", "default_05", "default_06"] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];
export { AVATAR_IDS };

export function avatarSrc(avatarId: string, size: 128 | 256 | 512 = 256): string {
  const num = avatarId.replace("default_", "");
  if (size === 256) return `/rp/rp_avatar_default_${num}_128@2x.png`;
  return `/rp/rp_avatar_default_${num}_${size}.png`;
}

export const AVATAR_POOL = AVATAR_IDS.map((id) => avatarSrc(id));

// ── Achievement Badges ───────────────────────────────────────────────
export const BADGE_FIRST_WIN_48 = "/rp/rp_badge_first_win_48@2x.png";
export const BADGE_FIRST_WIN_128 = "/rp/rp_badge_first_win_128@2x.png";

export const BADGE_FIRST_ROOM_48 = "/rp/rp_badge_first_room_48@2x.png";
export const BADGE_FIRST_ROOM_128 = "/rp/rp_badge_first_room_128@2x.png";

export const BADGE_PARTY_HOST_48 = "/rp/rp_badge_party_host_48@2x.png";
export const BADGE_PARTY_HOST_128 = "/rp/rp_badge_party_host_128@2x.png";

export const BADGE_STREAK_3_48 = "/rp/rp_badge_streak_3_48@2x.png";
export const BADGE_STREAK_3_128 = "/rp/rp_badge_streak_3_128@2x.png";

export type AchievementId = "first_win" | "first_room" | "streak_3";

export interface AchievementMeta {
  id: AchievementId;
  name_de: string;
  badge48: string;
  badge128: string;
}

export const ACHIEVEMENTS: Record<AchievementId, AchievementMeta> = {
  first_win: {
    id: "first_win",
    name_de: "Erster Sieg",
    badge48: BADGE_FIRST_WIN_48,
    badge128: BADGE_FIRST_WIN_128,
  },
  first_room: {
    id: "first_room",
    name_de: "Gastgeber",
    badge48: BADGE_PARTY_HOST_48,
    badge128: BADGE_PARTY_HOST_128,
  },
  streak_3: {
    id: "streak_3",
    name_de: "3-Tage-Streak",
    badge48: BADGE_STREAK_3_48,
    badge128: BADGE_STREAK_3_128,
  },
};
