import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROOM_SETTINGS,
  applyGameLength,
  inferGameLength,
  parseRoomSettings,
  parseTimerSeconds,
  roundsForMode,
} from "./room-settings";

describe("parseTimerSeconds", () => {
  it("keeps the new calm scale", () => {
    expect(parseTimerSeconds(20)).toBe(20);
    expect(parseTimerSeconds(30)).toBe(30);
    expect(parseTimerSeconds(45)).toBe(45);
    expect(parseTimerSeconds(60)).toBe(60);
  });

  it("maps the old frantic values upward", () => {
    expect(parseTimerSeconds(5)).toBe(20);
    expect(parseTimerSeconds(8)).toBe(20);
    expect(parseTimerSeconds(10)).toBe(20);
    expect(parseTimerSeconds(15)).toBe(30);
  });
});

describe("game length presets", () => {
  it("defaults to a ~10 minute medium match with 30s questions", () => {
    expect(DEFAULT_ROOM_SETTINGS.gameLength).toBe("medium");
    expect(DEFAULT_ROOM_SETTINGS.blocks).toBe(5);
    expect(DEFAULT_ROOM_SETTINGS.questionsPerBlock).toBe(3);
    expect(DEFAULT_ROOM_SETTINGS.timerSeconds).toBe(30);
  });

  it("maps short / medium / long onto blocks and questions", () => {
    expect(applyGameLength("short")).toEqual({
      gameLength: "short",
      blocks: 3,
      questionsPerBlock: 2,
    });
    expect(applyGameLength("medium")).toEqual({
      gameLength: "medium",
      blocks: 5,
      questionsPerBlock: 3,
    });
    expect(applyGameLength("long")).toEqual({
      gameLength: "long",
      blocks: 6,
      questionsPerBlock: 4,
    });
  });

  it("infers length from legacy block settings", () => {
    expect(inferGameLength(1, 1)).toBe("short");
    expect(inferGameLength(4, 2)).toBe("medium");
    expect(inferGameLength(6, 3)).toBe("long");
  });

  it("applies inferred presets when gameLength is missing", () => {
    const parsed = parseRoomSettings({
      blocks: 4,
      questionsPerBlock: 2,
      timerSeconds: 15,
    });
    expect(parsed.gameLength).toBe("medium");
    expect(parsed.blocks).toBe(5);
    expect(parsed.questionsPerBlock).toBe(3);
    expect(parsed.timerSeconds).toBe(30);
  });
});

describe("roundsForMode", () => {
  it("uses questionsPerBlock for every mode so matches actually last", () => {
    expect(roundsForMode("number_guess", 3)).toBe(3);
    expect(roundsForMode("pick_correct", 3)).toBe(3);
    expect(roundsForMode("find_lie", 2)).toBe(2);
    expect(roundsForMode("order_it", 4)).toBe(4);
  });
});
