import {
  ALL_LOOTBOX_IDS,
  DAILY_DEAL_DISCOUNT,
  type LootboxDef,
  type LootboxId,
  LOOTBOX_DEFS,
} from "./schleimi-catalog";

/**
 * UTC-based daily deal rotation.
 *
 * Algorithm matches the Postgres `daily_deal_box_id(date)` function:
 *   index = (utc_days_since_epoch % 4)
 * Order: lootbox_basic, lootbox_face, lootbox_hat, lootbox_extra.
 *
 * We use UTC so that the deal rotates at midnight UTC for all users.
 * This is documented and intentional — no timezone dependency.
 */
function utcDaysSinceEpoch(now: Date = new Date()): number {
  return Math.floor(now.getTime() / 86_400_000);
}

export function dailyDealBoxId(now: Date = new Date()): LootboxId {
  const idx = ((utcDaysSinceEpoch(now) % 4) + 4) % 4;
  return ALL_LOOTBOX_IDS[idx];
}

export function dailyDealPrice(basePrice: number): number {
  return Math.ceil(basePrice * (1 - DAILY_DEAL_DISCOUNT));
}

export interface DailyDeal {
  boxId: LootboxId;
  def: LootboxDef;
  originalPrice: number;
  dealPrice: number;
}

export function getDailyDeal(now: Date = new Date()): DailyDeal {
  const boxId = dailyDealBoxId(now);
  const def = LOOTBOX_DEFS.find((d) => d.id === boxId)!;
  return {
    boxId,
    def,
    originalPrice: def.price_hc,
    dealPrice: dailyDealPrice(def.price_hc),
  };
}
