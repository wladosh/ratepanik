import { describe, expect, it } from "vitest";
import { isLiveQuestionPhase, shouldStampQuestionClock } from "./question-clock";

describe("isLiveQuestionPhase", () => {
  it("is true only for play and waiting, not theme or reveal", () => {
    expect(isLiveQuestionPhase("number_guess")).toBe(true);
    expect(isLiveQuestionPhase("find_lie_waiting")).toBe(true);
    expect(isLiveQuestionPhase("pick_correct")).toBe(true);
    expect(isLiveQuestionPhase("theme_pick")).toBe(false);
    expect(isLiveQuestionPhase("vs_intro")).toBe(false);
    expect(isLiveQuestionPhase("number_guess_reveal")).toBe(false);
    expect(isLiveQuestionPhase("block_scoreboard")).toBe(false);
  });
});

describe("shouldStampQuestionClock", () => {
  const ready = {
    isHost: true,
    phase: "number_guess",
    startedAt: null as string | null,
    isComplete: false,
    hasPrompt: true,
  };

  it("stamps when the host first reaches a live question with a prompt", () => {
    expect(shouldStampQuestionClock(ready)).toBe(true);
  });

  it("does not stamp during theme pick even if started_at is missing", () => {
    expect(shouldStampQuestionClock({ ...ready, phase: "theme_pick" })).toBe(false);
  });

  it("does not stamp vs-intro or playing_loading", () => {
    expect(shouldStampQuestionClock({ ...ready, phase: "vs_intro" })).toBe(false);
    expect(shouldStampQuestionClock({ ...ready, phase: "playing_loading" })).toBe(false);
  });

  it("does not stamp guests, completed blocks, missing prompts, or an existing clock", () => {
    expect(shouldStampQuestionClock({ ...ready, isHost: false })).toBe(false);
    expect(shouldStampQuestionClock({ ...ready, isComplete: true })).toBe(false);
    expect(shouldStampQuestionClock({ ...ready, hasPrompt: false })).toBe(false);
    expect(
      shouldStampQuestionClock({ ...ready, startedAt: "2026-08-23T17:00:00.000Z" }),
    ).toBe(false);
  });
});
