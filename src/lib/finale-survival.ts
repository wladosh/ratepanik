/**
 * Finale Survival — A/B elimination logic.
 *
 * Pure functions for the elimination game mode that runs at the end of a match.
 * Server-authoritative: option positions + which wrong answer is used are
 * determined once per step and shared with all players identically.
 */

/** Timer for each finale step (ms). */
export const FINALE_STEP_TIMER_MS = 15_000;

/** How long the theme roulette animation runs (ms). */
export const FINALE_ROULETTE_DURATION_MS = 3_000;

/** Number of theme options shown in the roulette. */
export const FINALE_ROULETTE_THEME_COUNT = 4;

// ── Types ──────────────────────────────────────────────────────

export interface FinaleChain {
  id: string;
  theme_id: string;
  slug: string;
  name_de: string;
}

export interface FinaleStep {
  id: string;
  chain_id: string;
  step_order: number;
  prompt: string;
  correct: string;
  wrong_a: string;
  wrong_b: string;
}

/** Server-authoritative state stored in rooms.finale_state (jsonb). */
export interface FinaleState {
  phase: "roulette" | "roulette_done" | "step" | "reveal" | "finished";
  rouletteThemeIds: string[];
  /** Index into rouletteThemeIds — the winning theme */
  winnerThemeIndex: number;
  chainId: string;
  steps: FinaleStepState[];
  currentStep: number;
  livingPlayerIds: string[];
  eliminatedPlayerIds: string[];
  /** The final survivor's player ID, or null if no one survived */
  survivorId: string | null;
  rouletteStartedAt: string | null;
}

export interface FinaleStepState {
  stepId: string;
  prompt: string;
  /** Option shown on the LEFT */
  optionLeft: string;
  /** Option shown on the RIGHT */
  optionRight: string;
  /** Which side is correct: "left" | "right" */
  correctSide: "left" | "right";
  /** Player picks: playerId -> "left" | "right" */
  picks: Record<string, "left" | "right">;
  /** Whether this step's reveal has been shown */
  revealed: boolean;
  /** Player IDs eliminated in this step */
  eliminatedThisStep: string[];
}

// ── Step preparation ───────────────────────────────────────────

/**
 * Picks which wrong answer to use and assigns left/right positions.
 * Deterministic given a seed for reproducibility in tests.
 */
export function prepareStepOptions(
  step: FinaleStep,
  random: () => number = Math.random,
): Pick<FinaleStepState, "optionLeft" | "optionRight" | "correctSide"> {
  const wrongChoice = random() < 0.5 ? step.wrong_a : step.wrong_b;
  const correctOnLeft = random() < 0.5;

  return {
    optionLeft: correctOnLeft ? step.correct : wrongChoice,
    optionRight: correctOnLeft ? wrongChoice : step.correct,
    correctSide: correctOnLeft ? "left" : "right",
  };
}

// ── Elimination logic ──────────────────────────────────────────

export interface StepResult {
  /** Players who picked correctly and stay alive */
  survivors: string[];
  /** Players newly eliminated this step (wrong pick or timeout) */
  eliminated: string[];
}

/**
 * Resolves a single elimination step.
 *
 * - Players who picked the wrong side are eliminated.
 * - Players who didn't pick (timeout) are eliminated.
 * - If ALL remaining players would be eliminated (everyone wrong / timed out),
 *   trigger sudden death: nobody is eliminated this round, all stay.
 *   The next step continues until there's a real split.
 */
export function resolveStep(
  livingPlayerIds: string[],
  picks: Record<string, "left" | "right">,
  correctSide: "left" | "right",
): StepResult {
  const correct: string[] = [];
  const wrong: string[] = [];

  for (const playerId of livingPlayerIds) {
    const pick = picks[playerId];
    if (pick === correctSide) {
      correct.push(playerId);
    } else {
      wrong.push(playerId);
    }
  }

  // Sudden death: if everyone got it wrong, no one is eliminated
  if (correct.length === 0) {
    return {
      survivors: [...livingPlayerIds],
      eliminated: [],
    };
  }

  return {
    survivors: correct,
    eliminated: wrong,
  };
}

/**
 * Check if the finale is over.
 * The finale ends when:
 *   1. Exactly one player remains (winner), OR
 *   2. All steps are exhausted (last survivor(s) by that point win), OR
 *   3. Zero players remain (shouldn't happen due to sudden death, but handle gracefully)
 */
export function isFinaleOver(
  livingPlayerIds: string[],
  currentStep: number,
  totalSteps: number,
): boolean {
  if (livingPlayerIds.length <= 1) return true;
  if (currentStep >= totalSteps) return true;
  return false;
}

/**
 * Determine the finale winner.
 * Returns the single survivor's ID, or null if ambiguous / no one alive.
 * When multiple players survive all steps, the one with the highest match
 * score should win (handled by the caller with score data).
 */
export function finaleSurvivor(livingPlayerIds: string[]): string | null {
  if (livingPlayerIds.length === 1) return livingPlayerIds[0];
  return null;
}

// ── Initial state builder ──────────────────────────────────────

export function buildInitialFinaleState(opts: {
  rouletteThemeIds: string[];
  winnerThemeIndex: number;
  chain: FinaleChain;
  steps: FinaleStep[];
  playerIds: string[];
  random?: () => number;
}): FinaleState {
  const rng = opts.random ?? Math.random;

  const stepStates: FinaleStepState[] = opts.steps
    .sort((a, b) => a.step_order - b.step_order)
    .map((step) => {
      const options = prepareStepOptions(step, rng);
      return {
        stepId: step.id,
        prompt: step.prompt,
        ...options,
        picks: {},
        revealed: false,
        eliminatedThisStep: [],
      };
    });

  return {
    phase: "roulette",
    rouletteThemeIds: opts.rouletteThemeIds,
    winnerThemeIndex: opts.winnerThemeIndex,
    chainId: opts.chain.id,
    steps: stepStates,
    currentStep: 0,
    livingPlayerIds: [...opts.playerIds],
    eliminatedPlayerIds: [],
    survivorId: null,
    rouletteStartedAt: null,
  };
}

// ── Sanitized view for clients ─────────────────────────────────

/** What a client sees — no future step answers or other players' picks until reveal. */
export interface FinaleClientView {
  phase: FinaleState["phase"];
  rouletteThemeIds: string[];
  winnerThemeIndex: number;
  currentStep: number;
  totalSteps: number;
  livingPlayerIds: string[];
  eliminatedPlayerIds: string[];
  survivorId: string | null;
  rouletteStartedAt: string | null;
  /** Current step data (only the current step, no correctSide until revealed) */
  currentStepView: {
    prompt: string;
    optionLeft: string;
    optionRight: string;
    /** Only set after reveal */
    correctSide: "left" | "right" | null;
    /** Only the calling player's own pick, or null */
    myPick: "left" | "right" | null;
    /** All picks — only populated after reveal */
    allPicks: Record<string, "left" | "right"> | null;
    revealed: boolean;
    eliminatedThisStep: string[];
    answeredCount: number;
  } | null;
  /** Already-revealed past steps (prompt + correctSide + who was eliminated) */
  pastSteps: Array<{
    prompt: string;
    optionLeft: string;
    optionRight: string;
    correctSide: "left" | "right";
    eliminatedThisStep: string[];
  }>;
}

export function buildClientView(
  state: FinaleState,
  myPlayerId: string,
): FinaleClientView {
  const currentStepData = state.steps[state.currentStep];

  let currentStepView: FinaleClientView["currentStepView"] = null;
  if (currentStepData) {
    currentStepView = {
      prompt: currentStepData.prompt,
      optionLeft: currentStepData.optionLeft,
      optionRight: currentStepData.optionRight,
      correctSide: currentStepData.revealed ? currentStepData.correctSide : null,
      myPick: currentStepData.picks[myPlayerId] ?? null,
      allPicks: currentStepData.revealed ? currentStepData.picks : null,
      revealed: currentStepData.revealed,
      eliminatedThisStep: currentStepData.revealed ? currentStepData.eliminatedThisStep : [],
      answeredCount: Object.keys(currentStepData.picks).length,
    };
  }

  const pastSteps = state.steps
    .slice(0, state.currentStep)
    .filter((s) => s.revealed)
    .map((s) => ({
      prompt: s.prompt,
      optionLeft: s.optionLeft,
      optionRight: s.optionRight,
      correctSide: s.correctSide,
      eliminatedThisStep: s.eliminatedThisStep,
    }));

  return {
    phase: state.phase,
    rouletteThemeIds: state.rouletteThemeIds,
    winnerThemeIndex: state.winnerThemeIndex,
    currentStep: state.currentStep,
    totalSteps: state.steps.length,
    livingPlayerIds: state.livingPlayerIds,
    eliminatedPlayerIds: state.eliminatedPlayerIds,
    survivorId: state.survivorId,
    rouletteStartedAt: state.rouletteStartedAt,
    currentStepView,
    pastSteps,
  };
}
