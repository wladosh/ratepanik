-- Migration: Phase A – Match engine (blocks, scoring, turns, room extensions)
-- Depends on: 20240822_001_themes_and_prompts_content (themes + prompts tables)
-- Extends existing rooms/players/answers from ratepanik_multiplayer_schema.
-- Source of truth: docs/PRODUCT.md §8, §9
-- ADDITIVE ONLY — no existing columns/tables dropped.

-- ============================================================
-- TABLE: match_blocks
-- §8: Standard match = 4 blocks, random modes without repeat.
-- Before quiz-like blocks: player picks theme from 2 random options.
-- §9.1: number_guess = 2 rounds per block.
-- ============================================================
CREATE TABLE IF NOT EXISTS match_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  block_index smallint NOT NULL,            -- 0..3
  mode text NOT NULL,
  theme_id uuid REFERENCES themes(id) ON DELETE SET NULL,
  theme_options uuid[],                     -- 2 random theme choices offered before block
  prompt_ids uuid[] NOT NULL DEFAULT '{}',  -- ordered prompts for this block
  current_round smallint NOT NULL DEFAULT 0,
  rounds_total smallint NOT NULL DEFAULT 2, -- §9.1: 2 rounds/block for number_guess
  is_complete boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_room_block UNIQUE (room_id, block_index)
);

CREATE INDEX IF NOT EXISTS idx_match_blocks_room ON match_blocks(room_id);

ALTER TABLE match_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_blocks_read" ON match_blocks FOR SELECT USING (true);
CREATE POLICY "match_blocks_insert" ON match_blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "match_blocks_update" ON match_blocks FOR UPDATE USING (true);

-- ============================================================
-- Extend rooms: block tracking + host auth binding + theme vote
-- ============================================================
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS current_block_index smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_blocks smallint NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS host_user_id uuid,
  ADD COLUMN IF NOT EXISTS theme_vote_active boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN rooms.host_user_id IS 'Supabase Auth uid (non-guest required to host, §3.2)';
COMMENT ON COLUMN rooms.theme_vote_active IS 'True during theme selection before a block (§8)';

-- ============================================================
-- Extend answers: mode-specific data + rank-based scoring
-- ============================================================
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS block_index smallint,
  ADD COLUMN IF NOT EXISTS round_index smallint,
  ADD COLUMN IF NOT EXISTS prompt_id uuid REFERENCES prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mode text,
  ADD COLUMN IF NOT EXISTS numeric_answer numeric,        -- number_guess player guess
  ADD COLUMN IF NOT EXISTS payload_answer jsonb,          -- flexible per-mode response
  ADD COLUMN IF NOT EXISTS distance numeric,              -- |guess - correct| for ranking
  ADD COLUMN IF NOT EXISTS rank smallint,                 -- 1=closest (§9.1 rank scoring)
  ADD COLUMN IF NOT EXISTS points_awarded integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_ms integer;

-- ============================================================
-- TABLE: pick_correct_turns
-- §9.2: Players take turns tapping cards until 4 correct found.
-- ============================================================
CREATE TABLE IF NOT EXISTS pick_correct_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  block_index smallint NOT NULL,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  turn_order smallint NOT NULL,
  card_index smallint NOT NULL,            -- which card (0..7)
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pct_room_block ON pick_correct_turns(room_id, block_index);

ALTER TABLE pick_correct_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pct_read" ON pick_correct_turns FOR SELECT USING (true);
CREATE POLICY "pct_insert" ON pick_correct_turns FOR INSERT WITH CHECK (true);

-- ============================================================
-- TABLE: match_scores (per-player per-block rank + points)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  block_index smallint NOT NULL,
  rank smallint,                            -- 1st..4th within block
  total_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_player_block_score UNIQUE (room_id, player_id, block_index)
);

ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_scores_read" ON match_scores FOR SELECT USING (true);
CREATE POLICY "match_scores_insert" ON match_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "match_scores_update" ON match_scores FOR UPDATE USING (true);

-- ============================================================
-- Scoring functions
-- ============================================================

-- number_guess: points by rank (§9.1 — last place 0)
CREATE OR REPLACE FUNCTION calculate_number_guess_rank_points(
  player_rank smallint,
  total_players smallint DEFAULT 4
) RETURNS integer
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF player_rank IS NULL OR player_rank < 1 THEN RETURN 0; END IF;
  IF player_rank > total_players THEN RETURN 0; END IF;
  RETURN (total_players - player_rank) * 100;
END;
$$;

-- pick_correct: contribution points (§9.2)
CREATE OR REPLACE FUNCTION calculate_pick_correct_points(
  correct_found smallint,
  total_correct smallint DEFAULT 4
) RETURNS integer
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF total_correct <= 0 THEN RETURN 0; END IF;
  RETURN ROUND(correct_found::numeric / total_correct * 1000);
END;
$$;
