"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export interface CatalogAchievement {
  id: string;
  name_de: string;
  icon_key: string;
}

export function achievementBadgeSrc(iconKey: string): string {
  return `/rp/${iconKey}_48@2x.png`;
}

export function useAchievements(userId: string | null) {
  const [catalog, setCatalog] = useState<CatalogAchievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let cancelled = false;

    void (async () => {
      const catalogRes = await supabase
        .from("achievements")
        .select("id, title, icon_key")
        .eq("active", true)
        .order("title");

      if (cancelled) return;

      const rows = (catalogRes.data ?? []) as {
        id: string;
        title: string;
        icon_key: string;
      }[];
      setCatalog(
        rows.map((row) => ({
          id: row.id,
          name_de: row.title,
          icon_key: row.icon_key,
        }))
      );

      if (!userId) {
        setUnlocked(new Set());
        setLoaded(true);
        return;
      }

      const unlockedRes = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId);

      if (cancelled) return;
      setUnlocked(
        new Set((unlockedRes.data ?? []).map((r: { achievement_id: string }) => r.achievement_id))
      );
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { catalog, unlocked, loaded };
}
