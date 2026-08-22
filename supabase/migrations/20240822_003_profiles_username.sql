-- Migration: profiles table with unique, case-insensitive username
-- Provides display-name / username validation:
--   1) minimum 3 characters
--   2) case-insensitive uniqueness across all users

-- ============================================================
-- TABLE: profiles
-- One row per authenticated user (linked to auth.users.id).
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT username_min_length CHECK (char_length(username) >= 3)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON profiles (lower(username));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read any profile (needed for lobby display names)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- RPC: claim_username
-- Atomically validates and sets a username for the calling user.
-- Returns JSON: { "ok": true } or { "ok": false, "error": "..." }
-- ============================================================
CREATE OR REPLACE FUNCTION claim_username(desired_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _trimmed text;
  _existing_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  _trimmed := trim(desired_username);

  -- Length check
  IF char_length(_trimmed) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Name zu kurz (min. 3 Zeichen)');
  END IF;

  IF char_length(_trimmed) > 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Name zu lang (max. 20 Zeichen)');
  END IF;

  -- Check uniqueness (case-insensitive), excluding own row
  SELECT id INTO _existing_id
    FROM profiles
    WHERE lower(username) = lower(_trimmed)
      AND id != _uid
    LIMIT 1;

  IF _existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Name bereits vergeben');
  END IF;

  -- Upsert profile
  INSERT INTO profiles (id, username, updated_at)
    VALUES (_uid, _trimmed, now())
    ON CONFLICT (id) DO UPDATE
      SET username = EXCLUDED.username,
          updated_at = now();

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================
-- RPC: check_username_available
-- Quick availability check (no mutation).
-- Returns JSON: { "available": true/false, "error": "..." | null }
-- ============================================================
CREATE OR REPLACE FUNCTION check_username_available(desired_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _trimmed text;
  _existing_id uuid;
BEGIN
  _trimmed := trim(desired_username);

  IF char_length(_trimmed) < 3 THEN
    RETURN jsonb_build_object('available', false, 'error', 'Name zu kurz (min. 3 Zeichen)');
  END IF;

  IF char_length(_trimmed) > 20 THEN
    RETURN jsonb_build_object('available', false, 'error', 'Name zu lang (max. 20 Zeichen)');
  END IF;

  SELECT id INTO _existing_id
    FROM profiles
    WHERE lower(username) = lower(_trimmed)
      AND (_uid IS NULL OR id != _uid)
    LIMIT 1;

  IF _existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('available', false, 'error', 'Name bereits vergeben');
  END IF;

  RETURN jsonb_build_object('available', true, 'error', null);
END;
$$;
