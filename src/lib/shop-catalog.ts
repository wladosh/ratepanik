import { AVATAR_IDS, type AvatarId } from "@/lib/rp-assets";
import {
  ALL_LOOTBOX_IDS,
  LOOTBOX_BASIC_ID,
  LOOTBOX_BASIC_PRICE_HC,
  LOOTBOX_DEFS,
  type LootboxId,
} from "@/lib/schleimi-catalog";

/** @deprecated Phase B grid. Shop no longer sells these. */
export const STARTER_AVATAR_ID: AvatarId = "default_01";

export interface ShopAvatar {
  id: AvatarId;
  name: string;
  /** Hirncoins. 0 = starter, not purchasable. */
  price: number;
}

/**
 * Legacy avatar grid — kept for types / leftover UI.
 * Phase C shop sells `lootbox_basic` only. `purchase_avatar` is stubbed.
 */
export const SHOP_AVATARS: readonly ShopAvatar[] = [
  { id: "default_01", name: "Starter", price: 0 },
  { id: "default_02", name: "Violett", price: 40 },
  { id: "default_03", name: "Rosa", price: 60 },
  { id: "default_04", name: "Mint", price: 80 },
  { id: "default_05", name: "Mango", price: 100 },
  { id: "default_06", name: "Himmel", price: 140 },
] as const;

export const SHOP_LOOTBOX_ID = LOOTBOX_BASIC_ID;
export const SHOP_LOOTBOX_PRICE_FALLBACK = LOOTBOX_BASIC_PRICE_HC;
export { ALL_LOOTBOX_IDS, LOOTBOX_DEFS, type LootboxId };

export function isAvatarId(id: string): id is AvatarId {
  return (AVATAR_IDS as readonly string[]).includes(id);
}

export function shopAvatar(id: string): ShopAvatar | undefined {
  return SHOP_AVATARS.find((item) => item.id === id);
}
