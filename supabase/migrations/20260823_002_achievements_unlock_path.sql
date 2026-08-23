-- Migration: Achievement unlock path — realtime, catalog fix, SECURITY DEFINER RPCs
-- Depends on: 20260823_001_phase_b_progression (achievements + user_achievements tables)
-- ADDITIVE ONLY — safe for live project.

-- ============================================================
-- 1. Realtime: publish user_achievements for live toast
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_achievements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
  END IF;
END $$;

-- REPLICA IDENTITY FULL so Realtime can deliver full row on INSERT/UPDATE/DELETE.
ALTER TABLE user_achievements REPLICA IDENTITY FULL;

-- ============================================================
-- 2. Seed missing streak_3 achievement (daily play streak, NOT exact_streak_3)
-- ============================================================
INSERT INTO achievements (id, title, description, icon_key, trigger) VALUES
  ('streak_3', '3-Tage-Streak', 'An 3 Tagen in Folge gespielt.', 'rp_badge_streak_3', 'daily_streak >= 3')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Extend profiles with daily-streak tracking columns
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_played_date date,
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0;

-- ============================================================
-- 4. SECURITY DEFINER RPC: record_daily_play
--    Updates streak counter on profiles. Returns current streak.
-- ============================================================
CREATE OR REPLACE FUNCTION record_daily_play()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _last_date date;
  _streak integer;
  _today date := current_date;
  _is_anon boolean;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  SELECT (raw_app_meta_data->>'provider') = 'anonymous'
  INTO _is_anon
  FROM auth.users WHERE id = _uid;

  IF _is_anon THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'guest');
  END IF;

  SELECT last_played_date, current_streak
  INTO _last_date, _streak
  FROM profiles WHERE id = _uid;

  IF _last_date IS NULL OR _last_date < _today - 1 THEN
    _streak := 1;
  ELSIF _last_date = _today - 1 THEN
    _streak := COALESCE(_streak, 0) + 1;
  ELSIF _last_date = _today THEN
    RETURN jsonb_build_object('ok', true, 'streak', _streak);
  ELSE
    _streak := 1;
  END IF;

  UPDATE profiles
  SET last_played_date = _today,
      current_streak = _streak,
      updated_at = now()
  WHERE id = _uid;

  RETURN jsonb_build_object('ok', true, 'streak', _streak);
END;
$$;

-- ============================================================
-- 5. SECURITY DEFINER RPC: try_unlock_achievement
--    Validates trigger condition from DB state, then grants.
--    Idempotent (ON CONFLICT DO NOTHING on PK).
-- ============================================================
CREATE OR REPLACE FUNCTION try_unlock_achievement(p_achievement_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_anon boolean;
  _condition_met boolean := false;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  SELECT (raw_app_meta_data->>'provider') = 'anonymous'
  INTO _is_anon
  FROM auth.users WHERE id = _uid;

  IF _is_anon THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'guest');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM achievements WHERE id = p_achievement_id AND active = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'achievement_not_found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_achievements
    WHERE user_id = _uid AND achievement_id = p_achievement_id
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  CASE p_achievement_id
    WHEN 'first_win' THEN
      -- User has highest score in at least one finished room (score > 0).
      _condition_met := EXISTS (
        SELECT 1
        FROM players p
        JOIN rooms r ON r.id = p.room_id
        WHERE p.user_id = _uid
          AND r.status = 'finished'
          AND p.score > 0
          AND p.score >= ALL (
            SELECT p2.score FROM players p2 WHERE p2.room_id = p.room_id
          )
      );

    WHEN 'first_room' THEN
      _condition_met := EXISTS (
        SELECT 1 FROM rooms WHERE host_user_id = _uid
      );

    WHEN 'streak_3' THEN
      _condition_met := EXISTS (
        SELECT 1 FROM profiles WHERE id = _uid AND current_streak >= 3
      );

    ELSE
      RETURN jsonb_build_object('ok', false, 'reason', 'unsupported_achievement');
  END CASE;

  IF NOT _condition_met THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'condition_not_met');
  END IF;

  INSERT INTO user_achievements (user_id, achievement_id)
  VALUES (_uid, p_achievement_id)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'unlocked', true);
END;
$$;
