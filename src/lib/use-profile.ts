"use client";

import { useState, useCallback } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { loadProfile } from "@/lib/daily-play-streak";
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

    setProfile(await loadProfile(supabase, user.id));
  }, [user, supabase]);

  const needsUsername = !!user && !user.is_anonymous && !profile;

  const claimUsername = useCallback(
    async (username: string): Promise<{ ok: boolean; error?: string }> => {
      const res = await fetch("/api/username/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      let data: { ok?: boolean; error?: string };
      try {
        data = await res.json();
      } catch {
        return { ok: false, error: "Speichern fehlgeschlagen" };
      }
      if (data.ok) {
        await fetchProfile();
      }
      return { ok: data.ok === true, error: data.error };
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
