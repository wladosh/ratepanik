import { describe, expect, it } from "vitest";
import {
  calculateFindLiePoints,
  calculateNumberGuessPoints,
  calculateOrderItPoints,
  calculatePickCorrectPoints,
  generateBlockModes,
  modesForFilter,
  NUMBER_GUESS_FIRST_POINTS,
  numberGuessScoringPool,
  scoreNumberGuessAnswers,
  timerSecondsForPlayMode,
} from "./game-store";

const ALLOWED_MODES = new Set([
  "number_guess",
  "pick_correct",
  "find_lie",
  "order_it",
]);

describe("calculateNumberGuessPoints", () => {
  it("awards 0 points for last place (rank === totalPlayers)", () => {
    expect(calculateNumberGuessPoints(4, 4)).toBe(0);
    expect(calculateNumberGuessPoints(3, 3)).toBe(0);
    expect(calculateNumberGuessPoints(2, 2)).toBe(0);
  });

  it("halves points for each worse rank: 400, 200, 100, 0", () => {
    expect(calculateNumberGuessPoints(1, 4)).toBe(NUMBER_GUESS_FIRST_POINTS);
    expect(calculateNumberGuessPoints(2, 4)).toBe(200);
    expect(calculateNumberGuessPoints(3, 4)).toBe(100);
    expect(calculateNumberGuessPoints(1, 2)).toBe(NUMBER_GUESS_FIRST_POINTS);
  });

  it("uses max(players, answers) so timeout scoring matches a full round", () => {
    expect(numberGuessScoringPool(4, 2)).toBe(4);
    expect(calculateNumberGuessPoints(1, numberGuessScoringPool(4, 2))).toBe(
      NUMBER_GUESS_FIRST_POINTS,
    );
  });
});

describe("scoreNumberGuessAnswers", () => {
  it("gives both players first-place points when they guess the same", () => {
    const scored = scoreNumberGuessAnswers(
      [
        { id: "a", numericAnswer: 10 },
        { id: "b", numericAnswer: 10 },
      ],
      10,
      2,
    );
    expect(scored.map((s) => s.points).sort((x, y) => y - x)).toEqual([400, 400]);
  });

  it("gives only the closer guess points in a 2-player round", () => {
    const scored = scoreNumberGuessAnswers(
      [
        { id: "a", numericAnswer: 9 },
        { id: "b", numericAnswer: 1 },
      ],
      10,
      2,
    );
    const byId = Object.fromEntries(scored.map((s) => [s.id, s.points]));
    expect(byId.a).toBe(400);
    expect(byId.b).toBe(0);
  });
});

describe("calculatePickCorrectPoints", () => {
  it("awards 250 per correct card", () => {
    expect(calculatePickCorrectPoints(0, 4)).toBe(0);
    expect(calculatePickCorrectPoints(1, 4)).toBe(250);
    expect(calculatePickCorrectPoints(2, 4)).toBe(500);
    expect(calculatePickCorrectPoints(4, 4)).toBe(1000);
  });
});

describe("calculateFindLiePoints", () => {
  it("awards 400 for the lie and 0 otherwise", () => {
    expect(calculateFindLiePoints(2, 2)).toBe(400);
    expect(calculateFindLiePoints(1, 2)).toBe(0);
  });
});

describe("calculateOrderItPoints", () => {
  it("awards 100 per correct slot", () => {
    expect(calculateOrderItPoints([0, 1, 2, 3], [0, 1, 2, 3])).toBe(400);
    expect(calculateOrderItPoints([0, 2, 1, 3], [0, 1, 2, 3])).toBe(200);
  });
});

describe("modesForFilter", () => {
  it("returns every playable mode when the lobby did not pin one", () => {
    expect(modesForFilter("all")).toEqual([
      "number_guess",
      "pick_correct",
      "find_lie",
      "order_it",
    ]);
  });

  it("returns only the pinned lobby mode", () => {
    expect(modesForFilter("number_guess")).toEqual(["number_guess"]);
    expect(modesForFilter("find_lie")).toEqual(["find_lie"]);
  });
});

describe("timerSecondsForPlayMode", () => {
  it("keeps the lobby timer for non-order modes", () => {
    expect(timerSecondsForPlayMode("number_guess", 20)).toBe(20);
    expect(timerSecondsForPlayMode("pick_correct", 45)).toBe(45);
  });

  it("floors order_it at 30 seconds", () => {
    expect(timerSecondsForPlayMode("order_it", 20)).toBe(30);
    expect(timerSecondsForPlayMode("order_it", 45)).toBe(45);
  });
});

describe("generateBlockModes", () => {
  it("returns 4 allowed mode strings", () => {
    const modes = generateBlockModes(4);
    expect(modes).toHaveLength(4);
    expect(modes.every((mode) => ALLOWED_MODES.has(mode))).toBe(true);
  });

  it("repeats a single mode when filtered", () => {
    const modes = generateBlockModes(3, "number_guess");
    expect(modes).toEqual(["number_guess", "number_guess", "number_guess"]);
  });

  it("can fill a long match beyond the four unique modes", () => {
    const modes = generateBlockModes(6);
    expect(modes).toHaveLength(6);
    expect(modes.every((mode) => ALLOWED_MODES.has(mode))).toBe(true);
  });
});
