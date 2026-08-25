"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import {
  ACHIEVEMENT_CATALOG,
  isAchievementId,
} from "@/lib/achievement-catalog";

export interface CatalogAchievement {
  id: string;
  name_de: string;
  icon_key: string;
}

export function achievementBadgeSrc(iconKey: string): string {
  return `/rp/${iconKey}_48@2x.png`;
}

export function useAchievements(userId: string | null) {
  const [extraIds, setExtraIds] = useState<string[]>([]);
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
      setExtraIds(rows.map((row) => row.id).filter((id) => !isAchievementId(id)));

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

  const catalog = useMemo<CatalogAchievement[]>(
    () => [
      ...ACHIEVEMENT_CATALOG.map((item) => ({
        id: item.id,
        name_de: item.title.de,
        icon_key: item.iconKey,
      })),
      ...extraIds.map((id) => ({
        id,
        name_de: id,
        icon_key: id,
      })),
    ],
    [extraIds],
  );

  return { catalog, extraIds, unlocked, loaded };
}
