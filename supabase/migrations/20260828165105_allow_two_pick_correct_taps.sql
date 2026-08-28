-- An obsolete one-answer-per-player index survived the simultaneous-race
-- migration in production. It rejects every player's second tap with 23505.
-- The app enforces the two-tap budget; the database only needs to arbitrate
-- which player claimed each card first.
DROP INDEX IF EXISTS public.uniq_pct_room_block_round_player;

-- Keep first-claim-wins card arbitration explicit and idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pct_room_block_round_card
  ON public.pick_correct_turns (room_id, block_index, round_index, card_index);
