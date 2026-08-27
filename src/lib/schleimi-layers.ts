import {
  COSMETIC_SLOTS,
  SCHLEIMI_ITEMS,
  STARTER_FACE_ID,
  STARTER_TINT_ID,
  catalogById,
  cosmeticAssetPath,
  type CosmeticSlot,
  type SchleimiCatalogItem,
} from "./schleimi-catalog";
import type { CosmeticItemView } from "./use-cosmetics";

export type SchleimiLayerMap = Partial<Record<CosmeticSlot, CosmeticItemView | null>>;

export const GUEST_TINT_IDS = [
  "tint_peach",
  "tint_mint",
  "tint_sky",
  "tint_lilac",
  "tint_mango",
  "tint_blush",
] as const;

const CATALOG = catalogById();

export function hashToIndex(seed: string, modulo: number): number {
  if (modulo <= 0) return 0;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % modulo;
}

export function catalogItemView(id: string): CosmeticItemView | null {
  const entry = CATALOG.get(id);
  if (!entry) return null;
  return toView(entry);
}

function toView(entry: SchleimiCatalogItem): CosmeticItemView {
  return {
    id: entry.id,
    slot: entry.slot,
    rarity: entry.rarity,
    name_de: entry.name_de,
    asset_path: cosmeticAssetPath(entry),
    sort_order: entry.sort_order,
  };
}

export function guestLayers(seed: string): SchleimiLayerMap {
  const tintId = GUEST_TINT_IDS[hashToIndex(seed, GUEST_TINT_IDS.length)] ?? STARTER_TINT_ID;
  return {
    body_tint: catalogItemView(tintId) ?? catalogItemView(STARTER_TINT_ID),
    face: catalogItemView(STARTER_FACE_ID),
    hat: null,
    extra: null,
  };
}

export function layersFromSlotIds(
  slots: Partial<Record<CosmeticSlot, string | null>>,
): SchleimiLayerMap {
  const layers: SchleimiLayerMap = {};
  for (const slot of COSMETIC_SLOTS) {
    const id = slots[slot];
    layers[slot] = id ? catalogItemView(id) : null;
  }
  if (!layers.body_tint) layers.body_tint = catalogItemView(STARTER_TINT_ID);
  if (!layers.face) layers.face = catalogItemView(STARTER_FACE_ID);
  return layers;
}

export function layersFromLoadoutRows(
  rows: readonly { slot: string; item_id: string | null }[],
): SchleimiLayerMap {
  const slots: Partial<Record<CosmeticSlot, string | null>> = {};
  for (const row of rows) {
    if ((COSMETIC_SLOTS as readonly string[]).includes(row.slot)) {
      slots[row.slot as CosmeticSlot] = row.item_id;
    }
  }
  return layersFromSlotIds(slots);
}

/** @deprecated Replaced by `vsIntroDurationMs`. */
export const VS_MS_PER_PLAYER = 1800;

/**
 * Total VS-intro duration in ms for a given player count.
 * Formula: 1400 + 220 * (n - 1), clamped to [1400, 2500].
 */
export function vsIntroDurationMs(playerCount: number): number {
  const n = Math.max(1, playerCount);
  return Math.min(2500, 1400 + 220 * (n - 1));
}

export function stampVsIntroUntil(
  settings: unknown,
  playerCount: number,
  nowMs = Date.now(),
): Record<string, unknown> {
  const base =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? { ...(settings as Record<string, unknown>) }
      : {};
  base.vsIntroUntil = new Date(nowMs + vsIntroDurationMs(playerCount)).toISOString();
  return base;
}

export function readVsIntroUntil(settings: unknown): number | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const value = (settings as Record<string, unknown>).vsIntroUntil;
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isVsIntroActive(nowMs: number, untilMs: number | null): boolean {
  return untilMs != null && nowMs < untilMs;
}

/** @deprecated No longer used — the VS intro shows all players at once. */
export function vsSlideIndex(
  nowMs: number,
  untilMs: number,
  playerCount: number,
  perMs = VS_MS_PER_PLAYER,
): number {
  const n = Math.max(1, playerCount);
  const total = n * perMs;
  const start = untilMs - total;
  const elapsed = nowMs - start;
  if (elapsed <= 0) return 0;
  return Math.min(n - 1, Math.floor(elapsed / perMs));
}

export { SCHLEIMI_ITEMS };
