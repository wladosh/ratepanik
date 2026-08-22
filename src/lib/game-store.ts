// Legacy scoring — kept for backwards compatibility with any remaining references.
// Phase A uses rank-based scoring calculated in game-context.tsx.

export function calculatePoints(
  isCorrect: boolean,
  answerTimeMs: number,
  timeLimit: number
): number {
  if (!isCorrect) return 0;
  const timeRatio = Math.max(0, 1 - answerTimeMs / (timeLimit * 1000));
  return Math.round(1000 + 500 * timeRatio);
}
