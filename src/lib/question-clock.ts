/** Phases where the shared question clock should run. */
export const LIVE_QUESTION_PHASES = [
  "number_guess",
  "number_guess_waiting",
  "pick_correct",
  "find_lie",
  "find_lie_waiting",
  "order_it",
  "order_it_waiting",
] as const;

export type LiveQuestionPhase = (typeof LIVE_QUESTION_PHASES)[number];

export function isLiveQuestionPhase(phase: string): phase is LiveQuestionPhase {
  return (LIVE_QUESTION_PHASES as readonly string[]).includes(phase);
}

/**
 * Host stamps match_blocks.started_at only when the play UI is live.
 * Theme pick / vs-intro / prompt load must not start the clock.
 */
export function shouldStampQuestionClock(opts: {
  isHost: boolean;
  phase: string;
  startedAt: string | null | undefined;
  isComplete: boolean | undefined;
  hasPrompt: boolean;
}): boolean {
  if (!opts.isHost || opts.isComplete || !opts.hasPrompt) return false;
  if (!isLiveQuestionPhase(opts.phase)) return false;
  return opts.startedAt == null || opts.startedAt === "";
}

/** Don’t end a round the instant 2 players answer — keep matches near the labeled length. */
export const QUESTION_MIN_LIVE_MS = 20_000;

export function roundReadyToReveal(opts: {
  timedOut: boolean;
  answeredCount: number;
  playerCount: number;
  startedAt: string | null | undefined;
  nowMs: number;
  timerMs: number;
  minLiveMs?: number;
}): boolean {
  if (opts.timedOut) return true;
  if (opts.playerCount <= 0 || opts.answeredCount < opts.playerCount) return false;
  const started = opts.startedAt ? Date.parse(opts.startedAt) : Number.NaN;
  if (!Number.isFinite(started)) return false;
  const minLive = Math.min(opts.timerMs, opts.minLiveMs ?? QUESTION_MIN_LIVE_MS);
  return opts.nowMs - started >= minLive;
}
