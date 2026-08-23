import { describe, expect, it } from "vitest";
import { calculateMatchRewards } from "./match-rewards";

describe("calculateMatchRewards", () => {
  it("awards 1st place 0 correct: 90 XP, 40 hirncoins (50+40+0, 20+20)", () => {
    expect(calculateMatchRewards(1, 0)).toEqual({
      placement: 1,
      xpAwarded: 90,
      hirncoinsAwarded: 40,
    });
  });

  it("awards 4th place 0 correct: 50 XP, 20 hirncoins", () => {
    expect(calculateMatchRewards(4, 0)).toEqual({
      placement: 4,
      xpAwarded: 50,
      hirncoinsAwarded: 20,
    });
  });

  it("uses the place-bonus array for 2nd and 3rd", () => {
    expect(calculateMatchRewards(2, 0)).toEqual({
      placement: 2,
      xpAwarded: 70,
      hirncoinsAwarded: 30,
    });
    expect(calculateMatchRewards(3, 0)).toEqual({
      placement: 3,
      xpAwarded: 60,
      hirncoinsAwarded: 25,
    });
  });
});
