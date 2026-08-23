"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

/**
 * Games/wins are not columns on profiles — derive from match_rewards.
 * A win is placement = 1 (including shared first).
 */
export function useMatchStats(userId: string | null) {
  const [games, setGames] = useState<number | null>(null);
  const [wins, setWins] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) {
      setGames(null);
      setWins(null);
      return;
    }

    const supabase = createBrowserSupabase();
    let cancelled = false;

    void (async () => {
      const [gamesRes, winsRes] = await Promise.all([
        supabase
          .from("match_rewards")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("match_rewards")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("placement", 1),
      ]);
      if (cancelled) return;
      setGames(gamesRes.count ?? 0);
      setWins(winsRes.count ?? 0);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { games, wins };
}
