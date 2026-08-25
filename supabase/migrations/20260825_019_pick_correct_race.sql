-- pick_correct as a simultaneous race, with optional extra rounds per block.
-- Unique card claims stay; turn_order uniqueness would collide when two
-- players tap at the same time.

ALTER TABLE pick_correct_turns
  ADD COLUMN IF NOT EXISTS round_index smallint NOT NULL DEFAULT 0;

UPDATE pick_correct_turns
SET round_index = 0
WHERE round_index IS NULL;

DROP INDEX IF EXISTS uniq_pct_room_block_turn;
DROP INDEX IF EXISTS uniq_pct_room_block_card;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pct_room_block_round_card
  ON pick_correct_turns (room_id, block_index, round_index, card_index);
