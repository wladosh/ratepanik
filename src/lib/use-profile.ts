"use client";

import { useState, useCallback } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  xp: number;
  level: number;
  hirncoins: number;
  avatar_id: string;
  avatar_onboarding_done: boolean;
  current_streak?: number;
  friend_code?: string;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  needsUsername: boolean;
  claimUsername: (username: string) => Promise<{ ok: boolean; error?: string }>;
  checkUsername: (username: string) => Promise<{ available: boolean; error?: string | null }>;
  refetch: () => Promise<void>;
}

export function useProfile(user: User | null): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading] = useState(false);
  const supabase = createBrowserSupabase();

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const { data } = await supabase
      .from("profiles")
        .select("id, username, xp, level, hirncoins, avatar_id, avatar_onboarding_done, current_streak, friend_code, last_seen_at, created_at, updated_at")
      .eq("id", user.id)
      .single();

    setProfile(data ?? null);
  }, [user, supabase]);

  const needsUsername = !!user && !user.is_anonymous && !profile;

  const claimUsername = useCallback(
    async (username: string): Promise<{ ok: boolean; error?: string }> => {
      const res = await fetch("/api/username/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchProfile();
      }
      return data;
    },
    [fetchProfile]
  );

  const checkUsername = useCallback(
    async (username: string): Promise<{ available: boolean; error?: string | null }> => {
      const res = await fetch("/api/username/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      return res.json();
    },
    []
  );

  return {
    profile,
    loading,
    needsUsername,
    claimUsername,
    checkUsername,
    refetch: fetchProfile,
  };
}
