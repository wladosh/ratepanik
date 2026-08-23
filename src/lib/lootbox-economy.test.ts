import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LOOTBOX_BASIC_WEIGHTS,
  SCHLEIMI_ITEMS,
  STARTER_FACE_ID,
  STARTER_TINT_ID,
} from "./schleimi-catalog";
import {
  applyLootboxOpen,
  assertWeightBounds,
  rarityFromRoll,
  weightSum,
} from "./lootbox-economy";

describe("lootbox drop weights", () => {
  it("locks MVP bounds 70 / 24 / 6", () => {
    expect(weightSum(LOOTBOX_BASIC_WEIGHTS)).toBe(100);
    expect(() => assertWeightBounds(LOOTBOX_BASIC_WEIGHTS)).not.toThrow();
    expect(LOOTBOX_BASIC_WEIGHTS).toEqual({
      gewoehnlich: 70,
      selten: 24,
      legendaer: 6,
    });
  });

  it("maps every roll 0–99 onto a rarity with exact bucket sizes", () => {
    const counts = { gewoehnlich: 0, selten: 0, legendaer: 0 };
    for (let roll = 0; roll < 100; roll++) {
      counts[rarityFromRoll(roll)] += 1;
    }
    expect(counts).toEqual({ gewoehnlich: 70, selten: 24, legendaer: 6 });
  });

  it("rejects out-of-range rolls", () => {
    expect(() => rarityFromRoll(-1)).toThrow();
    expect(() => rarityFromRoll(100)).toThrow();
  });
});

describe("lootbox debit + grant", () => {
  it("debits price and grants a new item", () => {
    expect(
      applyLootboxOpen({ balance: 140, alreadyOwned: false, rarity: "selten" }),
    ).toEqual({
      ok: true,
      duplicate: false,
      granted: true,
      consolationHc: 0,
      nextBalance: 40,
    });
  });

  it("does not grant duplicates and refunds consolation by rarity", () => {
    expect(
      applyLootboxOpen({ balance: 100, alreadyOwned: true, rarity: "gewoehnlich" }),
    ).toEqual({
      ok: true,
      duplicate: true,
      granted: false,
      consolationHc: 15,
      nextBalance: 15,
    });
    expect(
      applyLootboxOpen({ balance: 100, alreadyOwned: true, rarity: "selten" }),
    ).toMatchObject({ granted: false, consolationHc: 35, nextBalance: 35 });
    expect(
      applyLootboxOpen({ balance: 100, alreadyOwned: true, rarity: "legendaer" }),
    ).toMatchObject({ granted: false, consolationHc: 60, nextBalance: 60 });
  });

  it("refuses to debit when the balance is too low", () => {
    expect(
      applyLootboxOpen({ balance: 99, alreadyOwned: false, rarity: "gewoehnlich" }),
    ).toEqual({ ok: false, error: "Nicht genug Hirncoins" });
  });
});

describe("schleimi catalog seed", () => {
  it("has 44 cosmetics and starter ids", () => {
    expect(SCHLEIMI_ITEMS).toHaveLength(44);
    expect(SCHLEIMI_ITEMS.filter((item) => item.rarity === "gewoehnlich")).toHaveLength(24);
    expect(SCHLEIMI_ITEMS.filter((item) => item.rarity === "selten")).toHaveLength(12);
    expect(SCHLEIMI_ITEMS.filter((item) => item.rarity === "legendaer")).toHaveLength(8);
    expect(SCHLEIMI_ITEMS.some((item) => item.id === STARTER_TINT_ID)).toBe(true);
    expect(SCHLEIMI_ITEMS.some((item) => item.id === STARTER_FACE_ID)).toBe(true);
  });

  it("keeps MANIFEST.json and SQL seed in sync with stub ids", () => {
    const manifest = JSON.parse(
      readFileSync(resolve("public/rp/schleimi/MANIFEST.json"), "utf8"),
    ) as { items: { id: string }[] };
    const sql = readFileSync(
      resolve("supabase/migrations/20260823_016_phase_c_lootbox.sql"),
      "utf8",
    );
    const ids = SCHLEIMI_ITEMS.map((item) => item.id);
    expect(manifest.items.map((item) => item.id)).toEqual(ids);
    for (const id of ids) {
      expect(sql).toContain(`'${id}'`);
    }
    expect(sql).toContain("open_lootbox");
    expect(sql).toContain("Shop umgestellt");
  });
});
