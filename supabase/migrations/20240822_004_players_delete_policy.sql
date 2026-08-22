-- Migration: Allow DELETE on players table (B9 – Leave cleanup)
-- Required so that leaveRoom can delete the player row and
-- Realtime broadcasts the DELETE event to remaining clients.
--
-- REPLICA IDENTITY FULL is needed so that Supabase Realtime can
-- filter DELETE events by room_id (non-PK column) and include
-- the full old row in the payload for the client to identify
-- which player left.

DO $$ BEGIN
  DROP POLICY IF EXISTS "players_delete" ON players;
EXCEPTION WHEN undefined_object THEN null;
END $$;

CREATE POLICY "players_delete" ON players
  FOR DELETE USING (true);

ALTER TABLE players REPLICA IDENTITY FULL;
