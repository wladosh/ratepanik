-- Migration: swap alltag-peinlich → essen-trinken + tiere
-- Product decision 2026-08-27: remove Alltag & Peinlich, add two new themes.
-- Old prompts stay in DB but become unreachable via the RLS policy on themes.active.

-- Deactivate alltag-peinlich (prompts remain but are invisible via theme RLS)
UPDATE themes SET active = false WHERE slug = 'alltag-peinlich';

-- Insert new themes (idempotent via ON CONFLICT)
INSERT INTO themes (slug, name_de, active) VALUES
  ('essen-trinken', 'Essen & Trinken', true),
  ('tiere',         'Tiere',           true)
ON CONFLICT (slug) DO UPDATE SET active = true, name_de = EXCLUDED.name_de;
