-- Migration: Allow authenticated users to insert their own match rewards.
-- The original Phase B migration omitted an INSERT policy, causing the
-- client-side reward grant (final-screen.tsx) to silently fail under RLS.

CREATE POLICY "match_rewards_insert_own" ON match_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
