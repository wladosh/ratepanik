import { AVATAR_IDS, type AvatarId } from "@/lib/rp-assets";

/** Starter look — always owned, never sold. */
export const STARTER_AVATAR_ID: AvatarId = "default_01";

export interface ShopAvatar {
  id: AvatarId;
  name: string;
  /** Hirncoins. 0 = starter, not purchasable. */
  price: number;
}

/**
 * Static shop catalog. Prices MUST stay in sync with
 * `avatar_shop_price()` in supabase/migrations/20260823_013_shop_avatars.sql.
 * No lootboxes. Achievement badges are not cosmetics.
 */
export const SHOP_AVATARS: readonly ShopAvatar[] = [
  { id: "default_01", name: "Starter", price: 0 },
  { id: "default_02", name: "Violett", price: 40 },
  { id: "default_03", name: "Rosa", price: 60 },
  { id: "default_04", name: "Mint", price: 80 },
  { id: "default_05", name: "Mango", price: 100 },
  { id: "default_06", name: "Himmel", price: 140 },
] as const;

export function isAvatarId(id: string): id is AvatarId {
  return (AVATAR_IDS as readonly string[]).includes(id);
}

export function shopAvatar(id: string): ShopAvatar | undefined {
  return SHOP_AVATARS.find((item) => item.id === id);
}
