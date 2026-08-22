const POINTS_BASE = 1000;
const POINTS_TIME_BONUS = 500;

export function calculatePoints(
  isCorrect: boolean,
  answerTimeMs: number,
  timeLimit: number
): number {
  if (!isCorrect) return 0;
  const timeRatio = Math.max(0, 1 - answerTimeMs / (timeLimit * 1000));
  return Math.round(POINTS_BASE + POINTS_TIME_BONUS * timeRatio);
}
