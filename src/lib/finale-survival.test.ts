import { describe, expect, it } from "vitest";
import {
  prepareStepOptions,
  resolveStep,
  isFinaleOver,
  finaleSurvivor,
  buildInitialFinaleState,
  buildClientView,
  type FinaleStep,
  type FinaleChain,
  type FinaleState,
} from "./finale-survival";

// ── Helpers ────────────────────────────────────────────────────

function makeStep(overrides: Partial<FinaleStep> = {}): FinaleStep {
  return {
    id: "step-1",
    chain_id: "chain-1",
    step_order: 0,
    prompt: "Welches Spiel hat Mario?",
    correct: "Super Mario Bros.",
    wrong_a: "Sonic",
    wrong_b: "Mega Man",
    ...overrides,
  };
}

function makeChain(): FinaleChain {
  return {
    id: "chain-1",
    theme_id: "theme-1",
    slug: "gaming-legenden",
    name_de: "Gaming-Legenden",
  };
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── prepareStepOptions ─────────────────────────────────────────

describe("prepareStepOptions", () => {
  it("always includes the correct answer as one of the two options", () => {
    const step = makeStep();
    for (let i = 0; i < 50; i++) {
      const opts = prepareStepOptions(step);
      const options = [opts.optionLeft, opts.optionRight];
      expect(options).toContain(step.correct);
    }
  });

  it("uses exactly one of the two wrong answers", () => {
    const step = makeStep();
    for (let i = 0; i < 50; i++) {
      const opts = prepareStepOptions(step);
      const options = [opts.optionLeft, opts.optionRight];
      const wrongUsed = options.filter(
        (o) => o === step.wrong_a || o === step.wrong_b,
      );
      expect(wrongUsed).toHaveLength(1);
    }
  });

  it("correctSide matches the position of the correct answer", () => {
    const step = makeStep();
    for (let i = 0; i < 50; i++) {
      const opts = prepareStepOptions(step);
      if (opts.correctSide === "left") {
        expect(opts.optionLeft).toBe(step.correct);
      } else {
        expect(opts.optionRight).toBe(step.correct);
      }
    }
  });

  it("produces deterministic output with a fixed random seed", () => {
    const step = makeStep();
    const a = prepareStepOptions(step, seededRandom(42));
    const b = prepareStepOptions(step, seededRandom(42));
    expect(a).toEqual(b);
  });

  it("same two options + same positions for all players (shared call)", () => {
    const step = makeStep();
    const rng = seededRandom(99);
    const shared = prepareStepOptions(step, rng);
    // All players see the same object — no per-player variation
    expect(shared.optionLeft).toBeDefined();
    expect(shared.optionRight).toBeDefined();
    expect(shared.optionLeft).not.toBe(shared.optionRight);
  });
});

// ── resolveStep ────────────────────────────────────────────────

describe("resolveStep", () => {
  const players = ["alice", "bob", "charlie"];

  it("eliminates players who picked the wrong side", () => {
    const result = resolveStep(
      players,
      { alice: "left", bob: "right", charlie: "left" },
      "left",
    );
    expect(result.survivors).toEqual(["alice", "charlie"]);
    expect(result.eliminated).toEqual(["bob"]);
  });

  it("eliminates players who did not pick (timeout)", () => {
    const result = resolveStep(
      players,
      { alice: "left" },
      "left",
    );
    expect(result.survivors).toEqual(["alice"]);
    expect(result.eliminated).toEqual(["bob", "charlie"]);
  });

  it("sudden death: if ALL players pick wrong, nobody is eliminated", () => {
    const result = resolveStep(
      players,
      { alice: "right", bob: "right", charlie: "right" },
      "left",
    );
    expect(result.survivors).toEqual(players);
    expect(result.eliminated).toEqual([]);
  });

  it("sudden death: if nobody picks, nobody is eliminated", () => {
    const result = resolveStep(players, {}, "left");
    expect(result.survivors).toEqual(players);
    expect(result.eliminated).toEqual([]);
  });

  it("eliminates everyone who timed out when at least one answered correctly", () => {
    const result = resolveStep(
      players,
      { alice: "left" },
      "left",
    );
    expect(result.survivors).toEqual(["alice"]);
    expect(result.eliminated.sort()).toEqual(["bob", "charlie"]);
  });

  it("keeps all players who picked correctly", () => {
    const result = resolveStep(
      players,
      { alice: "left", bob: "left", charlie: "left" },
      "left",
    );
    expect(result.survivors).toEqual(players);
    expect(result.eliminated).toEqual([]);
  });

  it("handles single-player scenario", () => {
    const result = resolveStep(["alice"], { alice: "right" }, "left");
    // Sudden death: single player wrong → stays
    expect(result.survivors).toEqual(["alice"]);
    expect(result.eliminated).toEqual([]);
  });

  it("two players: one correct, one wrong → one eliminated", () => {
    const result = resolveStep(
      ["alice", "bob"],
      { alice: "left", bob: "right" },
      "left",
    );
    expect(result.survivors).toEqual(["alice"]);
    expect(result.eliminated).toEqual(["bob"]);
  });
});

// ── isFinaleOver ───────────────────────────────────────────────

describe("isFinaleOver", () => {
  it("returns true when exactly one player remains", () => {
    expect(isFinaleOver(["alice"], 2, 7)).toBe(true);
  });

  it("returns true when zero players remain", () => {
    expect(isFinaleOver([], 2, 7)).toBe(true);
  });

  it("returns true when all steps exhausted", () => {
    expect(isFinaleOver(["alice", "bob"], 7, 7)).toBe(true);
  });

  it("returns false when multiple players and steps remain", () => {
    expect(isFinaleOver(["alice", "bob"], 2, 7)).toBe(false);
  });
});

// ── finaleSurvivor ─────────────────────────────────────────────

describe("finaleSurvivor", () => {
  it("returns the single survivor", () => {
    expect(finaleSurvivor(["alice"])).toBe("alice");
  });

  it("returns null for multiple survivors", () => {
    expect(finaleSurvivor(["alice", "bob"])).toBeNull();
  });

  it("returns null for no survivors", () => {
    expect(finaleSurvivor([])).toBeNull();
  });
});

// ── buildInitialFinaleState ────────────────────────────────────

describe("buildInitialFinaleState", () => {
  it("creates a valid initial state with sorted steps", () => {
    const chain = makeChain();
    const steps = [
      makeStep({ id: "s2", step_order: 1, prompt: "Q2" }),
      makeStep({ id: "s1", step_order: 0, prompt: "Q1" }),
    ];

    const state = buildInitialFinaleState({
      rouletteThemeIds: ["t1", "t2", "t3", "t4"],
      winnerThemeIndex: 2,
      chain,
      steps,
      playerIds: ["alice", "bob", "charlie"],
      random: seededRandom(123),
    });

    expect(state.phase).toBe("roulette");
    expect(state.steps).toHaveLength(2);
    expect(state.steps[0].prompt).toBe("Q1");
    expect(state.steps[1].prompt).toBe("Q2");
    expect(state.livingPlayerIds).toEqual(["alice", "bob", "charlie"]);
    expect(state.eliminatedPlayerIds).toEqual([]);
    expect(state.survivorId).toBeNull();
    expect(state.currentStep).toBe(0);
  });

  it("pre-computes option positions for each step", () => {
    const chain = makeChain();
    const steps = [makeStep()];
    const state = buildInitialFinaleState({
      rouletteThemeIds: ["t1"],
      winnerThemeIndex: 0,
      chain,
      steps,
      playerIds: ["p1"],
    });

    const s = state.steps[0];
    expect(s.optionLeft).toBeDefined();
    expect(s.optionRight).toBeDefined();
    expect(["left", "right"]).toContain(s.correctSide);
  });
});

// ── buildClientView ────────────────────────────────────────────

describe("buildClientView", () => {
  function makeState(): FinaleState {
    return {
      phase: "step",
      rouletteThemeIds: ["t1", "t2", "t3", "t4"],
      winnerThemeIndex: 1,
      chainId: "chain-1",
      steps: [
        {
          stepId: "s1",
          prompt: "Q1",
          optionLeft: "A",
          optionRight: "B",
          correctSide: "left",
          picks: { alice: "left", bob: "right" },
          revealed: true,
          eliminatedThisStep: ["bob"],
        },
        {
          stepId: "s2",
          prompt: "Q2",
          optionLeft: "C",
          optionRight: "D",
          correctSide: "right",
          picks: { alice: "right" },
          revealed: false,
          eliminatedThisStep: [],
        },
      ],
      currentStep: 1,
      livingPlayerIds: ["alice"],
      eliminatedPlayerIds: ["bob"],
      survivorId: null,
      rouletteStartedAt: null,
    };
  }

  it("hides correctSide for the current unrevealed step", () => {
    const view = buildClientView(makeState(), "alice");
    expect(view.currentStepView).not.toBeNull();
    expect(view.currentStepView!.correctSide).toBeNull();
  });

  it("shows own pick but not others before reveal", () => {
    const view = buildClientView(makeState(), "alice");
    expect(view.currentStepView!.myPick).toBe("right");
    expect(view.currentStepView!.allPicks).toBeNull();
  });

  it("includes revealed past steps with correctSide", () => {
    const view = buildClientView(makeState(), "alice");
    expect(view.pastSteps).toHaveLength(1);
    expect(view.pastSteps[0].correctSide).toBe("left");
  });

  it("returns answeredCount from picks", () => {
    const view = buildClientView(makeState(), "alice");
    expect(view.currentStepView!.answeredCount).toBe(1);
  });

  it("shows allPicks and correctSide when step is revealed", () => {
    const state = makeState();
    state.steps[1].revealed = true;
    const view = buildClientView(state, "alice");
    expect(view.currentStepView!.correctSide).toBe("right");
    expect(view.currentStepView!.allPicks).toEqual({ alice: "right" });
  });
});
