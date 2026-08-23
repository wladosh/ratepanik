/** Question countdown duration — single tunable constant (ms). */
export const QUESTION_TIMER_MS = 5_000;

/** Rank-based scoring for number_guess (§9.1) */
export function calculateNumberGuessPoints(
  rank: number,
  totalPlayers: number
): number {
  if (rank < 1 || rank > totalPlayers) return 0;
  return (totalPlayers - rank) * 100;
}

/** Contribution-based scoring for pick_correct (§9.2) */
export function calculatePickCorrectPoints(
  correctFound: number,
  totalCorrect: number = 4
): number {
  if (totalCorrect <= 0) return 0;
  return Math.round((correctFound / totalCorrect) * 1000);
}

/** Choose 4 block modes: mix of number_guess + pick_correct, no repeat if possible */
export function generateBlockModes(count: number = 4): ("number_guess" | "pick_correct")[] {
  const pool: ("number_guess" | "pick_correct")[] = [
    "number_guess",
    "pick_correct",
    "number_guess",
    "pick_correct",
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
