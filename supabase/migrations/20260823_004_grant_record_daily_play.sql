-- Ensure authenticated clients can call the daily-play streak RPC
-- (same counter as streak_3). Idempotent if already granted.

DO $$
BEGIN
  IF to_regprocedure('public.record_daily_play()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.record_daily_play() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.record_daily_play() TO authenticated;
  END IF;
END $$;
