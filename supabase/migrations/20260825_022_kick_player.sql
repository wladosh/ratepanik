-- Host can remove another seat from the lobby (ghost QR joins, extras).

CREATE OR REPLACE FUNCTION kick_player(p_player_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _target players%ROWTYPE;
  _room rooms%ROWTYPE;
  _host_seat players%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO _target FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  SELECT * INTO _room FROM rooms WHERE id = _target.room_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'room_not_found');
  END IF;

  IF _room.status IS DISTINCT FROM 'lobby' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_lobby');
  END IF;

  IF _target.is_host OR _target.user_id IS NOT DISTINCT FROM _uid THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'cannot_kick_host');
  END IF;

  IF _room.host_user_id IS DISTINCT FROM _uid THEN
    SELECT * INTO _host_seat
    FROM players
    WHERE room_id = _room.id AND is_host AND user_id = _uid;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not_host');
    END IF;
  END IF;

  DELETE FROM answers WHERE player_id = _target.id AND room_id = _room.id;
  DELETE FROM players WHERE id = _target.id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.kick_player(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kick_player(uuid) TO authenticated;
