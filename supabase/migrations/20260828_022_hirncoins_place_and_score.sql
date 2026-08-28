-- Hirncoins from place + score, scaled by scheduled match length.
-- Must stay in lockstep with src/lib/match-rewards.ts.
-- Live Ratepanik DB already has this formula (20260825110612_hirncoins_place_and_score).

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
  _settings jsonb;
  _my_score integer;
  _placement integer;
  _correct integer;
  _xp integer;
  _coins integer;
  _slots integer;
  _minutes integer;
  _place_hc integer;
  _perf numeric;
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

  SELECT r.status, r.settings INTO _room_status, _settings
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

  _slots := GREATEST(1, LEAST(24,
    COALESCE(NULLIF(_settings->>'blocks', '')::int, 5)
    * COALESCE(NULLIF(_settings->>'questionsPerBlock', '')::int, 3)
  ));

  _minutes := CASE
    WHEN _slots >= 16 THEN 15
    WHEN _slots <= 6 THEN 5
    ELSE 10
  END;

  _place_hc := CASE _placement
    WHEN 1 THEN 16
    WHEN 2 THEN 9
    WHEN 3 THEN 4
    ELSE 0
  END;

  _perf := 24 * LEAST(
    1::numeric,
    GREATEST(
      0::numeric,
      COALESCE(_my_score, 0)::numeric / (_slots * 250)
    )
  );

  _coins := ROUND((_minutes::numeric / 10) * (40 + _place_hc + _perf))::integer;

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
