export const PICK_CORRECT_CARD_COUNT = 8;
export const PICK_CORRECT_CORRECT_TARGET = 4;
export const PICK_CORRECT_PICKS_PER_PLAYER = 2;

export type PickCorrectTurnLike = {
  player_id: string;
  is_correct: boolean;
};

export function pickCountForPlayer(
  turns: readonly PickCorrectTurnLike[],
  playerId: string,
): number {
  return turns.filter((turn) => turn.player_id === playerId).length;
}

export function playerHasPicksRemaining(
  turns: readonly PickCorrectTurnLike[],
  playerId: string,
  budget: number = PICK_CORRECT_PICKS_PER_PLAYER,
): boolean {
  return pickCountForPlayer(turns, playerId) < budget;
}

export function allPlayersExhaustedPicks(
  turns: readonly PickCorrectTurnLike[],
  playerIds: readonly string[],
  budget: number = PICK_CORRECT_PICKS_PER_PLAYER,
): boolean {
  if (playerIds.length === 0) return false;
  return playerIds.every((id) => pickCountForPlayer(turns, id) >= budget);
}

export function pickCorrectHuntComplete(
  turns: readonly PickCorrectTurnLike[],
  target: number = PICK_CORRECT_CORRECT_TARGET,
): boolean {
  return turns.filter((turn) => turn.is_correct).length >= target;
}

/** Round is over when 4 correct are claimed or every seated player used their 2 taps. Timer is separate. */
export function isPickCorrectRoundComplete(opts: {
  turns: readonly PickCorrectTurnLike[];
  playerIds: readonly string[];
  correctTarget?: number;
  picksPerPlayer?: number;
}): boolean {
  if (pickCorrectHuntComplete(opts.turns, opts.correctTarget)) return true;
  return allPlayersExhaustedPicks(opts.turns, opts.playerIds, opts.picksPerPlayer);
}
