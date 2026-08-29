import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROOM_SETTINGS,
  applyGameLength,
  inferGameLength,
  parseRoomSettings,
  parseTimerSeconds,
  roundsForMode,
  settingsSummaryChips,
  type RoomSettings,
} from "./room-settings";
import { messages } from "./i18n";

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

describe("settingsSummaryChips", () => {
  const t = messages.de;

  function chipsFor(overrides: Partial<RoomSettings>) {
    return settingsSummaryChips(
      { ...DEFAULT_ROOM_SETTINGS, ...overrides },
      {},
      t,
    );
  }

  it("shows chipAllModes when modeFilter is 'all'", () => {
    const chips = chipsFor({ modeFilter: "all" });
    expect(chips).toContain(t.lobby.chipAllModes);
  });

  it("shows chipModeGuess when modeFilter is 'number_guess'", () => {
    const chips = chipsFor({ modeFilter: "number_guess" });
    expect(chips).toContain(t.lobby.chipModeGuess);
    expect(chips).not.toContain(t.lobby.chipAllModes);
  });

  it("shows chipModePick when modeFilter is 'pick_correct'", () => {
    const chips = chipsFor({ modeFilter: "pick_correct" });
    expect(chips).toContain(t.lobby.chipModePick);
    expect(chips).not.toContain(t.lobby.chipAllModes);
  });

  it("shows chipModeLie when modeFilter is 'find_lie'", () => {
    const chips = chipsFor({ modeFilter: "find_lie" });
    expect(chips).toContain(t.lobby.chipModeLie);
    expect(chips).not.toContain(t.lobby.chipAllModes);
  });

  it("shows chipModeOrder when modeFilter is 'order_it'", () => {
    const chips = chipsFor({ modeFilter: "order_it" });
    expect(chips).toContain(t.lobby.chipModeOrder);
    expect(chips).not.toContain(t.lobby.chipAllModes);
  });

  it("reflects non-default difficulty", () => {
    const chips = chipsFor({ difficulty: "schwer" });
    expect(chips).toContain(t.lobby.diffHard);
    expect(chips).not.toContain(t.lobby.diffMix);
  });

  it("reflects non-default theme mix", () => {
    const chips = chipsFor({ themeMix: "manual" });
    expect(chips).toContain(t.lobby.chipThemesManual);
    expect(chips).not.toContain(t.lobby.chipThemesRandom);
  });
});
