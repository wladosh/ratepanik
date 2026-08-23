"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { DbPlayer } from "@/lib/supabase";
import {
  guestLayers,
  layersFromLoadoutRows,
  type SchleimiLayerMap,
} from "@/lib/schleimi-layers";

type LoadoutRow = { user_id: string; slot: string; item_id: string | null };

export function useRoomLoadouts(players: readonly DbPlayer[]) {
  const [rows, setRows] = useState<LoadoutRow[]>([]);

  const userIds = useMemo(() => {
    return [...new Set(players.map((p) => p.user_id).filter((id): id is string => Boolean(id)))].sort();
  }, [players]);

  const refetch = useCallback(async () => {
    if (userIds.length === 0) {
      setRows([]);
      return;
    }
    const supabase = createBrowserSupabase();
    const { data } = await supabase
      .from("user_loadout")
      .select("user_id, slot, item_id")
      .in("user_id", userIds);
    setRows((data as LoadoutRow[] | null) ?? []);
  }, [userIds]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const getPlayerLayers = useCallback(
    (playerId: string): SchleimiLayerMap => {
      const player = players.find((p) => p.id === playerId);
      if (!player?.user_id) return guestLayers(playerId);
      const owned = rows.filter((row) => row.user_id === player.user_id);
      if (owned.length === 0) return guestLayers(player.user_id);
      return layersFromLoadoutRows(owned);
    },
    [players, rows],
  );

  return { getPlayerLayers, refetch };
}

export function useUserLoadoutLayers(userId: string | null, seed: string) {
  const [layers, setLayers] = useState<SchleimiLayerMap>(() => guestLayers(seed));

  useEffect(() => {
    if (!userId) {
      setLayers(guestLayers(seed));
      return;
    }
    const supabase = createBrowserSupabase();
    let cancelled = false;
    void supabase
      .from("user_loadout")
      .select("slot, item_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (cancelled) return;
        const list = data ?? [];
        setLayers(list.length === 0 ? guestLayers(seed) : layersFromLoadoutRows(list));
      });
    return () => {
      cancelled = true;
    };
  }, [seed, userId]);

  return layers;
}
