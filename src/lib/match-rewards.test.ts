import { describe, expect, it } from "vitest";
import { GAME_LENGTH_PRESETS } from "./room-settings";
import {
  calculateHirncoinsAwarded,
  calculateMatchRewards,
  HC_MEDIUM_QUESTION_SLOTS,
  hirncoinsPerformanceFactor,
  matchPayoutMinutes,
  questionSlotsFromSettings,
} from "./match-rewards";

describe("questionSlotsFromSettings", () => {
  it("uses the medium preset of 5×3", () => {
    expect(questionSlotsFromSettings({ blocks: 5, questionsPerBlock: 3 })).toBe(15);
  });

  it("clamps empty and oversized schedules", () => {
    expect(questionSlotsFromSettings({ blocks: 0, questionsPerBlock: 0 })).toBe(1);
    expect(questionSlotsFromSettings({ blocks: 6, questionsPerBlock: 4 })).toBe(24);
  });

  it("matches lobby length presets", () => {
    for (const preset of Object.values(GAME_LENGTH_PRESETS)) {
      expect(
        questionSlotsFromSettings({
          blocks: preset.blocks,
          questionsPerBlock: preset.questionsPerBlock,
        }),
      ).toBe(preset.blocks * preset.questionsPerBlock);
      expect(
        matchPayoutMinutes(preset.blocks * preset.questionsPerBlock),
      ).toBe(preset.minutes);
    }
  });
});

describe("matchPayoutMinutes", () => {
  it("maps short / medium / long question counts", () => {
    expect(matchPayoutMinutes(6)).toBe(5);
    expect(matchPayoutMinutes(15)).toBe(10);
    expect(matchPayoutMinutes(24)).toBe(15);
  });
});

describe("hirncoinsPerformanceFactor", () => {
  it("is 0 on a blank score and 1 at 250 per question", () => {
    expect(hirncoinsPerformanceFactor(0, 15)).toBe(0);
    expect(hirncoinsPerformanceFactor(3750, 15)).toBe(1);
    expect(hirncoinsPerformanceFactor(1875, 15)).toBe(0.5);
  });
});

describe("calculateHirncoinsAwarded", () => {
  const medium = HC_MEDIUM_QUESTION_SLOTS;

  it("pays 40–80 on a 10-minute match", () => {
    expect(
      calculateHirncoinsAwarded({ placement: 4, score: 0, questionSlots: medium }),
    ).toBe(40);
    expect(
      calculateHirncoinsAwarded({
        placement: 1,
        score: 3750,
        questionSlots: medium,
      }),
    ).toBe(80);
  });

  it("pays more for a better place with the same score", () => {
    const mid = { score: 1875, questionSlots: medium };
    const first = calculateHirncoinsAwarded({ placement: 1, ...mid });
    const second = calculateHirncoinsAwarded({ placement: 2, ...mid });
    const fourth = calculateHirncoinsAwarded({ placement: 4, ...mid });
    expect(first).toBeGreaterThan(second);
    expect(second).toBeGreaterThan(fourth);
    expect(second).toBe(61);
  });

  it("pays more for a stronger score in the same place", () => {
    const weak = calculateHirncoinsAwarded({
      placement: 2,
      score: 500,
      questionSlots: medium,
    });
    const strong = calculateHirncoinsAwarded({
      placement: 2,
      score: 3000,
      questionSlots: medium,
    });
    expect(strong).toBeGreaterThan(weak);
  });

  it("halves a 5-minute match and boosts a 15-minute one", () => {
    const mediumPayout = calculateHirncoinsAwarded({
      placement: 2,
      score: 1875,
      questionSlots: medium,
    });
    expect(
      calculateHirncoinsAwarded({ placement: 2, score: 750, questionSlots: 6 }),
    ).toBe(Math.round(mediumPayout * 0.5));
    expect(
      calculateHirncoinsAwarded({ placement: 2, score: 3000, questionSlots: 24 }),
    ).toBe(Math.round(mediumPayout * 1.5));
  });
});

describe("calculateMatchRewards", () => {
  it("keeps 1st place 0 score XP and pays the 10-minute floor in coins", () => {
    expect(
      calculateMatchRewards({
        placement: 1,
        score: 0,
        questionSlots: HC_MEDIUM_QUESTION_SLOTS,
      }),
    ).toEqual({
      placement: 1,
      xpAwarded: 90,
      hirncoinsAwarded: 56,
    });
  });

  it("keeps 4th place 0 score XP and pays participation coins", () => {
    expect(
      calculateMatchRewards({
        placement: 4,
        score: 0,
        questionSlots: HC_MEDIUM_QUESTION_SLOTS,
      }),
    ).toEqual({
      placement: 4,
      xpAwarded: 50,
      hirncoinsAwarded: 40,
    });
  });

  it("still scales XP from the score proxy", () => {
    expect(
      calculateMatchRewards({
        placement: 2,
        score: 100,
        questionSlots: HC_MEDIUM_QUESTION_SLOTS,
      }).xpAwarded,
    ).toBe(90);
  });
});
