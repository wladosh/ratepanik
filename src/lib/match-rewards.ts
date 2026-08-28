/**
 * Match-end reward calculations.
 *
 * XP (unchanged shape):
 *   50 + place bonus + score/25 × 5
 *
 * Hirncoins — 10-minute medium match lands around 40–80:
 *   (40 participation + place + performance) × (payout minutes / 10)
 *
 * Place (1st→4th): +16 / +9 / +4 / +0
 * Performance: 0–24 from score vs 250 × scheduled questions
 *   (250 is a solid question; a blowout caps at 24)
 *
 * Duration: 6 or fewer questions → 5 min (half), 16+ → 15 min (1.5×).
 */

export const HC_PARTICIPATION = 40;
export const HC_PLACE_BONUS = [16, 9, 4, 0] as const;
export const HC_PERFORMANCE_MAX = 24;
export const HC_SCORE_PER_QUESTION = 250;
export const HC_MEDIUM_MINUTES = 10;
export const HC_MEDIUM_QUESTION_SLOTS = 15;

interface PlaceBonus {
  xp: number;
}

const XP_PLACE_BONUSES: PlaceBonus[] = [
  { xp: 40 },
  { xp: 20 },
  { xp: 10 },
  { xp: 0 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function questionSlotsFromSettings(settings: {
  blocks: number;
  questionsPerBlock: number;
}): number {
  return clamp(Math.round(settings.blocks * settings.questionsPerBlock), 1, 24);
}

/** Labeled payout length from how many questions the host scheduled. */
export function matchPayoutMinutes(questionSlots: number): 5 | 10 | 15 {
  if (questionSlots >= 16) return 15;
  if (questionSlots <= 6) return 5;
  return 10;
}

export function hirncoinsPlaceBonus(placement: number): number {
  const idx = clamp(Math.round(placement) - 1, 0, HC_PLACE_BONUS.length - 1);
  return HC_PLACE_BONUS[idx] ?? 0;
}

/** 0–1: how close the score is to a strong run (250 per scheduled question). */
export function hirncoinsPerformanceFactor(
  score: number,
  questionSlots: number,
): number {
  const slots = clamp(Math.round(questionSlots), 1, 24);
  const target = slots * HC_SCORE_PER_QUESTION;
  if (!Number.isFinite(score) || score <= 0) return 0;
  return clamp(score / target, 0, 1);
}

export function calculateHirncoinsAwarded(opts: {
  placement: number;
  score: number;
  questionSlots: number;
}): number {
  const slots = clamp(Math.round(opts.questionSlots), 1, 24);
  const scale = matchPayoutMinutes(slots) / HC_MEDIUM_MINUTES;
  const performance =
    HC_PERFORMANCE_MAX * hirncoinsPerformanceFactor(opts.score, slots);
  return Math.round(
    scale * (HC_PARTICIPATION + hirncoinsPlaceBonus(opts.placement) + performance),
  );
}

function xpPlaceBonus(placement: number): number {
  const idx = clamp(Math.round(placement) - 1, 0, XP_PLACE_BONUSES.length - 1);
  return XP_PLACE_BONUSES[idx]?.xp ?? 0;
}

export interface MatchRewardInput {
  placement: number;
  score: number;
  questionSlots: number;
}

export interface MatchRewardResult {
  placement: number;
  xpAwarded: number;
  hirncoinsAwarded: number;
}

export function calculateMatchRewards(input: MatchRewardInput): MatchRewardResult {
  const score = Number.isFinite(input.score) ? Math.max(0, input.score) : 0;
  const correctProxy = score > 0 ? Math.max(0, Math.round(score / 25)) : 0;
  const xpAwarded = 50 + xpPlaceBonus(input.placement) + correctProxy * 5;
  return {
    placement: input.placement,
    xpAwarded,
    hirncoinsAwarded: calculateHirncoinsAwarded({
      placement: input.placement,
      score,
      questionSlots: input.questionSlots,
    }),
  };
}
