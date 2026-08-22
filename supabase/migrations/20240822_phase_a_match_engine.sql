-- Migration: Phase A – Match engine schema
-- Source of truth: docs/PRODUCT.md (§2, §3, §7, §8, §9, §12)
-- Extends existing rooms/players/answers from ratepanik_multiplayer_schema.
-- ADDITIVE ONLY — no existing columns/tables dropped.
--
-- ═══════════════════════════════════════════════════════════════
-- Mode payload shapes (prompts.payload):
--
--   number_guess: { "answer": number, "unit"?: string, "plausibility_note"?: string }
--   pick_correct: { "cards": string[8], "correct_indices": number[4] }  -- 0-based
--   find_lie:     { "statements": string[4], "lie_index": number }
--   order_it:     { "items": string[4|5], "correct_order": number[], "order_axis": string }
--
-- ═══════════════════════════════════════════════════════════════

-- ============================================================
-- TABLE: themes
-- Product §10: approved starter set.
-- ============================================================
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_de text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "themes_read_all" ON themes FOR SELECT USING (true);

-- Seed approved themes (§10 + coordinator alignment)
INSERT INTO themes (slug, name_de) VALUES
  ('gaming',             'Gaming'),
  ('geschichte',         'Geschichte'),
  ('wissenschaft-natur', 'Wissenschaft & Natur'),
  ('sport',              'Sport'),
  ('musik',              'Musik'),
  ('film-serie',         'Film & Serie'),
  ('reise-orte',         'Reise & Orte'),
  ('alltag-peinlich',    'Alltag & Peinlich')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- TABLE: prompts
-- Empty — Fragemeister supplies seed JSON.
-- mode is text (not enum) to allow future modes without migration.
-- Phase A active modes: number_guess, pick_correct
-- Schema also allows: find_lie, order_it
-- ============================================================
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('number_guess', 'pick_correct', 'find_lie', 'order_it')),
  difficulty text NOT NULL DEFAULT 'mittel' CHECK (difficulty IN ('leicht', 'mittel', 'schwer')),
  prompt text NOT NULL,
  hint text,
  payload jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_prompts_theme_mode ON prompts(theme_id, mode) WHERE active;
CREATE INDEX idx_prompts_mode_difficulty ON prompts(mode, difficulty) WHERE active;

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompts_read_all" ON prompts FOR SELECT USING (true);

-- ============================================================
-- TABLE: match_blocks
-- Product §8: Standard match = 4 blocks, random modes without repeat.
-- Before quiz-like blocks the host/player picks theme from 2 random options.
-- ============================================================
CREATE TABLE IF NOT EXISTS match_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  block_index smallint NOT NULL,            -- 0..3
  mode text NOT NULL,
  theme_id uuid REFERENCES themes(id) ON DELETE SET NULL,
  theme_options uuid[2],                    -- the 2 random theme choices offered
  prompt_ids uuid[] NOT NULL DEFAULT '{}',  -- ordered prompts for this block
  current_round smallint NOT NULL DEFAULT 0,
  rounds_total smallint NOT NULL DEFAULT 2, -- §9.1: 2 rounds per block for number_guess
  is_complete boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_room_block UNIQUE (room_id, block_index)
);

CREATE INDEX idx_match_blocks_room ON match_blocks(room_id);

ALTER TABLE match_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_blocks_read" ON match_blocks FOR SELECT USING (true);
CREATE POLICY "match_blocks_insert" ON match_blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "match_blocks_update" ON match_blocks FOR UPDATE USING (true);

-- ============================================================
-- Extend rooms: block tracking + host auth binding + theme vote state
-- ============================================================
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS current_block_index smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_blocks smallint NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS host_user_id uuid,
  ADD COLUMN IF NOT EXISTS theme_vote_active boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN rooms.host_user_id IS 'Supabase Auth uid (non-guest required to host, §3.2)';
COMMENT ON COLUMN rooms.theme_vote_active IS 'True when theme selection is in progress before a block';

-- ============================================================
-- Extend answers: mode-specific data + rank-based scoring
-- ============================================================
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS block_index smallint,
  ADD COLUMN IF NOT EXISTS round_index smallint,
  ADD COLUMN IF NOT EXISTS prompt_id uuid REFERENCES prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mode text,
  ADD COLUMN IF NOT EXISTS numeric_answer numeric,        -- number_guess: player's guess
  ADD COLUMN IF NOT EXISTS payload_answer jsonb,          -- flexible per-mode response
  ADD COLUMN IF NOT EXISTS distance numeric,              -- number_guess: |guess - correct|
  ADD COLUMN IF NOT EXISTS rank smallint,                 -- 1=closest, n=furthest (§9.1)
  ADD COLUMN IF NOT EXISTS points_awarded integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_ms integer;

-- ============================================================
-- TABLE: pick_correct_turns
-- §9.2: Players take turns tapping cards until 4 correct found.
-- Each row = one card tap within a pick_correct block.
-- ============================================================
CREATE TABLE IF NOT EXISTS pick_correct_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  block_index smallint NOT NULL,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  turn_order smallint NOT NULL,            -- sequential turn number
  card_index smallint NOT NULL,            -- which card (0..7) was tapped
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pct_room_block ON pick_correct_turns(room_id, block_index);

ALTER TABLE pick_correct_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pct_read" ON pick_correct_turns FOR SELECT USING (true);
CREATE POLICY "pct_insert" ON pick_correct_turns FOR INSERT WITH CHECK (true);

-- ============================================================
-- TABLE: match_scores (per-player per-block rank summary)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  block_index smallint NOT NULL,
  rank smallint,                            -- 1st, 2nd, 3rd, 4th within block
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

-- number_guess: points by rank (§9.1 — last place 0, scale to player count)
-- Default 4 players: 1st=3, 2nd=2, 3rd=1, 4th=0 (multiplied by 100)
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

-- pick_correct: points based on how many correct cards a player found
-- (contribution-based within the cooperative turn sequence)
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
