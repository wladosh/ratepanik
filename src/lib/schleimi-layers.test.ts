import { describe, expect, it } from "vitest";
import {
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
  it("picks a stable gewöhnlich tint from the seed", () => {
    const a = guestLayers("player-aaa");
    const b = guestLayers("player-aaa");
    const c = guestLayers("player-bbb");
    expect(a.body_tint?.id).toBe(b.body_tint?.id);
    expect(GUEST_TINT_IDS).toContain(a.body_tint?.id);
    expect(a.face?.id).toBe("face_grin");
    expect(a.hat).toBeNull();
    expect(c.body_tint?.id).not.toBeUndefined();
  });

  it("hashToIndex stays in range", () => {
    expect(hashToIndex("x", 6)).toBeGreaterThanOrEqual(0);
    expect(hashToIndex("x", 6)).toBeLessThan(6);
  });
});

describe("layersFromLoadoutRows", () => {
  it("fills missing tint and face with starters", () => {
    const layers = layersFromLoadoutRows([
      { slot: "hat", item_id: "hat_party_cone" },
    ]);
    expect(layers.body_tint?.id).toBe("tint_peach");
    expect(layers.face?.id).toBe("face_grin");
    expect(layers.hat?.id).toBe("hat_party_cone");
  });
});

describe("vsIntroDurationMs", () => {
  it("returns 1400 for 1 player", () => {
    expect(vsIntroDurationMs(1)).toBe(1400);
  });

  it("returns 1620 for 2 players", () => {
    expect(vsIntroDurationMs(2)).toBe(1620);
  });

  it("returns 1840 for 3 players", () => {
    expect(vsIntroDurationMs(3)).toBe(1840);
  });

  it("returns 2060 for 4 players", () => {
    expect(vsIntroDurationMs(4)).toBe(2060);
  });

  it("clamps at 2500 for large lobbies", () => {
    expect(vsIntroDurationMs(10)).toBe(2500);
    expect(vsIntroDurationMs(100)).toBe(2500);
  });

  it("treats zero/negative as 1 player", () => {
    expect(vsIntroDurationMs(0)).toBe(1400);
    expect(vsIntroDurationMs(-3)).toBe(1400);
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
