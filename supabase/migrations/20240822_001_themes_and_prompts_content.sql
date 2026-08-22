-- Migration: themes_and_prompts_content
-- Mirrors the live Supabase schema for themes + prompts tables.
-- These tables were applied via the Supabase Dashboard migration
-- "themes_and_prompts_content" and are versioned here for repo consistency.
--
-- This migration is idempotent (IF NOT EXISTS / ON CONFLICT).

-- ============================================================
-- TABLE: themes
-- ============================================================
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_de text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- RLS: anon + authenticated can SELECT only active themes
DO $$ BEGIN
  DROP POLICY IF EXISTS "themes_read_all" ON themes;
  DROP POLICY IF EXISTS "themes_select_active" ON themes;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "themes_select_active" ON themes
  FOR SELECT TO anon, authenticated
  USING (active = true);

-- ============================================================
-- TABLE: prompts
-- ============================================================
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('number_guess', 'pick_correct', 'find_lie', 'order_it')),
  difficulty text NOT NULL DEFAULT 'mittel' CHECK (difficulty IN ('leicht', 'mittel', 'schwer')),
  prompt text NOT NULL,
  hint text,
  payload jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompts_theme_mode ON prompts(theme_id, mode) WHERE active;
CREATE INDEX IF NOT EXISTS idx_prompts_mode_difficulty ON prompts(mode, difficulty) WHERE active;

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "prompts_read_all" ON prompts;
  DROP POLICY IF EXISTS "prompts_select_active" ON prompts;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "prompts_select_active" ON prompts
  FOR SELECT TO anon, authenticated
  USING (active = true);

-- ============================================================
-- Seed themes (idempotent via ON CONFLICT)
-- ============================================================
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
