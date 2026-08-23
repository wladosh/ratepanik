-- Surgical RLS: tighten players DELETE, unique pick_correct_turns, lock older RPCs.
-- Additive. Does not rewrite match_blocks USING (true) policies.

-- ============================================================
-- 1. Replace open players DELETE (and split ALL so DELETE is not USING true)
-- ============================================================
DROP POLICY IF EXISTS "players_delete" ON players;
DROP POLICY IF EXISTS players_delete ON players;
DROP POLICY IF EXISTS "players_public_all" ON players;
DROP POLICY IF EXISTS players_public_all ON players;

CREATE POLICY "players_select" ON players
  FOR SELECT USING (true);

CREATE POLICY "players_insert" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "players_update" ON players
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "players_delete" ON players
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = players.room_id
        AND rooms.host_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM rooms
      JOIN players AS host_seat ON host_seat.room_id = rooms.id
      WHERE rooms.id = players.room_id
        AND rooms.host_user_id IS NULL
        AND host_seat.is_host
        AND host_seat.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. Unique taps / turn order on pick_correct_turns
-- ============================================================
DELETE FROM pick_correct_turns a
USING pick_correct_turns b
WHERE a.room_id = b.room_id
  AND a.block_index = b.block_index
  AND a.card_index = b.card_index
  AND a.id > b.id;

DELETE FROM pick_correct_turns a
USING pick_correct_turns b
WHERE a.room_id = b.room_id
  AND a.block_index = b.block_index
  AND a.turn_order = b.turn_order
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pct_room_block_card
  ON pick_correct_turns (room_id, block_index, card_index);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pct_room_block_turn
  ON pick_correct_turns (room_id, block_index, turn_order);

-- ============================================================
-- 3. claim_username: reject anonymous sessions
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
  _is_anon boolean;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  SELECT COALESCE(is_anonymous, false)
    OR COALESCE(raw_app_meta_data->>'provider', '') = 'anonymous'
  INTO _is_anon
  FROM auth.users WHERE id = _uid;

  IF COALESCE(_is_anon, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Als Gast nicht möglich');
  END IF;

  _trimmed := trim(desired_username);

  IF char_length(_trimmed) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Name zu kurz (min. 3 Zeichen)');
  END IF;

  IF char_length(_trimmed) > 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Name zu lang (max. 20 Zeichen)');
  END IF;

  SELECT id INTO _existing_id
    FROM profiles
    WHERE lower(username) = lower(_trimmed)
      AND id != _uid
    LIMIT 1;

  IF _existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Name bereits vergeben');
  END IF;

  INSERT INTO profiles (id, username, updated_at)
    VALUES (_uid, _trimmed, now())
    ON CONFLICT (id) DO UPDATE
      SET username = EXCLUDED.username,
          updated_at = now();

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================
-- 4. GRANT lockdown for older SECURITY DEFINER RPCs
-- ============================================================
REVOKE ALL ON FUNCTION public.claim_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_username(text) TO authenticated;

REVOKE ALL ON FUNCTION public.check_username_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;

-- ============================================================
-- 5. Host leave: promote oldest remaining player, or finish the room
-- ============================================================
CREATE OR REPLACE FUNCTION leave_match(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _player players%ROWTYPE;
  _next players%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO _player
  FROM players
  WHERE room_id = p_room_id AND user_id = _uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_a_player');
  END IF;

  IF _player.is_host THEN
    SELECT * INTO _next
    FROM players
    WHERE room_id = p_room_id AND id <> _player.id
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND THEN
      UPDATE players SET is_host = true WHERE id = _next.id;
      UPDATE rooms
      SET host_user_id = _next.user_id, updated_at = now()
      WHERE id = p_room_id;
    ELSE
      UPDATE rooms
      SET status = 'finished', updated_at = now()
      WHERE id = p_room_id;
    END IF;
  END IF;

  DELETE FROM answers WHERE player_id = _player.id AND room_id = p_room_id;
  DELETE FROM players WHERE id = _player.id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.leave_match(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_match(uuid) TO authenticated, anon;

REVOKE ALL ON FUNCTION public.update_own_profile(text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_profile(text, text, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.record_daily_play() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_daily_play() TO authenticated;

REVOKE ALL ON FUNCTION public.try_unlock_achievement(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_unlock_achievement(text) TO authenticated;
