import {
  LOOTBOX_BASIC_PRICE_HC,
  LOOTBOX_BASIC_WEIGHTS,
  LOOTBOX_DUPE_HC,
  type CosmeticRarity,
} from "./schleimi-catalog";

export type LootboxWeights = {
  gewoehnlich: number;
  selten: number;
  legendaer: number;
};

export function weightSum(weights: LootboxWeights): number {
  return weights.gewoehnlich + weights.selten + weights.legendaer;
}

/** MVP bounds: integers, sum 100, gewöhnlich majority, legendär rare but possible. */
export function assertWeightBounds(weights: LootboxWeights): void {
  for (const value of Object.values(weights)) {
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      throw new Error("Gewicht muss eine ganze Zahl zwischen 0 und 100 sein");
    }
  }
  if (weightSum(weights) !== 100) {
    throw new Error("Gewichte müssen 100 ergeben");
  }
  if (weights.gewoehnlich < weights.selten || weights.selten < weights.legendaer) {
    throw new Error("Gewöhnlich ≥ Selten ≥ Legendär erwartet");
  }
  if (weights.legendaer < 1 || weights.legendaer > 15) {
    throw new Error("Legendär-Gewicht außerhalb 1–15");
  }
}

/**
 * Maps a server roll 0..99 onto a rarity. Must match
 * `open_lootbox` in supabase/migrations/20260823_016_phase_c_lootbox.sql.
 */
export function rarityFromRoll(roll: number, weights: LootboxWeights = LOOTBOX_BASIC_WEIGHTS): CosmeticRarity {
  if (!Number.isInteger(roll) || roll < 0 || roll > 99) {
    throw new Error("Roll muss 0–99 sein");
  }
  if (roll < weights.gewoehnlich) return "gewoehnlich";
  if (roll < weights.gewoehnlich + weights.selten) return "selten";
  return "legendaer";
}

export interface OpenLootboxInput {
  balance: number;
  alreadyOwned: boolean;
  rarity: CosmeticRarity;
  price?: number;
  dupeHc?: Record<CosmeticRarity, number>;
}

export type OpenLootboxResult =
  | { ok: false; error: string }
  | {
      ok: true;
      duplicate: boolean;
      granted: boolean;
      consolationHc: number;
      nextBalance: number;
    };

/** Pure debit + grant model. SQL is the authority; tests lock this contract. */
export function applyLootboxOpen(input: OpenLootboxInput): OpenLootboxResult {
  const price = input.price ?? LOOTBOX_BASIC_PRICE_HC;
  const dupeHc = input.dupeHc ?? LOOTBOX_DUPE_HC;

  if (!Number.isInteger(input.balance) || input.balance < 0) {
    return { ok: false, error: "Kein Profil" };
  }
  if (input.balance < price) {
    return { ok: false, error: "Nicht genug Hirncoins" };
  }

  const afterDebit = input.balance - price;
  if (input.alreadyOwned) {
    const consolationHc = dupeHc[input.rarity];
    return {
      ok: true,
      duplicate: true,
      granted: false,
      consolationHc,
      nextBalance: afterDebit + consolationHc,
    };
  }

  return {
    ok: true,
    duplicate: false,
    granted: true,
    consolationHc: 0,
    nextBalance: afterDebit,
  };
}
