-- Migration: Add user_id to players + partial unique index to prevent duplicate joins
-- Bug B2: same auth user joining a room multiple times creates duplicate player rows.
-- Fix: link each player row to auth.users.id and enforce one seat per user per room.
-- ADDITIVE ONLY — no existing columns/tables dropped. Idempotent (IF NOT EXISTS).

-- ============================================================
-- 1. Add user_id column (nullable for backwards-compat with old rows)
-- ============================================================
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN players.user_id IS 'Supabase Auth uid — one seat per user per room (Bug B2 fix)';

-- ============================================================
-- 2. Partial unique index: at most one player row per (room, auth user)
--    NULL user_id rows (legacy) are excluded from the constraint.
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS uniq_room_user
  ON players (room_id, user_id)
  WHERE user_id IS NOT NULL;

-- ============================================================
-- 3. Index for fast lookup during rejoin check
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_players_room_user
  ON players (room_id, user_id)
  WHERE user_id IS NOT NULL;
