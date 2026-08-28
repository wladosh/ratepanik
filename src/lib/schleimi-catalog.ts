export const COSMETIC_SLOTS = ["shape", "body_tint", "eyes", "mouth", "background"] as const;
export type CosmeticSlot = (typeof COSMETIC_SLOTS)[number];

export const COSMETIC_RARITIES = ["gewoehnlich", "selten", "legendaer"] as const;
export type CosmeticRarity = (typeof COSMETIC_RARITIES)[number];

export const LOOTBOX_BASIC_ID = "lootbox_basic";
export const LOOTBOX_FORM_ID = "lootbox_form";
export const LOOTBOX_GESICHT_ID = "lootbox_gesicht";
export const LOOTBOX_HINTERGRUND_ID = "lootbox_hintergrund";

/** Order matters: daily deal rotation is index = utc_day % 4 (mirrors SQL). */
export const ALL_LOOTBOX_IDS = [
  LOOTBOX_BASIC_ID,
  LOOTBOX_FORM_ID,
  LOOTBOX_GESICHT_ID,
  LOOTBOX_HINTERGRUND_ID,
] as const;
export type LootboxId = (typeof ALL_LOOTBOX_IDS)[number];

export const LOOTBOX_BASIC_WEIGHTS = {
  gewoehnlich: 70,
  selten: 24,
  legendaer: 6,
} as const;

export const LOOTBOX_BASIC_PRICE_HC = 100;
export const LOOTBOX_SLOT_PRICE_HC = 240;

export const DAILY_DEAL_DISCOUNT = 0.3;

export interface LootboxDef {
  id: LootboxId;
  name_de: string;
  name_en: string;
  subtitle_de: string;
  subtitle_en: string;
  price_hc: number;
  allowed_slots: CosmeticSlot[] | null;
  accent: string;
  art_closed: string;
  art_open: string;
}

export const LOOTBOX_DEFS: readonly LootboxDef[] = [
  {
    id: LOOTBOX_BASIC_ID,
    name_de: "Hirnkiste",
    name_en: "Brain Crate",
    subtitle_de: "Alles drin",
    subtitle_en: "Everything inside",
    price_hc: LOOTBOX_BASIC_PRICE_HC,
    allowed_slots: null,
    accent: "#FF8A71",
    art_closed: "/rp/schleimi/lootbox_closed.png",
    art_open: "/rp/schleimi/lootbox_open.png",
  },
  {
    id: LOOTBOX_FORM_ID,
    name_de: "Formen-Kiste",
    name_en: "Shape Crate",
    subtitle_de: "Nur Formen",
    subtitle_en: "Shapes only",
    price_hc: LOOTBOX_SLOT_PRICE_HC,
    allowed_slots: ["shape"],
    accent: "#7EB6FF",
    art_closed: "/rp/schleimi/lootbox_form_closed.png",
    art_open: "/rp/schleimi/lootbox_form_open.png",
  },
  {
    id: LOOTBOX_GESICHT_ID,
    name_de: "Mimik-Kiste",
    name_en: "Face Crate",
    subtitle_de: "Augen & Münder",
    subtitle_en: "Eyes & mouths",
    price_hc: LOOTBOX_SLOT_PRICE_HC,
    allowed_slots: ["eyes", "mouth"],
    accent: "#C989FF",
    art_closed: "/rp/schleimi/lootbox_face_closed.png",
    art_open: "/rp/schleimi/lootbox_face_open.png",
  },
  {
    id: LOOTBOX_HINTERGRUND_ID,
    name_de: "Deko-Kiste",
    name_en: "Decor Crate",
    subtitle_de: "Nur Hintergründe",
    subtitle_en: "Backgrounds only",
    price_hc: LOOTBOX_SLOT_PRICE_HC,
    allowed_slots: ["background"],
    accent: "#6FCF97",
    art_closed: "/rp/schleimi/lootbox_deko_closed.png",
    art_open: "/rp/schleimi/lootbox_deko_open.png",
  },
] as const;

export function lootboxDefById(id: string): LootboxDef | undefined {
  return LOOTBOX_DEFS.find((d) => d.id === id);
}

export const LOOTBOX_DUPE_HC: Record<CosmeticRarity, number> = {
  gewoehnlich: 15,
  selten: 35,
  legendaer: 60,
};

export const STARTER_SHAPE_ID = "shape_classic";
export const STARTER_TINT_ID = "tint_peach";
export const STARTER_EYES_ID = "eyes_dots";
export const STARTER_MOUTH_ID = "mouth_grin";

export const STARTER_IDS = [
  STARTER_SHAPE_ID,
  STARTER_TINT_ID,
  STARTER_EYES_ID,
  STARTER_MOUTH_ID,
] as const;

/** Slots that always have an item equipped (only background can be empty). */
export const REQUIRED_SLOTS: readonly CosmeticSlot[] = ["shape", "body_tint", "eyes", "mouth"];

export const RARITY_LABEL_DE: Record<CosmeticRarity, string> = {
  gewoehnlich: "Gewöhnlich",
  selten: "Selten",
  legendaer: "Legendär",
};

/** @deprecated Use RARITY_UX_PILL in schleimi-ux — kept as fill shortcuts for placeholders. */
export const RARITY_COLOR: Record<CosmeticRarity, string> = {
  gewoehnlich: "#6B7F9A",
  selten: "#C989FF",
  legendaer: "#E8C547",
};

export const RARITY_SOFT: Record<CosmeticRarity, string> = {
  gewoehnlich: "#E8EEF4",
  selten: "#FDE8F4",
  legendaer: "#FFF6D6",
};

export const SLOT_LABEL_DE: Record<CosmeticSlot, string> = {
  shape: "Form",
  body_tint: "Farbe",
  eyes: "Augen",
  mouth: "Mund",
  background: "Hintergrund",
};

export const LOOTBOX_CLOSED_PATH = "/rp/schleimi/lootbox_closed.png";
export const LOOTBOX_OPEN_PATH = "/rp/schleimi/lootbox_open.png";

export interface SchleimiCatalogItem {
  id: string;
  slot: CosmeticSlot;
  rarity: CosmeticRarity;
  name_de: string;
  slug: string;
  sort_order: number;
}

const SLOT_ID_PREFIX: Record<CosmeticSlot, string> = {
  shape: "shape",
  body_tint: "tint",
  eyes: "eyes",
  mouth: "mouth",
  background: "bg",
};

function item(
  slot: CosmeticSlot,
  rarity: CosmeticRarity,
  slug: string,
  name_de: string,
  sort_order: number,
): SchleimiCatalogItem {
  return {
    id: `${SLOT_ID_PREFIX[slot]}_${slug}`,
    slot,
    rarity,
    name_de,
    slug,
    sort_order,
  };
}

/**
 * Parts are rendered as inline SVG from schleimi-parts.tsx — there are no
 * raster assets. The DB `asset_path` column stores a logical `svg:<id>` key.
 */
export function cosmeticAssetPath(entry: Pick<SchleimiCatalogItem, "id">): string {
  return `svg:${entry.id}`;
}

/** Canonical catalog (also seeded in SQL — keep in sync with the migration). */
export const SCHLEIMI_ITEMS: readonly SchleimiCatalogItem[] = [
  item("shape", "gewoehnlich", "classic", "Klecks", 10),
  item("shape", "gewoehnlich", "round", "Kugelschleim", 20),
  item("shape", "gewoehnlich", "egg", "Glibber-Ei", 30),
  item("shape", "gewoehnlich", "squircle", "Würfelschleim", 40),
  item("shape", "selten", "ghost", "Geisterschleim", 50),
  item("shape", "selten", "tall", "Turmschleim", 60),
  item("shape", "selten", "wobble", "Wackelpudding", 70),
  item("shape", "legendaer", "star", "Sternschleim", 80),

  item("body_tint", "gewoehnlich", "peach", "Pfirsich", 110),
  item("body_tint", "gewoehnlich", "mint", "Minzschleim", 120),
  item("body_tint", "gewoehnlich", "sky", "Himmelblau", 130),
  item("body_tint", "gewoehnlich", "lilac", "Flieder", 140),
  item("body_tint", "gewoehnlich", "mango", "Mango", 150),
  item("body_tint", "gewoehnlich", "blush", "Errötend", 160),
  item("body_tint", "selten", "grape_jelly", "Traubenglibber", 170),
  item("body_tint", "selten", "matcha_swirl", "Matcha-Wirbel", 180),
  item("body_tint", "selten", "midnight", "Nachtgelee", 190),
  item("body_tint", "legendaer", "gold", "Goldschleim", 200),
  item("body_tint", "legendaer", "holo", "Holo-Schleim", 210),

  item("eyes", "gewoehnlich", "dots", "Knopfaugen", 310),
  item("eyes", "gewoehnlich", "happy", "Lachaugen", 320),
  item("eyes", "gewoehnlich", "wink", "Zwinker", 330),
  item("eyes", "gewoehnlich", "wide", "Staunaugen", 340),
  item("eyes", "gewoehnlich", "shy", "Schüchtern", 350),
  item("eyes", "gewoehnlich", "sleepy", "Müde", 360),
  item("eyes", "gewoehnlich", "panic", "Panik-Augen", 370),
  item("eyes", "selten", "sparkle", "Glitzerblick", 380),
  item("eyes", "selten", "hearts", "Herzchenblick", 390),
  item("eyes", "selten", "cool", "Sonnenbrille", 400),
  item("eyes", "legendaer", "glitch", "Glitch-Augen", 410),

  item("mouth", "gewoehnlich", "grin", "Grinser", 510),
  item("mouth", "gewoehnlich", "smile", "Lächeln", 520),
  item("mouth", "gewoehnlich", "oops", "Oops-Mund", 530),
  item("mouth", "gewoehnlich", "shy", "Piepsmund", 540),
  item("mouth", "gewoehnlich", "wavy", "Wellenmund", 550),
  item("mouth", "gewoehnlich", "panic", "Schreckmund", 560),
  item("mouth", "selten", "smirk", "Cooler Smirk", 570),
  item("mouth", "selten", "kiss", "Kussmund", 580),
  item("mouth", "selten", "tongue", "Frechzunge", 590),
  item("mouth", "legendaer", "rainbow", "Regenbogen-Grinser", 600),
  item("mouth", "legendaer", "glitch", "Glitch-Mund", 610),

  item("background", "gewoehnlich", "cream", "Cremewölkchen", 710),
  item("background", "gewoehnlich", "mint", "Mintwiese", 720),
  item("background", "gewoehnlich", "sky", "Himmelchen", 730),
  item("background", "gewoehnlich", "lilac", "Lavendel", 740),
  item("background", "selten", "sunset", "Sonnenuntergang", 750),
  item("background", "selten", "bubbles", "Blasenbad", 760),
  item("background", "selten", "stars", "Sternenhimmel", 770),
  item("background", "legendaer", "gold", "Goldrausch", 780),
  item("background", "legendaer", "holo", "Holo-Traum", 790),
];

/**
 * Mapping used by the DB migration: legacy `face_*` items decompose into an
 * eyes + mouth pair. Owners of a face receive both parts.
 */
export const LEGACY_FACE_MAP: Record<string, { eyes: string; mouth: string }> = {
  face_grin: { eyes: "eyes_dots", mouth: "mouth_grin" },
  face_wink: { eyes: "eyes_wink", mouth: "mouth_smile" },
  face_oops: { eyes: "eyes_wide", mouth: "mouth_oops" },
  face_shy: { eyes: "eyes_shy", mouth: "mouth_shy" },
  face_sleepy: { eyes: "eyes_sleepy", mouth: "mouth_wavy" },
  face_panic: { eyes: "eyes_panic", mouth: "mouth_panic" },
  face_sparkle: { eyes: "eyes_sparkle", mouth: "mouth_smile" },
  face_hearts: { eyes: "eyes_hearts", mouth: "mouth_kiss" },
  face_cool: { eyes: "eyes_cool", mouth: "mouth_smirk" },
  face_rainbow: { eyes: "eyes_happy", mouth: "mouth_rainbow" },
  face_glitch: { eyes: "eyes_glitch", mouth: "mouth_glitch" },
};

export function isCosmeticSlot(value: string): value is CosmeticSlot {
  return (COSMETIC_SLOTS as readonly string[]).includes(value);
}

export function isCosmeticRarity(value: string): value is CosmeticRarity {
  return (COSMETIC_RARITIES as readonly string[]).includes(value);
}

export function catalogById(): Map<string, SchleimiCatalogItem> {
  return new Map(SCHLEIMI_ITEMS.map((entry) => [entry.id, entry]));
}
