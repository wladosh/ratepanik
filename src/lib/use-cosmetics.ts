"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { DbCosmeticItem, DbLootboxDef, DbUserLoadout } from "@/lib/supabase";
import {
  COSMETIC_SLOTS,
  LOOTBOX_BASIC_ID,
  LOOTBOX_BASIC_PRICE_HC,
  LOOTBOX_BASIC_WEIGHTS,
  LOOTBOX_CLOSED_PATH,
  LOOTBOX_DUPE_HC,
  LOOTBOX_OPEN_PATH,
  SCHLEIMI_ITEMS,
  STARTER_FACE_ID,
  STARTER_TINT_ID,
  cosmeticAssetPath,
  type CosmeticSlot,
} from "@/lib/schleimi-catalog";

export interface CosmeticItemView {
  id: string;
  slot: CosmeticSlot;
  rarity: DbCosmeticItem["rarity"];
  name_de: string;
  asset_path: string;
  sort_order: number;
}

export type LoadoutMap = Record<CosmeticSlot, string | null>;

export interface LootboxView {
  id: string;
  price_hc: number;
  weight_gewoehnlich: number;
  weight_selten: number;
  weight_legendaer: number;
  art_closed: string;
  art_open: string;
}

export interface OpenLootboxSuccess {
  ok: true;
  duplicate: boolean;
  item_id: string;
  slot: CosmeticSlot;
  rarity: CosmeticItemView["rarity"];
  name_de: string;
  asset_path: string;
  hirncoins: number;
  consolation_hc: number;
}

const EMPTY_LOADOUT: LoadoutMap = {
  body_tint: STARTER_TINT_ID,
  face: STARTER_FACE_ID,
  hat: null,
  extra: null,
};

function stubCatalog(): CosmeticItemView[] {
  return SCHLEIMI_ITEMS.map((item) => ({
    id: item.id,
    slot: item.slot,
    rarity: item.rarity,
    name_de: item.name_de,
    asset_path: cosmeticAssetPath(item),
    sort_order: item.sort_order,
  }));
}

function stubLootbox(): LootboxView {
  return {
    id: LOOTBOX_BASIC_ID,
    price_hc: LOOTBOX_BASIC_PRICE_HC,
    weight_gewoehnlich: LOOTBOX_BASIC_WEIGHTS.gewoehnlich,
    weight_selten: LOOTBOX_BASIC_WEIGHTS.selten,
    weight_legendaer: LOOTBOX_BASIC_WEIGHTS.legendaer,
    art_closed: LOOTBOX_CLOSED_PATH,
    art_open: LOOTBOX_OPEN_PATH,
  };
}

function emptyLoadoutFromRows(rows: DbUserLoadout[] | null): LoadoutMap {
  const next: LoadoutMap = { ...EMPTY_LOADOUT };
  for (const slot of COSMETIC_SLOTS) {
    const row = rows?.find((entry) => entry.slot === slot);
    if (row) next[slot] = row.item_id;
  }
  return next;
}

export function useCosmetics(userId: string | null) {
  const [catalog, setCatalog] = useState<CosmeticItemView[]>(stubCatalog);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loadout, setLoadout] = useState<LoadoutMap>(EMPTY_LOADOUT);
  const [lootbox, setLootbox] = useState<LootboxView>(stubLootbox);
  const [loading, setLoading] = useState(true);

  const catalogById = useMemo(() => {
    return new Map(catalog.map((item) => [item.id, item]));
  }, [catalog]);

  const refetch = useCallback(async () => {
    if (!userId) {
      setOwned(new Set());
      setLoadout(EMPTY_LOADOUT);
      setLoading(false);
      return;
    }
    const supabase = createBrowserSupabase();
    const [itemsRes, ownedRes, loadoutRes, boxRes] = await Promise.all([
      supabase
        .from("cosmetic_items")
        .select("id, slot, rarity, name_de, asset_path, sort_order, active")
        .eq("active", true)
        .order("sort_order"),
      supabase.from("user_cosmetics").select("item_id").eq("user_id", userId),
      supabase.from("user_loadout").select("slot, item_id").eq("user_id", userId),
      supabase.from("lootbox_defs").select("*").eq("id", LOOTBOX_BASIC_ID).maybeSingle(),
    ]);

    if (itemsRes.data && itemsRes.data.length > 0) {
      setCatalog(
        (itemsRes.data as DbCosmeticItem[]).map((row) => ({
          id: row.id,
          slot: row.slot,
          rarity: row.rarity,
          name_de: row.name_de,
          asset_path: row.asset_path,
          sort_order: row.sort_order,
        })),
      );
    }

    const ids = new Set((ownedRes.data ?? []).map((row: { item_id: string }) => row.item_id));
    ids.add(STARTER_TINT_ID);
    ids.add(STARTER_FACE_ID);
    setOwned(ids);

    setLoadout(emptyLoadoutFromRows((loadoutRes.data as DbUserLoadout[] | null) ?? null));

    if (boxRes.data) {
      const row = boxRes.data as DbLootboxDef;
      setLootbox({
        id: row.id,
        price_hc: row.price_hc,
        weight_gewoehnlich: row.weight_gewoehnlich,
        weight_selten: row.weight_selten,
        weight_legendaer: row.weight_legendaer,
        art_closed: row.art_closed,
        art_open: row.art_open,
      });
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  const openLootbox = useCallback(
    async (requestId: string) => {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.rpc("open_lootbox", {
        box_id: LOOTBOX_BASIC_ID,
        request_id: requestId,
      });
      if (error) return { ok: false as const, error: error.message };
      const result = data as OpenLootboxSuccess | { ok?: boolean; error?: string };
      if (!result || result.ok !== true) {
        return { ok: false as const, error: result?.error ?? "Öffnen fehlgeschlagen" };
      }
      await refetch();
      return result as OpenLootboxSuccess;
    },
    [refetch],
  );

  const equipSlot = useCallback(
    async (slot: CosmeticSlot, itemId: string | null) => {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.rpc("equip_slot", {
        p_slot: slot,
        p_item_id: itemId,
      });
      if (error) return { ok: false as const, error: error.message };
      const result = data as { ok?: boolean; error?: string; item_id?: string | null };
      if (!result?.ok) return { ok: false as const, error: result?.error ?? "Anziehen fehlgeschlagen" };
      setLoadout((prev) => ({ ...prev, [slot]: result.item_id ?? null }));
      return { ok: true as const, itemId: result.item_id ?? null };
    },
    [],
  );

  const equippedItems = useMemo(() => {
    const layers: Partial<Record<CosmeticSlot, CosmeticItemView | null>> = {};
    for (const slot of COSMETIC_SLOTS) {
      const id = loadout[slot];
      layers[slot] = id ? catalogById.get(id) ?? null : null;
    }
    return layers;
  }, [loadout, catalogById]);

  return {
    catalog,
    catalogById,
    owned,
    loadout,
    equippedItems,
    lootbox,
    loading,
    refetch,
    openLootbox,
    equipSlot,
    dupeHc: LOOTBOX_DUPE_HC,
  };
}
