-- Migration: Finale Survival mode
-- New tables for A/B elimination chains played at end-of-match.
-- Each chain belongs to a theme and consists of ordered steps.
-- Each step has a prompt, one correct answer, and two wrong options.

-- ============================================================
-- TABLE: finale_chains
-- ============================================================
CREATE TABLE IF NOT EXISTS finale_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name_de text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_chain_slug UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_finale_chains_theme ON finale_chains(theme_id) WHERE active;

ALTER TABLE finale_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finale_chains_read" ON finale_chains FOR SELECT USING (true);
CREATE POLICY "finale_chains_insert" ON finale_chains FOR INSERT WITH CHECK (true);

-- ============================================================
-- TABLE: finale_steps
-- ============================================================
CREATE TABLE IF NOT EXISTS finale_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL REFERENCES finale_chains(id) ON DELETE CASCADE,
  step_order smallint NOT NULL,
  prompt text NOT NULL,
  correct text NOT NULL,
  wrong_a text NOT NULL,
  wrong_b text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_chain_step UNIQUE (chain_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_finale_steps_chain ON finale_steps(chain_id);

ALTER TABLE finale_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finale_steps_read" ON finale_steps FOR SELECT USING (true);
CREATE POLICY "finale_steps_insert" ON finale_steps FOR INSERT WITH CHECK (true);

-- ============================================================
-- Extend match_blocks.mode CHECK to include finale_survival
-- ============================================================
-- The prompts table CHECK constrains mode, but match_blocks.mode
-- is unconstrained text — no ALTER needed there.
-- We add a room-level column to track finale state.

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS finale_state jsonb;

COMMENT ON COLUMN rooms.finale_state IS
  'Server-authoritative finale state: chain_id, step, living/eliminated player lists, option positions, chosen wrong index per step';

-- ============================================================
-- Seed: sample Gaming chains so the flow is playable in preview
-- ============================================================

-- We need the gaming theme id. Use a CTE to look it up.
WITH gaming_theme AS (
  SELECT id FROM themes WHERE slug = 'gaming' LIMIT 1
),
chain_insert AS (
  INSERT INTO finale_chains (theme_id, slug, name_de)
  SELECT id, 'gaming-legenden', 'Gaming-Legenden'
  FROM gaming_theme
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
),
chain_id_lookup AS (
  SELECT id FROM chain_insert
  UNION ALL
  SELECT id FROM finale_chains WHERE slug = 'gaming-legenden'
  LIMIT 1
)
INSERT INTO finale_steps (chain_id, step_order, prompt, correct, wrong_a, wrong_b)
SELECT cid.id, s.step_order, s.prompt, s.correct, s.wrong_a, s.wrong_b
FROM chain_id_lookup cid,
(VALUES
  (0, 'Welches Spiel hat den Charakter "Mario"?',            'Super Mario Bros.',     'Sonic the Hedgehog', 'Mega Man'),
  (1, 'Welche Konsole brachte Nintendo 2017 heraus?',        'Nintendo Switch',       'Nintendo Wii U',     'Nintendo 3DS'),
  (2, 'Was ist das meistverkaufte Videospiel aller Zeiten?',  'Minecraft',             'Tetris',             'GTA V'),
  (3, 'In welchem Spiel kämpft man in Tilted Towers?',       'Fortnite',              'Apex Legends',       'PUBG'),
  (4, 'Wer ist der Hauptcharakter in „The Legend of Zelda"?', 'Link',                  'Zelda',              'Ganondorf'),
  (5, 'Welches Spiel nutzt Creeper als Gegner?',             'Minecraft',             'Terraria',           'Roblox'),
  (6, 'In welchem Jahr erschien das erste Pokémon-Spiel?',   '1996',                  '1998',               '2001')
) AS s(step_order, prompt, correct, wrong_a, wrong_b)
ON CONFLICT (chain_id, step_order) DO NOTHING;

-- Second chain: Film & Serie
WITH film_theme AS (
  SELECT id FROM themes WHERE slug = 'film-serie' LIMIT 1
),
chain_insert AS (
  INSERT INTO finale_chains (theme_id, slug, name_de)
  SELECT id, 'film-klassiker', 'Film-Klassiker'
  FROM film_theme
  ON CONFLICT (slug) DO NOTHING
  RETURNING id
),
chain_id_lookup AS (
  SELECT id FROM chain_insert
  UNION ALL
  SELECT id FROM finale_chains WHERE slug = 'film-klassiker'
  LIMIT 1
)
INSERT INTO finale_steps (chain_id, step_order, prompt, correct, wrong_a, wrong_b)
SELECT cid.id, s.step_order, s.prompt, s.correct, s.wrong_a, s.wrong_b
FROM chain_id_lookup cid,
(VALUES
  (0, 'Wer spielt Iron Man im MCU?',                         'Robert Downey Jr.',     'Chris Evans',        'Chris Hemsworth'),
  (1, 'In welchem Film heißt es „Ich bin dein Vater"?',      'Das Imperium schlägt zurück', 'Eine neue Hoffnung', 'Die Rückkehr der Jedi-Ritter'),
  (2, 'Welcher Film gewann 2020 den Oscar für den besten Film?', 'Parasite',           '1917',               'Joker'),
  (3, 'Wer führte Regie bei „Inception"?',                   'Christopher Nolan',     'Steven Spielberg',   'Ridley Scott'),
  (4, 'In welcher Stadt spielt „Der Pate"?',                 'New York',              'Chicago',            'Los Angeles'),
  (5, 'Welche Farbe hat Shreks Haut?',                       'Grün',                  'Braun',              'Blau')
) AS s(step_order, prompt, correct, wrong_a, wrong_b)
ON CONFLICT (chain_id, step_order) DO NOTHING;
