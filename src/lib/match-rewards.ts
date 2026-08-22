/**
 * Match-end reward calculations.
 *
 * Formula (placeholder — product can tune later):
 *   XP  = base 50 + place_bonus + correct_answers × 5
 *   Hirncoins = base 20 + place_bonus
 *
 * Place bonuses (by placement among N players):
 *   1st → +40 XP / +20 Hirncoins
 *   2nd → +20 XP / +10 Hirncoins
 *   3rd → +10 XP / +5  Hirncoins
 *   4th → +0  XP / +0  Hirncoins
 */

interface PlaceBonus {
  xp: number;
  hirncoins: number;
}

const PLACE_BONUSES: PlaceBonus[] = [
  { xp: 40, hirncoins: 20 },
  { xp: 20, hirncoins: 10 },
  { xp: 10, hirncoins: 5 },
  { xp: 0, hirncoins: 0 },
];

function placeBonus(placement: number): PlaceBonus {
  const idx = Math.min(placement - 1, PLACE_BONUSES.length - 1);
  return PLACE_BONUSES[Math.max(0, idx)];
}

export interface MatchRewardResult {
  placement: number;
  xpAwarded: number;
  hirncoinsAwarded: number;
}

export function calculateMatchRewards(
  placement: number,
  correctAnswers: number,
): MatchRewardResult {
  const bonus = placeBonus(placement);
  const xpAwarded = 50 + bonus.xp + correctAnswers * 5;
  const hirncoinsAwarded = 20 + bonus.hirncoins;
  return { placement, xpAwarded, hirncoinsAwarded };
}
