export const COSMETIC_SLOTS = ["body_tint", "face", "hat", "extra"] as const;
export type CosmeticSlot = (typeof COSMETIC_SLOTS)[number];

export const COSMETIC_RARITIES = ["gewoehnlich", "selten", "legendaer"] as const;
export type CosmeticRarity = (typeof COSMETIC_RARITIES)[number];

export const LOOTBOX_BASIC_ID = "lootbox_basic";

export const LOOTBOX_BASIC_WEIGHTS = {
  gewoehnlich: 70,
  selten: 24,
  legendaer: 6,
} as const;

export const LOOTBOX_BASIC_PRICE_HC = 100;

export const LOOTBOX_DUPE_HC: Record<CosmeticRarity, number> = {
  gewoehnlich: 15,
  selten: 35,
  legendaer: 60,
};

export const STARTER_TINT_ID = "tint_peach";
export const STARTER_FACE_ID = "face_grin";

export const REQUIRED_SLOTS: readonly CosmeticSlot[] = ["body_tint", "face"];

export const RARITY_LABEL_DE: Record<CosmeticRarity, string> = {
  gewoehnlich: "Gewöhnlich",
  selten: "Selten",
  legendaer: "Legendär",
};

export const RARITY_COLOR: Record<CosmeticRarity, string> = {
  gewoehnlich: "#EDE6DC",
  selten: "#8B7CFF",
  legendaer: "#F5A623",
};

export const RARITY_SOFT: Record<CosmeticRarity, string> = {
  gewoehnlich: "#F6F1EA",
  selten: "#EDE8FF",
  legendaer: "#FFF4D6",
};

export const SLOT_LABEL_DE: Record<CosmeticSlot, string> = {
  body_tint: "Farbe",
  face: "Gesicht",
  hat: "Hut",
  extra: "Extra",
};

export const SCHLEIMI_BASE_PATH = "/rp/schleimi/schleimi_base.png";
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

function item(
  slot: CosmeticSlot,
  rarity: CosmeticRarity,
  slug: string,
  name_de: string,
  sort_order: number,
): SchleimiCatalogItem {
  const prefix =
    slot === "body_tint" ? "tint" : slot === "face" ? "face" : slot === "hat" ? "hat" : "extra";
  return {
    id: `${prefix}_${slug}`,
    slot,
    rarity,
    name_de,
    slug,
    sort_order,
  };
}

export function cosmeticAssetPath(entry: Pick<SchleimiCatalogItem, "slot" | "rarity" | "slug">): string {
  return `/rp/schleimi/slot_${entry.slot}__${entry.rarity}__${entry.slug}.png`;
}

/** Stub catalog (also seeded in SQL). Art files may be missing — UI uses rarity tiles. */
export const SCHLEIMI_ITEMS: readonly SchleimiCatalogItem[] = [
  item("body_tint", "gewoehnlich", "peach", "Pfirsich", 10),
  item("body_tint", "gewoehnlich", "mint", "Minzschleim", 20),
  item("body_tint", "gewoehnlich", "sky", "Himmelblau", 30),
  item("body_tint", "gewoehnlich", "lilac", "Flieder", 40),
  item("body_tint", "gewoehnlich", "mango", "Mango", 50),
  item("body_tint", "gewoehnlich", "blush", "Errötend", 60),
  item("body_tint", "selten", "grape_jelly", "Traubenglibber", 70),
  item("body_tint", "selten", "matcha_swirl", "Matcha-Wirbel", 80),
  item("body_tint", "selten", "midnight", "Nachtgelee", 90),
  item("body_tint", "legendaer", "gold", "Goldschleim", 100),
  item("body_tint", "legendaer", "holo", "Holo-Schleim", 110),

  item("face", "gewoehnlich", "grin", "Grinser", 210),
  item("face", "gewoehnlich", "wink", "Zwinker", 220),
  item("face", "gewoehnlich", "oops", "Oops-Mund", 230),
  item("face", "gewoehnlich", "shy", "Schüchtern", 240),
  item("face", "gewoehnlich", "sleepy", "Müde", 250),
  item("face", "gewoehnlich", "panic", "Panik-Augen", 260),
  item("face", "selten", "sparkle", "Glitzerblick", 270),
  item("face", "selten", "hearts", "Herzchenblick", 280),
  item("face", "selten", "cool", "Cooler Smirk", 290),
  item("face", "legendaer", "rainbow", "Regenbogen-Grinser", 300),
  item("face", "legendaer", "glitch", "Glitch-Mimik", 310),

  item("hat", "gewoehnlich", "party_cone", "Partyhütchen", 410),
  item("hat", "gewoehnlich", "paper_boat", "Papierboot", 420),
  item("hat", "gewoehnlich", "shower_cap", "Duschhaube", 430),
  item("hat", "gewoehnlich", "beanie", "Beanie", 440),
  item("hat", "gewoehnlich", "bow", "Haarschleife", 450),
  item("hat", "gewoehnlich", "propeller", "Propeller-Mütze", 460),
  item("hat", "selten", "disco", "Discokugel", 470),
  item("hat", "selten", "pretzel", "Brezel-Hut", 480),
  item("hat", "selten", "cat_ears", "Katzenohren", 490),
  item("hat", "legendaer", "gold_crown", "Goldkrone", 500),
  item("hat", "legendaer", "neon_halo", "Neon-Heiligenschein", 510),

  item("extra", "gewoehnlich", "round_glasses", "Runde Brille", 610),
  item("extra", "gewoehnlich", "sweat_drop", "Schweißtropfen", 620),
  item("extra", "gewoehnlich", "party_horn", "Luftrüssel", 630),
  item("extra", "gewoehnlich", "blush", "Schamröte", 640),
  item("extra", "gewoehnlich", "plaster", "Pflaster", 650),
  item("extra", "gewoehnlich", "bowtie", "Fliege", 660),
  item("extra", "selten", "star_shades", "Sternenbrille", 670),
  item("extra", "selten", "confetti", "Konfetti-Wolke", 680),
  item("extra", "selten", "mustache", "Schnauzer", 690),
  item("extra", "legendaer", "gold_shades", "Goldbrille", 700),
  item("extra", "legendaer", "glitch_aura", "Glitch-Aura", 710),
];

export const TINT_FILL: Record<string, string> = {
  tint_peach: "#FF8A71",
  tint_mint: "#6FCFB2",
  tint_sky: "#7EB6FF",
  tint_lilac: "#C9C0FF",
  tint_mango: "#FFB86B",
  tint_blush: "#FF7AB6",
  tint_grape_jelly: "#7A6AE8",
  tint_matcha_swirl: "#6FCF97",
  tint_midnight: "#4A3A6A",
  tint_gold: "#F5A623",
  tint_holo: "#E0B0FF",
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
