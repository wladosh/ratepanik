"use client";

import { useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { parseDailyPlayRpc } from "@/lib/daily-play-streak";
import type { AchievementId } from "@/lib/rp-assets";

/**
 * Calls SECURITY DEFINER RPCs to validate + grant achievements.
 * All logic runs server-side in Postgres; the client just triggers.
 * Guests are rejected by the RPC (no-op here for safety too).
 */
export function useAchievementGrant() {
  const { user, isGuest, refetchProfile } = useAuth();
  const inflight = useRef<Set<string>>(new Set());

  const tryUnlock = useCallback(
    async (achievementId: AchievementId) => {
      if (!user || isGuest) return;
      if (inflight.current.has(achievementId)) return;
      inflight.current.add(achievementId);

      try {
        const supabase = createBrowserSupabase();
        const { error } = await supabase.rpc("try_unlock_achievement", {
          p_achievement_id: achievementId,
        });
        if (error) {
          console.warn(`Achievement unlock failed (${achievementId}):`, error.message);
        }
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
      const { data, error } = await supabase.rpc("record_daily_play");
      if (error) {
        console.warn("record_daily_play failed:", error.message);
        return;
      }
      const parsed = parseDailyPlayRpc(data);
      const profileRow = await refetchProfile();
      const streak = parsed.streak ?? profileRow?.current_streak ?? null;
      if (parsed.ok && streak != null && streak >= 3) {
        await tryUnlock("streak_3");
      }
    } catch (err) {
      console.warn("record_daily_play failed:", err);
    }
  }, [user, isGuest, tryUnlock, refetchProfile]);

  return { tryUnlock, recordDailyPlay };
}
