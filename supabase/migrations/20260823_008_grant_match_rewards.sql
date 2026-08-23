-- Match-end economy lock.
-- grant_match_rewards is the only path that may insert match_rewards
-- or change profiles.xp / level / hirncoins.

-- ============================================================
-- 1. Protect economy columns unless RPC sets a local GUC
-- ============================================================
CREATE OR REPLACE FUNCTION profiles_protect_economy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND current_setting('ratepanik.grant_economy', true) IS DISTINCT FROM '1'
  THEN
    NEW.xp := OLD.xp;
    NEW.level := OLD.level;
    NEW.hirncoins := OLD.hirncoins;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_economy ON profiles;
CREATE TRIGGER trg_profiles_protect_economy
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_protect_economy();

REVOKE ALL ON FUNCTION public.profiles_protect_economy() FROM PUBLIC;

-- ============================================================
-- 2. No client INSERT on match_rewards
-- ============================================================
DROP POLICY IF EXISTS "match_rewards_insert_own" ON match_rewards;
DROP POLICY IF EXISTS match_rewards_insert_own ON match_rewards;
DROP POLICY IF EXISTS "match_rewards_insert_own" ON match_rewards;
DROP POLICY IF EXISTS match_rewards_insert_own ON match_rewards;

-- ============================================================
-- 3. SECURITY DEFINER RPC
-- Formula matches src/lib/match-rewards.ts calculateMatchRewards
-- ============================================================
CREATE OR REPLACE FUNCTION grant_match_rewards(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_anon boolean;
  _room_status text;
  _my_score integer;
  _placement integer;
  _correct integer;
  _xp integer;
  _coins integer;
  _existing match_rewards%ROWTYPE;
  _reward_id uuid;
  _old_xp integer;
  _old_coins integer;
  _new_xp integer;
  _new_coins integer;
  _new_level integer;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  SELECT COALESCE(is_anonymous, false)
    OR COALESCE(raw_app_meta_data->>'provider', '') = 'anonymous'
  INTO _is_anon
  FROM auth.users WHERE id = _uid;

  IF COALESCE(_is_anon, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'guest');
  END IF;

  SELECT p.score INTO _my_score
  FROM players p
  WHERE p.room_id = p_room_id AND p.user_id = _uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_a_player');
  END IF;

  SELECT r.status INTO _room_status
  FROM rooms r WHERE r.id = p_room_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'room_not_found');
  END IF;

  IF _room_status IS DISTINCT FROM 'finished' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'room_not_finished');
  END IF;

  SELECT xp, hirncoins INTO _old_xp, _old_coins
  FROM profiles
  WHERE id = _uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'profile_not_found');
  END IF;

  SELECT * INTO _existing
  FROM match_rewards
  WHERE room_id = p_room_id AND user_id = _uid;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already', true,
      'placement', _existing.placement,
      'xp_awarded', _existing.xp_awarded,
      'hirncoins_awarded', _existing.hirncoins_awarded
    );
  END IF;

  SELECT rnk INTO _placement
  FROM (
    SELECT user_id, RANK() OVER (ORDER BY score DESC NULLS LAST) AS rnk
    FROM players
    WHERE room_id = p_room_id
  ) ranked
  WHERE user_id = _uid;

  _correct := CASE
    WHEN COALESCE(_my_score, 0) > 0
      THEN GREATEST(0, ROUND(_my_score::numeric / 25))::integer
    ELSE 0
  END;

  _xp := 50
    + CASE _placement
        WHEN 1 THEN 40
        WHEN 2 THEN 20
        WHEN 3 THEN 10
        ELSE 0
      END
    + _correct * 5;

  _coins := 20
    + CASE _placement
        WHEN 1 THEN 20
        WHEN 2 THEN 10
        WHEN 3 THEN 5
        ELSE 0
      END;

  PERFORM set_config('ratepanik.grant_economy', '1', true);

  INSERT INTO match_rewards (room_id, user_id, placement, xp_awarded, hirncoins_awarded)
  VALUES (p_room_id, _uid, _placement, _xp, _coins)
  ON CONFLICT (room_id, user_id) DO NOTHING
  RETURNING id INTO _reward_id;

  IF _reward_id IS NULL THEN
    SELECT * INTO _existing
    FROM match_rewards
    WHERE room_id = p_room_id AND user_id = _uid;

    RETURN jsonb_build_object(
      'ok', true,
      'already', true,
      'placement', _existing.placement,
      'xp_awarded', _existing.xp_awarded,
      'hirncoins_awarded', _existing.hirncoins_awarded
    );
  END IF;

  _new_xp := COALESCE(_old_xp, 0) + _xp;
  _new_coins := COALESCE(_old_coins, 0) + _coins;

  IF _new_xp <= 0 THEN
    _new_level := 1;
  ELSE
    _new_level := FLOOR((-1 + SQRT(1 + 4 * (_new_xp::numeric / 25 + 2))) / 2)::integer;
    IF (25 * _new_level * (_new_level + 3)) <= _new_xp THEN
      _new_level := _new_level + 1;
    END IF;
    _new_level := GREATEST(1, _new_level);
  END IF;

  UPDATE profiles
  SET
    xp = _new_xp,
    level = _new_level,
    hirncoins = _new_coins,
    updated_at = now()
  WHERE id = _uid;

  RETURN jsonb_build_object(
    'ok', true,
    'already', false,
    'placement', _placement,
    'xp_awarded', _xp,
    'hirncoins_awarded', _coins
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_match_rewards(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_match_rewards(uuid) TO authenticated;
