-- kick_player: host removes a seated player while the room is still in lobby.
-- Only the room host can call this. Rejects if the match has started,
-- if the caller tries to kick themselves, or if the target is not in the room.

CREATE OR REPLACE FUNCTION kick_player(p_room_id uuid, p_player_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _room rooms%ROWTYPE;
  _target players%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO _room FROM rooms WHERE id = p_room_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'room_not_found');
  END IF;

  IF _room.host_user_id IS DISTINCT FROM _uid THEN
    IF NOT EXISTS (
      SELECT 1 FROM players
      WHERE room_id = p_room_id AND user_id = _uid AND is_host
    ) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not_host');
    END IF;
  END IF;

  IF _room.status <> 'lobby' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'match_already_started');
  END IF;

  SELECT * INTO _target FROM players WHERE id = p_player_id AND room_id = p_room_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'player_not_found');
  END IF;

  IF _target.user_id = _uid THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'cannot_kick_self');
  END IF;

  IF _target.is_host THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'cannot_kick_host');
  END IF;

  DELETE FROM answers WHERE player_id = _target.id AND room_id = p_room_id;
  DELETE FROM players WHERE id = _target.id;

  RETURN jsonb_build_object('ok', true, 'kicked_name', _target.display_name);
END;
$$;

REVOKE ALL ON FUNCTION public.kick_player(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kick_player(uuid, uuid) TO authenticated, anon;
