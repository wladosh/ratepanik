import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENT_BY_ID,
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_IDS,
  achievementCopy,
  isAchievementId,
} from "./achievement-catalog";

describe("achievement catalog", () => {
  it("has a unique sticker for every catalog id", () => {
    expect(ACHIEVEMENT_IDS).toHaveLength(20);
    expect(new Set(ACHIEVEMENT_IDS).size).toBe(20);
    expect(ACHIEVEMENT_CATALOG).toHaveLength(20);
    expect(Object.keys(ACHIEVEMENT_BY_ID)).toHaveLength(20);
  });

  it("keeps German and English title plus description for every achievement", () => {
    for (const item of ACHIEVEMENT_CATALOG) {
      const de = achievementCopy(item, "de");
      const en = achievementCopy(item, "en");
      expect(de.title.length).toBeGreaterThan(1);
      expect(de.description.length).toBeGreaterThan(1);
      expect(en.title.length).toBeGreaterThan(1);
      expect(en.description.length).toBeGreaterThan(1);
      expect(de.description).not.toBe(de.title);
    }
  });

  it("recognizes catalog ids and rejects unknown ones", () => {
    expect(isAchievementId("first_win")).toBe(true);
    expect(isAchievementId("not_an_achievement")).toBe(false);
  });
});
