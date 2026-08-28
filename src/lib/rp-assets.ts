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

// ── Home dashboard feature art ─────────────────────────────────────
export const HOME_CREATE_ROOM_256 = "/rp/rp_home_create_room_256.png";
export const RANK_BADGE_GOLD_128 = "/rp/rp_badge_rank_1_128@2x.png";
export const LOOT_BOX_RARE_128 = "/rp/rp_loot_box_rare_128@2x.png";
export const LOOT_BOX_LEGENDARY_256 = "/rp/rp_loot_box_legendary_256.png";

// ── Home icon-row art ─────────────────────────────────────────────
export const ICON_FRIENDS_SLIMES_128 = "/rp/rp_icon_friends_slimes_128@2x.png";
export const ICON_STATS_CLIPBOARD_128 = "/rp/rp_icon_stats_clipboard_128@2x.png";

// ── Game mode art ───────────────────────────────────────────────────
export const MODE_ORDER_IT_256 = "/rp/rp_mode_order_it_256.png";
export const MODE_NUMBER_GUESS_256 = "/rp/rp_mode_number_guess_256.png";
export const MODE_PICK_CORRECT_256 = "/rp/rp_mode_pick_correct_256.png";

// ── Theme category art ──────────────────────────────────────────────
export const THEME_SLUGS = [
  "gaming",
  "geschichte",
  "wissenschaft-natur",
  "sport",
  "musik",
  "film-serie",
  "reise-orte",
  "essen-trinken",
  "tiere",
] as const;

export type ThemeSlug = (typeof THEME_SLUGS)[number];

export const THEME_ART_256: Record<ThemeSlug, string> = {
  gaming: "/rp/rp_theme_gaming_256.png",
  geschichte: "/rp/rp_theme_geschichte_256.png",
  "wissenschaft-natur": "/rp/rp_theme_wissenschaft_natur_256.png",
  sport: "/rp/rp_theme_sport_256.png",
  musik: "/rp/rp_theme_musik_256.png",
  "film-serie": "/rp/rp_theme_film_serie_256.png",
  "reise-orte": "/rp/rp_theme_reise_orte_256.png",
  "essen-trinken": "/rp/rp_theme_essen_trinken_256.png",
  tiere: "/rp/rp_theme_tiere_256.png",
};

export const THEME_EMOJI: Record<ThemeSlug, string> = {
  gaming: "🎮",
  geschichte: "📜",
  "wissenschaft-natur": "🔬",
  sport: "⚽",
  musik: "🎵",
  "film-serie": "🎬",
  "reise-orte": "🌍",
  "essen-trinken": "🍕",
  tiere: "🐾",
};

export function themeArtSrc(slug: string): string | null {
  return THEME_ART_256[slug as ThemeSlug] ?? null;
}

export function themeEmoji(slug: string): string {
  return THEME_EMOJI[slug as ThemeSlug] ?? "❓";
}

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

export const AVATAR_BG: Record<AvatarId, string> = {
  default_01: "#FFF0E8",
  default_02: "#EDE6FF",
  default_03: "#FFE8F0",
  default_04: "#E8F5E8",
  default_05: "#FFF5E8",
  default_06: "#E0EEFF",
};

// ── Achievement Badges ───────────────────────────────────────────────
export const BADGE_FIRST_WIN_48 = "/rp/rp_badge_first_win_48@2x.png";
export const BADGE_FIRST_WIN_128 = "/rp/rp_badge_first_win_128@2x.png";

export const BADGE_FIRST_ROOM_48 = "/rp/rp_badge_first_room_48@2x.png";
export const BADGE_FIRST_ROOM_128 = "/rp/rp_badge_first_room_128@2x.png";

export const BADGE_PARTY_HOST_48 = "/rp/rp_badge_party_host_48@2x.png";
export const BADGE_PARTY_HOST_128 = "/rp/rp_badge_party_host_128@2x.png";

export const BADGE_STREAK_3_48 = "/rp/rp_badge_streak_3_48@2x.png";
export const BADGE_STREAK_3_128 = "/rp/rp_badge_streak_3_128@2x.png";

export type { AchievementId } from "@/lib/achievement-catalog";
export { ACHIEVEMENT_BY_ID as ACHIEVEMENTS } from "@/lib/achievement-catalog";

export interface AchievementMeta {
  id: import("@/lib/achievement-catalog").AchievementId;
  name_de: string;
  badge48: string;
  badge128: string;
}
