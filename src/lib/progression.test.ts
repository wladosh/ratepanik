import { describe, expect, it } from "vitest";
import {
  levelFromXp,
  xpForLevel,
  xpProgressInLevel,
  xpToNext,
} from "./progression";

describe("progression", () => {
  it("maps 0 XP to level 1", () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it("needs 100 XP to leave level 1", () => {
    expect(xpToNext(1)).toBe(100);
  });

  it("requires 100 cumulative XP to reach level 2", () => {
    expect(xpForLevel(2)).toBe(100);
  });

  it("keeps xpProgressInLevel current + base equal to total xp", () => {
    for (const xp of [0, 50, 100, 149, 250]) {
      const progress = xpProgressInLevel(xp);
      expect(progress.current + xpForLevel(progress.level)).toBe(xp);
    }
  });
});
