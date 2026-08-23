"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { DbFriendProfile, DbFriendship } from "@/lib/supabase";
import { friendErrorCopy } from "@/lib/match-ui";

const PROFILE_EMBED =
  "id, username, avatar_id, last_seen_at, friend_code";

type FriendshipRow = DbFriendship & {
  requester: DbFriendProfile | DbFriendProfile[] | null;
  addressee: DbFriendProfile | DbFriendProfile[] | null;
};

export interface FriendEntry {
  friendshipId: string;
  profile: DbFriendProfile;
}

interface RpcResult {
  ok?: boolean;
  error?: string;
  accepted?: boolean;
  friend_code?: string;
}

interface UseFriendsReturn {
  loading: boolean;
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
  friends: FriendEntry[];
  addFriend: (identifier: string) => Promise<{ ok: boolean; error?: string }>;
  respond: (id: string, accept: boolean) => Promise<{ ok: boolean; error?: string }>;
  remove: (id: string) => Promise<{ ok: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

function otherProfile(row: FriendshipRow, myId: string): DbFriendProfile | null {
  const raw = row.requester_id === myId ? row.addressee : row.requester;
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

export function useFriends(userId: string | null): UseFriendsReturn {
  const [rows, setRows] = useState<FriendshipRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }

    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("friendships")
      .select(
        `id, requester_id, addressee_id, status, created_at, updated_at, requester:profiles!requester_id(${PROFILE_EMBED}), addressee:profiles!addressee_id(${PROFILE_EMBED})`
      )
      .order("created_at", { ascending: false });

    if (error) {
      setRows([]);
    } else {
      setRows((data as unknown as FriendshipRow[]) ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void refetch();
  }, [refetch]);

  const { incoming, outgoing, friends } = useMemo(() => {
    const incoming: FriendEntry[] = [];
    const outgoing: FriendEntry[] = [];
    const friends: FriendEntry[] = [];
    if (!userId) return { incoming, outgoing, friends };

    for (const row of rows) {
      const profile = otherProfile(row, userId);
      if (!profile) continue;
      const entry: FriendEntry = { friendshipId: row.id, profile };
      if (row.status === "accepted") {
        friends.push(entry);
      } else if (row.addressee_id === userId) {
        incoming.push(entry);
      } else {
        outgoing.push(entry);
      }
    }
    return { incoming, outgoing, friends };
  }, [rows, userId]);

  const addFriend = useCallback(
    async (identifier: string) => {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.rpc("request_friend", {
        identifier: identifier.trim(),
      });
      if (error) return { ok: false, error: friendErrorCopy(error.message, "de") };
      const result = data as RpcResult;
      if (!result?.ok) return { ok: false, error: friendErrorCopy(result?.error ?? "Fehler", "de") };
      await refetch();
      return { ok: true };
    },
    [refetch]
  );

  const respond = useCallback(
    async (id: string, accept: boolean) => {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.rpc("respond_friend", {
        friendship_id: id,
        accept,
      });
      if (error) return { ok: false, error: friendErrorCopy(error.message, "de") };
      const result = data as RpcResult;
      if (!result?.ok) return { ok: false, error: friendErrorCopy(result?.error ?? "Fehler", "de") };
      await refetch();
      return { ok: true };
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.rpc("remove_friend", {
        friendship_id: id,
      });
      if (error) return { ok: false, error: friendErrorCopy(error.message, "de") };
      const result = data as RpcResult;
      if (!result?.ok) return { ok: false, error: friendErrorCopy(result?.error ?? "Fehler", "de") };
      await refetch();
      return { ok: true };
    },
    [refetch]
  );

  return { loading, incoming, outgoing, friends, addFriend, respond, remove, refetch };
}
