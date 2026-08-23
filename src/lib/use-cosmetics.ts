"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { STARTER_AVATAR_ID } from "@/lib/shop-catalog";

interface RpcResult {
  ok?: boolean;
  error?: string;
  hirncoins?: number;
  avatar_id?: string;
  item_id?: string;
}

export function useCosmetics(userId: string | null) {
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setOwned(new Set());
      setLoading(false);
      return;
    }
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("user_cosmetics")
      .select("item_id")
      .eq("user_id", userId);

    if (error) {
      setOwned(new Set([STARTER_AVATAR_ID]));
    } else {
      const ids = new Set((data ?? []).map((row: { item_id: string }) => row.item_id));
      ids.add(STARTER_AVATAR_ID);
      setOwned(ids);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  const buy = useCallback(
    async (itemId: string) => {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.rpc("purchase_avatar", {
        item_id: itemId,
      });
      if (error) return { ok: false as const, error: error.message };
      const result = data as RpcResult;
      if (!result?.ok) return { ok: false as const, error: result?.error ?? "Kauf fehlgeschlagen" };
      await refetch();
      return { ok: true as const, hirncoins: result.hirncoins };
    },
    [refetch]
  );

  const equip = useCallback(async (itemId: string) => {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase.rpc("equip_avatar", {
      item_id: itemId,
    });
    if (error) return { ok: false as const, error: error.message };
    const result = data as RpcResult;
    if (!result?.ok) return { ok: false as const, error: result?.error ?? "Anziehen fehlgeschlagen" };
    return { ok: true as const, avatarId: result.avatar_id ?? itemId };
  }, []);

  const ownedList = useMemo(() => [...owned], [owned]);

  return { owned, ownedList, loading, refetch, buy, equip };
}
