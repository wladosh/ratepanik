"use client";

import { useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { AchievementId } from "@/lib/rp-assets";

/**
 * Calls SECURITY DEFINER RPCs to validate + grant achievements.
 * All logic runs server-side in Postgres; the client just triggers.
 * Guests are rejected by the RPC (no-op here for safety too).
 */
export function useAchievementGrant() {
  const { user, isGuest } = useAuth();
  const inflight = useRef<Set<string>>(new Set());

  const tryUnlock = useCallback(
    async (achievementId: AchievementId) => {
      if (!user || isGuest) return;
      if (inflight.current.has(achievementId)) return;
      inflight.current.add(achievementId);

      try {
        const supabase = createBrowserSupabase();
        await supabase.rpc("try_unlock_achievement", {
          p_achievement_id: achievementId,
        });
      } catch (err) {
        console.warn(`Achievement unlock failed (${achievementId}):`, err);
      } finally {
        inflight.current.delete(achievementId);
      }
    },
    [user, isGuest],
  );

  const recordDailyPlay = useCallback(async () => {
    if (!user || isGuest) return;

    try {
      const supabase = createBrowserSupabase();
      const { data } = await supabase.rpc("record_daily_play");
      if (data?.ok && data.streak >= 3) {
        await tryUnlock("streak_3");
      }
    } catch (err) {
      console.warn("record_daily_play failed:", err);
    }
  }, [user, isGuest, tryUnlock]);

  return { tryUnlock, recordDailyPlay };
}
