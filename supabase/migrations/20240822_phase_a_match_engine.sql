-- Migration: Phase A – Match engine schema (mode blocks, themes, prompts, scoring)
-- Extends the existing rooms/players/answers tables from ratepanik_multiplayer_schema.
-- This migration is ADDITIVE ONLY — no existing columns or tables are dropped.
--
-- Payload shapes by mode:
--   number_guess : { "answer": number, "unit"?: string, "plausibility_note"?: string }
--   pick_correct : { "cards": string[8], "correct_indices": number[4] }  (0-based)
--   find_lie     : { "statements": string[4], "lie_index": number }
--   order_it     : { "items": string[4|5], "correct_order": number[], "order_axis": string }

-- ============================================================
-- TABLE: themes
-- Approved slugs seeded below. Fragemeister supplies prompt content.
-- ============================================================
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_de text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "themes_read_all" ON themes FOR SELECT USING (true);

-- Seed approved themes
INSERT INTO themes (slug, name_de) VALUES
  ('gaming', 'Gaming'),
  ('geschichte', 'Geschichte'),
  ('wissenschaft-natur', 'Wissenschaft & Natur'),
  ('sport', 'Sport'),
  ('musik', 'Musik'),
  ('film-serie', 'Film & Serie'),
  ('reise-orte', 'Reise & Orte'),
  ('alltag-peinlich', 'Alltag & Peinlich')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- TABLE: prompts
-- Empty for now — Fragemeister will supply seed JSON.
-- mode is text (not enum) to allow future modes without migrations.
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
-- TABLE: match_blocks (round-groups within a match)
-- Standard match = 4 blocks; each block has one mode + one theme.
-- ============================================================
CREATE TABLE IF NOT EXISTS match_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  block_index smallint NOT NULL,
  mode text NOT NULL,
  theme_id uuid REFERENCES themes(id) ON DELETE SET NULL,
  prompt_ids uuid[] NOT NULL DEFAULT '{}',
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
-- Extend rooms: match-level tracking + host auth binding
-- ============================================================
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS current_block_index smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_blocks smallint NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS host_user_id uuid;

COMMENT ON COLUMN rooms.host_user_id IS 'Supabase Auth uid of host (non-guest required to create)';

-- ============================================================
-- Extend answers: support all game modes + scoring
-- ============================================================
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS block_index smallint,
  ADD COLUMN IF NOT EXISTS prompt_id uuid REFERENCES prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mode text,
  ADD COLUMN IF NOT EXISTS numeric_answer numeric,
  ADD COLUMN IF NOT EXISTS payload_answer jsonb,
  ADD COLUMN IF NOT EXISTS points_awarded integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_ms integer;

-- ============================================================
-- TABLE: match_scores (per-player per-block summary)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  block_index smallint NOT NULL,
  total_points integer NOT NULL DEFAULT 0,
  correct_count smallint NOT NULL DEFAULT 0,
  total_prompts smallint NOT NULL DEFAULT 0,
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

-- pick_correct: base 1000 + time bonus up to 500
CREATE OR REPLACE FUNCTION calculate_pick_correct_points(
  is_correct boolean,
  answer_time_ms integer,
  time_limit_ms integer DEFAULT 15000
) RETURNS integer
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF NOT is_correct THEN RETURN 0; END IF;
  RETURN ROUND(1000 + 500 * GREATEST(0, 1.0 - answer_time_ms::numeric / time_limit_ms));
END;
$$;

-- number_guess: max 1500, linear decay by distance from correct answer
CREATE OR REPLACE FUNCTION calculate_number_guess_points(
  player_answer numeric,
  correct_answer numeric,
  tolerance numeric DEFAULT 10
) RETURNS integer
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  distance numeric;
  max_distance numeric;
  ratio numeric;
BEGIN
  IF tolerance <= 0 THEN tolerance := 1; END IF;
  distance := ABS(player_answer - correct_answer);
  max_distance := tolerance * 2;
  IF distance >= max_distance THEN RETURN 0; END IF;
  ratio := 1.0 - (distance / max_distance);
  RETURN ROUND(1500 * ratio);
END;
$$;
