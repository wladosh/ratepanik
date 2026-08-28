import { describe, expect, it } from "vitest";
import {
  allPlayersExhaustedPicks,
  isPickCorrectRoundComplete,
  pickCorrectHuntComplete,
  pickCountForPlayer,
  playerHasPicksRemaining,
} from "./pick-correct";

function turn(player_id: string, is_correct: boolean) {
  return { player_id, is_correct };
}

describe("pickCountForPlayer / playerHasPicksRemaining", () => {
  it("counts a miss toward the 2-tap budget so a third card is blocked", () => {
    const turns = [turn("a", false), turn("a", true)];
    expect(pickCountForPlayer(turns, "a")).toBe(2);
    expect(playerHasPicksRemaining(turns, "a")).toBe(false);
    expect(playerHasPicksRemaining([turn("a", false)], "a")).toBe(true);
  });
});

describe("isPickCorrectRoundComplete", () => {
  it("stays live after 1+1 in a 2-player lobby", () => {
    expect(
      isPickCorrectRoundComplete({
        turns: [turn("a", true), turn("b", false)],
        playerIds: ["a", "b"],
      }),
    ).toBe(false);
  });

  it("ends after 4 taps with fewer than 4 correct in a 2-player lobby", () => {
    expect(
      isPickCorrectRoundComplete({
        turns: [
          turn("a", true),
          turn("b", false),
          turn("a", false),
          turn("b", true),
        ],
        playerIds: ["a", "b"],
      }),
    ).toBe(true);
    expect(
      pickCorrectHuntComplete([
        turn("a", true),
        turn("b", false),
        turn("a", false),
        turn("b", true),
      ]),
    ).toBe(false);
  });

  it("ends a 3-player hunt when 4 correct are found before all taps are used", () => {
    const turns = [
      turn("a", true),
      turn("b", true),
      turn("c", true),
      turn("a", true),
    ];
    expect(
      isPickCorrectRoundComplete({
        turns,
        playerIds: ["a", "b", "c"],
      }),
    ).toBe(true);
    expect(allPlayersExhaustedPicks(turns, ["a", "b", "c"])).toBe(false);
  });

  it("ends a 3-player round when all 6 taps are used with only 2 correct", () => {
    expect(
      isPickCorrectRoundComplete({
        turns: [
          turn("a", false),
          turn("b", false),
          turn("c", false),
          turn("a", true),
          turn("b", true),
          turn("c", false),
        ],
        playerIds: ["a", "b", "c"],
      }),
    ).toBe(true);
  });

  it("ends a 4-player hunt on 4 correct even if some players have 0 taps", () => {
    expect(
      isPickCorrectRoundComplete({
        turns: [
          turn("a", true),
          turn("a", true),
          turn("b", true),
          turn("b", true),
        ],
        playerIds: ["a", "b", "c", "d"],
      }),
    ).toBe(true);
  });

  it("does not complete when one seated player still has taps (AFK)", () => {
    expect(
      isPickCorrectRoundComplete({
        turns: [
          turn("a", true),
          turn("a", true),
          turn("b", false),
          turn("b", true),
        ],
        playerIds: ["a", "b", "c"],
      }),
    ).toBe(false);
  });

  it("does not treat an empty lobby as exhausted", () => {
    expect(allPlayersExhaustedPicks([], [])).toBe(false);
    expect(
      isPickCorrectRoundComplete({
        turns: [],
        playerIds: [],
      }),
    ).toBe(false);
  });
});
