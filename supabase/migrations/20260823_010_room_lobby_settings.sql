-- Lobby match settings shared via rooms Realtime.
-- JSONB blob so all clients see the same host config. total_blocks stays
-- in sync from the client. Host-only writes while status = lobby.

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN rooms.settings IS
  'Host lobby config (theme mix, modes, difficulty, timer, guests). Parsed client-side with defaults.';

ALTER TABLE match_blocks
  ADD COLUMN IF NOT EXISTS timer_seconds smallint;

COMMENT ON COLUMN match_blocks.timer_seconds IS
  'Per-block timer snapshot. NULL = legacy 5s; 0 = off; 5|8|10|15 = on.';

CREATE OR REPLACE FUNCTION protect_room_lobby_settings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.settings IS DISTINCT FROM OLD.settings THEN
    IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM OLD.host_user_id THEN
      RAISE EXCEPTION 'only_host_can_change_settings';
    END IF;
    IF OLD.status IS DISTINCT FROM 'lobby' THEN
      RAISE EXCEPTION 'settings_locked_after_start';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_room_lobby_settings ON rooms;
CREATE TRIGGER trg_protect_room_lobby_settings
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION protect_room_lobby_settings();
