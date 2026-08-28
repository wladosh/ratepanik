import { describe, expect, it } from "vitest";
import {
  GUEST_SHAPE_IDS,
  GUEST_TINT_IDS,
  guestLayers,
  hashToIndex,
  isVsIntroActive,
  layersFromLoadoutRows,
  readVsIntroUntil,
  stampVsIntroUntil,
  vsIntroDurationMs,
} from "./schleimi-layers";

describe("guestLayers", () => {
  it("picks a stable gewöhnlich tint and shape from the seed", () => {
    const a = guestLayers("player-aaa");
    const b = guestLayers("player-aaa");
    const c = guestLayers("player-bbb");
    expect(a.body_tint?.id).toBe(b.body_tint?.id);
    expect(a.shape?.id).toBe(b.shape?.id);
    expect(GUEST_TINT_IDS).toContain(a.body_tint?.id);
    expect(GUEST_SHAPE_IDS).toContain(a.shape?.id);
    expect(a.eyes?.id).toBe("eyes_dots");
    expect(a.mouth?.id).toBe("mouth_grin");
    expect(a.background).toBeNull();
    expect(c.body_tint?.id).not.toBeUndefined();
  });

  it("hashToIndex stays in range", () => {
    expect(hashToIndex("x", 6)).toBeGreaterThanOrEqual(0);
    expect(hashToIndex("x", 6)).toBeLessThan(6);
  });
});

describe("layersFromLoadoutRows", () => {
  it("fills missing required slots with starters", () => {
    const layers = layersFromLoadoutRows([
      { slot: "background", item_id: "bg_stars" },
    ]);
    expect(layers.shape?.id).toBe("shape_classic");
    expect(layers.body_tint?.id).toBe("tint_peach");
    expect(layers.eyes?.id).toBe("eyes_dots");
    expect(layers.mouth?.id).toBe("mouth_grin");
    expect(layers.background?.id).toBe("bg_stars");
  });

  it("ignores legacy slots from old loadout rows", () => {
    const layers = layersFromLoadoutRows([
      { slot: "hat", item_id: "hat_party_cone" },
      { slot: "face", item_id: "face_grin" },
      { slot: "body_tint", item_id: "tint_mint" },
    ]);
    expect(layers.body_tint?.id).toBe("tint_mint");
    expect(layers.shape?.id).toBe("shape_classic");
    expect(layers.eyes?.id).toBe("eyes_dots");
    expect(layers.mouth?.id).toBe("mouth_grin");
  });
});

describe("vsIntroDurationMs", () => {
  it("returns 4200 for 1 player", () => {
    expect(vsIntroDurationMs(1)).toBe(4200);
  });

  it("returns 4750 for 2 players", () => {
    expect(vsIntroDurationMs(2)).toBe(4750);
  });

  it("returns 5300 for 3 players", () => {
    expect(vsIntroDurationMs(3)).toBe(5300);
  });

  it("returns 5850 for 4 players", () => {
    expect(vsIntroDurationMs(4)).toBe(5850);
  });

  it("clamps at 6400 for large lobbies", () => {
    expect(vsIntroDurationMs(10)).toBe(6400);
    expect(vsIntroDurationMs(100)).toBe(6400);
  });

  it("treats zero/negative as 1 player", () => {
    expect(vsIntroDurationMs(0)).toBe(4200);
    expect(vsIntroDurationMs(-3)).toBe(4200);
  });
});

describe("vs intro clock", () => {
  it("stamps vsIntroUntil using total duration, not per-player", () => {
    const stamped = stampVsIntroUntil({ v: 1, themeMix: "random" }, 2, 1_000);
    expect(stamped.v).toBe(1);
    expect(stamped.themeMix).toBe("random");
    expect(stamped.vsIntroUntil).toBe(new Date(1_000 + vsIntroDurationMs(2)).toISOString());
  });

  it("reads vsIntroUntil from raw settings", () => {
    expect(readVsIntroUntil({ vsIntroUntil: "2026-08-23T17:00:00.000Z" })).toBe(
      Date.parse("2026-08-23T17:00:00.000Z"),
    );
    expect(readVsIntroUntil({ v: 1 })).toBeNull();
  });

  it("isVsIntroActive respects deadline", () => {
    const until = 10_000;
    expect(isVsIntroActive(9999, until)).toBe(true);
    expect(isVsIntroActive(10_000, until)).toBe(false);
  });
});
