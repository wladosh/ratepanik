import { describe, expect, it } from "vitest";
import {
  calculateFindLiePoints,
  calculateNumberGuessPoints,
  calculateOrderItPoints,
  calculatePickCorrectPoints,
  generateBlockModes,
  numberGuessScoringPool,
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
  });

  it("awards 300 points for rank 1 of 4", () => {
    expect(calculateNumberGuessPoints(1, 4)).toBe(300);
  });

  it("uses max(players, answers) so timeout scoring matches a full round", () => {
    expect(numberGuessScoringPool(4, 2)).toBe(4);
    expect(calculateNumberGuessPoints(1, numberGuessScoringPool(4, 2))).toBe(300);
  });
});

describe("calculatePickCorrectPoints", () => {
  it("awards 1000 for 4/4 and 500 for 2/4", () => {
    expect(calculatePickCorrectPoints(4, 4)).toBe(1000);
    expect(calculatePickCorrectPoints(2, 4)).toBe(500);
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
});
