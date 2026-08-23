import type { CosmeticRarity } from "@/lib/schleimi-catalog";

/** Visual + copy only. Odds numbers are passed in by Dev from lootbox_defs. */

export const REVEAL_SKIP_STORAGE_KEY = "rp_schleimi_reveal_seen";

export const RARITY_UX_PILL: Record<CosmeticRarity, { fill: string; text: string; cap?: string }> = {
  gewoehnlich: { fill: "#6B7F9A", text: "#FFFFFF" },
  selten: { fill: "#C989FF", text: "#FFFFFF", cap: "#FF8A71" },
  legendaer: { fill: "#E8C547", text: "#2A2A4A" },
};

export const RARITY_UX_SOFT: Record<CosmeticRarity, string> = {
  gewoehnlich: "#E8EEF4",
  selten: "#FDE8F4",
  legendaer: "#FFF6D6",
};

export const SCHLEIMI_UX_COPY = {
  shopTitle: "Shop",
  boxName: "Hirnkiste",
  chances: "Chancen",
  open: "Öffnen",
  opening: "Wird geöffnet…",
  openHelper: "Kaufen und sofort aufreißen.",
  broke: "Zu peinlich leer. Spiel ein Match.",
  finePrint: "Meist banal. Manchmal goldig. Kein Echtgeld.",
  skip: "Überspringen",
  dropNew: "Neu. Trag’s, solang dir nicht peinlich ist.",
  dropDupe: "Schon da. Trost: +{n} Hirncoins.",
  wear: "Anziehen",
  keepShopping: "Weiter shoppen",
  unequip: "Bloß",
  guestShopHeadline: "Gäste bleiben nacktschleimig.",
  guestShopBody:
    "Hirnkiste und Looks brauchen ein Konto. Hirncoins kommen aus Matches — nicht aus der Luft.",
  guestFitHeadline: "Schleimi braucht Zuschauer.",
  guestFitBody:
    "Als Gast bleibt der Schleim nackt. Anmelden, dann bleiben Hüte kleben.",
  slotEmpty: "Noch leer. Die Hirnkiste ist schuld.",
} as const;

export function shouldSkipReveal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(REVEAL_SKIP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markRevealSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REVEAL_SKIP_STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
