/** Default question countdown when a block has no timer snapshot (legacy). */
export const QUESTION_TIMER_MS = 5_000;

/** Rank-based scoring for number_guess (§9.1) */
export function calculateNumberGuessPoints(
  rank: number,
  totalPlayers: number
): number {
  if (rank < 1 || rank > totalPlayers) return 0;
  return (totalPlayers - rank) * 100;
}

/** Timeout and full-lobby scoring share this field so ranks stay comparable. */
export function numberGuessScoringPool(
  playerCount: number,
  answerCount: number,
): number {
  return Math.max(playerCount, answerCount);
}

/** Contribution-based scoring for pick_correct (§9.2) */
export function calculatePickCorrectPoints(
  correctFound: number,
  totalCorrect: number = 4
): number {
  if (totalCorrect <= 0) return 0;
  return Math.round((correctFound / totalCorrect) * 1000);
}

export type PlayableMode = "number_guess" | "pick_correct";
export type ModeFilter = "all" | PlayableMode;

/** Mix of playable modes, or a single-mode filter. Count clamped 1–4. */
export function generateBlockModes(
  count: number = 4,
  filter: ModeFilter = "all",
): PlayableMode[] {
  const n = Math.min(4, Math.max(1, Math.round(count)));
  if (filter === "number_guess" || filter === "pick_correct") {
    return Array.from({ length: n }, () => filter);
  }

  const pool: PlayableMode[] = [];
  for (let i = 0; i < n; i++) {
    pool.push(i % 2 === 0 ? "number_guess" : "pick_correct");
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}
