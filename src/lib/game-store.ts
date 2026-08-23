/** Question countdown duration — default for number_guess / pick_correct / find_lie (ms). */
export const QUESTION_TIMER_MS = 5_000;

/** order_it needs longer — 4-item reorder is not playable in 5s. */
export const ORDER_IT_TIMER_MS = 20_000;

export const FIND_LIE_CORRECT_POINTS = 400;
export const ORDER_IT_POINTS_PER_SLOT = 100;

export type BlockMode = "number_guess" | "pick_correct" | "find_lie" | "order_it";

export function questionTimerMsForMode(mode: string | undefined | null): number {
  return mode === "order_it" ? ORDER_IT_TIMER_MS : QUESTION_TIMER_MS;
}

export function modeLabelDe(mode: string | undefined | null): string {
  switch (mode) {
    case "number_guess":
      return "Zahlenraten";
    case "pick_correct":
      return "Passendes wählen";
    case "find_lie":
      return "Die Lüge";
    case "order_it":
      return "Reihenfolge";
    default:
      return mode ?? "";
  }
}

export function modeEmoji(mode: string | undefined | null): string {
  switch (mode) {
    case "number_guess":
      return "\u{1F522}";
    case "pick_correct":
      return "\u{1F0CF}";
    case "find_lie":
      return "\u{1F925}";
    case "order_it":
      return "\u{2195}\u{FE0F}";
    default:
      return "";
  }
}

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

/** Binary scoring for find_lie — 400 if the lie was tapped. */
export function calculateFindLiePoints(choice: number, lieIndex: number): number {
  return choice === lieIndex ? FIND_LIE_CORRECT_POINTS : 0;
}

/** 100 points per item sitting in the correct rank slot (max 400 for 4 items). */
export function calculateOrderItPoints(
  playerOrder: number[],
  correctOrder: number[]
): number {
  const n = Math.min(playerOrder.length, correctOrder.length);
  let pts = 0;
  for (let i = 0; i < n; i++) {
    if (playerOrder[i] === correctOrder[i]) pts += ORDER_IT_POINTS_PER_SLOT;
  }
  return pts;
}

/** 4 unique modes, shuffled — PRODUCT.md §8 no-repeat when possible. */
export function generateBlockModes(count: number = 4): BlockMode[] {
  const pool: BlockMode[] = [
    "number_guess",
    "pick_correct",
    "find_lie",
    "order_it",
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
