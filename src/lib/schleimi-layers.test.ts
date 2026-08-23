import { describe, expect, it } from "vitest";
import {
  GUEST_TINT_IDS,
  guestLayers,
  hashToIndex,
  isVsIntroActive,
  layersFromLoadoutRows,
  readVsIntroUntil,
  stampVsIntroUntil,
  vsSlideIndex,
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

describe("vs intro clock", () => {
  it("stamps vsIntroUntil on raw settings without dropping keys", () => {
    const stamped = stampVsIntroUntil({ v: 1, themeMix: "random" }, 2, 1_000, 1_000);
    expect(stamped.v).toBe(1);
    expect(stamped.themeMix).toBe("random");
    expect(stamped.vsIntroUntil).toBe(new Date(3_000).toISOString());
  });

  it("reads vsIntroUntil from raw settings", () => {
    expect(readVsIntroUntil({ vsIntroUntil: "2026-08-23T17:00:00.000Z" })).toBe(
      Date.parse("2026-08-23T17:00:00.000Z"),
    );
    expect(readVsIntroUntil({ v: 1 })).toBeNull();
  });

  it("slides through players from a shared deadline", () => {
    const until = 10_000;
    const per = 1000;
    expect(vsSlideIndex(4000, until, 3, per)).toBe(0);
    expect(vsSlideIndex(8000, until, 3, per)).toBe(1);
    expect(vsSlideIndex(9500, until, 3, per)).toBe(2);
    expect(isVsIntroActive(9999, until)).toBe(true);
    expect(isVsIntroActive(10_000, until)).toBe(false);
  });
});
