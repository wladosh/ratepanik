-- pick_correct: one card per player per round.
-- Historical race hunts could store several taps for the same seat.

DELETE FROM pick_correct_turns AS extra
USING pick_correct_turns AS kept
WHERE extra.id <> kept.id
  AND extra.room_id = kept.room_id
  AND extra.block_index = kept.block_index
  AND extra.round_index = kept.round_index
  AND extra.player_id = kept.player_id
  AND (
    extra.created_at > kept.created_at
    OR (
      extra.created_at = kept.created_at
      AND extra.turn_order > kept.turn_order
    )
    OR (
      extra.created_at = kept.created_at
      AND extra.turn_order = kept.turn_order
      AND extra.id > kept.id
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pct_room_block_round_player
  ON pick_correct_turns (room_id, block_index, round_index, player_id);
