import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_LOOTBOX_IDS,
  LEGACY_FACE_MAP,
  LOOTBOX_BASIC_WEIGHTS,
  LOOTBOX_BASIC_PRICE_HC,
  LOOTBOX_SLOT_PRICE_HC,
  LOOTBOX_DEFS,
  SCHLEIMI_ITEMS,
  STARTER_IDS,
  STARTER_TINT_ID,
} from "./schleimi-catalog";
import {
  applyLootboxOpen,
  assertWeightBounds,
  rarityFromRoll,
  weightSum,
} from "./lootbox-economy";
import { dailyDealBoxId, dailyDealPrice, getDailyDeal } from "./daily-deal";

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

  it("handles slot crate pricing at 240 HC", () => {
    expect(
      applyLootboxOpen({ balance: 240, alreadyOwned: false, rarity: "selten", price: LOOTBOX_SLOT_PRICE_HC }),
    ).toEqual({
      ok: true,
      duplicate: false,
      granted: true,
      consolationHc: 0,
      nextBalance: 0,
    });
    expect(
      applyLootboxOpen({ balance: 239, alreadyOwned: false, rarity: "selten", price: LOOTBOX_SLOT_PRICE_HC }),
    ).toEqual({ ok: false, error: "Nicht genug Hirncoins" });
  });

  it("handles daily deal pricing (30% off)", () => {
    const dealPrice = dailyDealPrice(LOOTBOX_BASIC_PRICE_HC);
    expect(dealPrice).toBe(70);
    expect(
      applyLootboxOpen({ balance: 70, alreadyOwned: false, rarity: "gewoehnlich", price: dealPrice }),
    ).toEqual({
      ok: true,
      duplicate: false,
      granted: true,
      consolationHc: 0,
      nextBalance: 0,
    });

    const slotDealPrice = dailyDealPrice(LOOTBOX_SLOT_PRICE_HC);
    expect(slotDealPrice).toBe(168);
  });
});

describe("schleimi catalog seed", () => {
  it("has 50 cosmetics and starter ids", () => {
    expect(SCHLEIMI_ITEMS).toHaveLength(50);
    expect(SCHLEIMI_ITEMS.filter((item) => item.rarity === "gewoehnlich")).toHaveLength(27);
    expect(SCHLEIMI_ITEMS.filter((item) => item.rarity === "selten")).toHaveLength(15);
    expect(SCHLEIMI_ITEMS.filter((item) => item.rarity === "legendaer")).toHaveLength(8);
    expect(SCHLEIMI_ITEMS.some((item) => item.id === STARTER_TINT_ID)).toBe(true);
    for (const starter of STARTER_IDS) {
      expect(SCHLEIMI_ITEMS.some((item) => item.id === starter)).toBe(true);
    }
  });

  it("keeps the SQL migration in sync with catalog ids", () => {
    const sql = readFileSync(
      resolve("supabase/migrations/20260829_021_schleimi_v2_svg.sql"),
      "utf8",
    );
    for (const item of SCHLEIMI_ITEMS) {
      expect(sql).toContain(`'${item.id}'`);
    }
    expect(sql).toContain("set_config('ratepanik.grant_economy'");
  });

  it("legacy face map decomposes every face into owned catalog parts", () => {
    const ids = new Set(SCHLEIMI_ITEMS.map((item) => item.id));
    const faces = Object.keys(LEGACY_FACE_MAP);
    expect(faces).toHaveLength(11);
    for (const face of faces) {
      const pair = LEGACY_FACE_MAP[face];
      expect(ids.has(pair.eyes)).toBe(true);
      expect(ids.has(pair.mouth)).toBe(true);
    }
  });
});

describe("lootbox catalog defs", () => {
  it("defines 4 lootbox SKUs", () => {
    expect(ALL_LOOTBOX_IDS).toHaveLength(4);
    expect(LOOTBOX_DEFS).toHaveLength(4);
    expect(LOOTBOX_DEFS[0].id).toBe("lootbox_basic");
    expect(LOOTBOX_DEFS[0].price_hc).toBe(100);
    expect(LOOTBOX_DEFS[0].allowed_slots).toBeNull();
  });

  it("slot crates filter to their slots", () => {
    const form = LOOTBOX_DEFS.find((d) => d.id === "lootbox_form")!;
    expect(form.allowed_slots).toEqual(["shape"]);
    expect(form.price_hc).toBe(240);

    const gesicht = LOOTBOX_DEFS.find((d) => d.id === "lootbox_gesicht")!;
    expect(gesicht.allowed_slots).toEqual(["eyes", "mouth"]);

    const deko = LOOTBOX_DEFS.find((d) => d.id === "lootbox_hintergrund")!;
    expect(deko.allowed_slots).toEqual(["background"]);
  });

  it("Hirnkiste is the only crate that can drop body_tint", () => {
    for (const def of LOOTBOX_DEFS) {
      if (def.id === "lootbox_basic") {
        expect(def.allowed_slots).toBeNull();
      } else {
        expect(def.allowed_slots).not.toBeNull();
        expect(def.allowed_slots).not.toContain("body_tint");
      }
    }
  });

  it("new crate SQL migration seeds match TS defs", () => {
    const sql = readFileSync(
      resolve("supabase/migrations/20260829_021_schleimi_v2_svg.sql"),
      "utf8",
    );
    for (const def of LOOTBOX_DEFS) {
      if (def.id === "lootbox_basic") continue;
      expect(sql).toContain(`'${def.id}'`);
      expect(sql).toContain(`${def.price_hc}`);
    }
    expect(sql).toContain("allowed_slots");
    expect(sql).toContain("daily_deal_box_id");
  });

  it("slot crates use unique art and Hirnkiste keeps the original chest", () => {
    const hirn = LOOTBOX_DEFS.find((d) => d.id === "lootbox_basic")!;
    expect(hirn.art_closed).toBe("/rp/schleimi/lootbox_closed.png");
    const closed = LOOTBOX_DEFS.map((d) => d.art_closed);
    expect(new Set(closed).size).toBe(LOOTBOX_DEFS.length);
  });
});

describe("daily deal", () => {
  it("rotates deterministically across 4 crates", () => {
    const seen = new Set<string>();
    const epoch = new Date("1970-01-01T12:00:00Z");
    for (let i = 0; i < 4; i++) {
      const d = new Date(epoch.getTime() + i * 86_400_000);
      seen.add(dailyDealBoxId(d));
    }
    expect(seen.size).toBe(4);
    for (const id of ALL_LOOTBOX_IDS) {
      expect(seen.has(id)).toBe(true);
    }
  });

  it("returns the same deal for the same UTC day", () => {
    const morning = new Date("2026-08-28T03:00:00Z");
    const evening = new Date("2026-08-28T23:00:00Z");
    expect(dailyDealBoxId(morning)).toBe(dailyDealBoxId(evening));
  });

  it("changes at UTC midnight", () => {
    const beforeMidnight = new Date("2026-08-28T23:59:59Z");
    const afterMidnight = new Date("2026-08-29T00:00:01Z");
    const a = dailyDealBoxId(beforeMidnight);
    const b = dailyDealBoxId(afterMidnight);
    expect(a).not.toBe(b);
  });

  it("computes deal price as ceil(base * 0.7)", () => {
    expect(dailyDealPrice(100)).toBe(70);
    expect(dailyDealPrice(240)).toBe(168);
  });

  it("getDailyDeal returns a complete deal object", () => {
    const deal = getDailyDeal(new Date("2026-08-28T12:00:00Z"));
    expect(ALL_LOOTBOX_IDS).toContain(deal.boxId);
    expect(deal.def).toBeDefined();
    expect(deal.dealPrice).toBeLessThan(deal.originalPrice);
    expect(deal.dealPrice).toBe(Math.ceil(deal.originalPrice * 0.7));
  });

  it("matches Postgres epoch-based algorithm", () => {
    const order = ["lootbox_basic", "lootbox_form", "lootbox_gesicht", "lootbox_hintergrund"];
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const d = new Date(dayOffset * 86_400_000 + 43_200_000);
      const expected = order[dayOffset % 4];
      expect(dailyDealBoxId(d)).toBe(expected);
    }
  });
});
