"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { useAchievementToast } from "@/lib/achievement-toast-context";
import type { AchievementId } from "@/lib/rp-assets";
import type { GamePhase } from "@/lib/game-context";

const SUPPORTED_ACHIEVEMENTS: AchievementId[] = [
  "first_win",
  "first_room",
  "streak_3",
];

const SAFE_PHASES: GamePhase[] = [
  "home",
  "lobby",
  "number_guess_reveal",
  "block_scoreboard",
  "final",
];

/**
 * Checks for newly unlocked achievements and fires toasts at safe moments.
 *
 * "Safe moments" per UX spec: phase transitions to home, lobby,
 * number_guess_reveal (Reveal), block_scoreboard, or final (Match-End).
 *
 * streak_3 refers to the daily play streak — NOT exact_streak_3 (Hellseher).
 */
export function useAchievementUnlockWatcher(currentPhase: GamePhase) {
  const { user, isGuest } = useAuth();
  const { enqueue } = useAchievementToast();
  const knownUnlocked = useRef<Set<string>>(new Set());
  const pendingToasts = useRef<AchievementId[]>([]);
  const initialFetched = useRef(false);

  const flushPending = useCallback(() => {
    while (pendingToasts.current.length > 0) {
      const id = pendingToasts.current.shift()!;
      enqueue(id);
    }
  }, [enqueue]);

  useEffect(() => {
    if (!user || isGuest) return;

    const supabase = createBrowserSupabase();

    async function fetchUnlocked() {
      const { data } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user!.id);

      if (!data) return;

      const currentIds = new Set(data.map((r) => r.achievement_id));

      if (initialFetched.current) {
        for (const achId of SUPPORTED_ACHIEVEMENTS) {
          if (currentIds.has(achId) && !knownUnlocked.current.has(achId)) {
            pendingToasts.current.push(achId);
          }
        }
      }

      knownUnlocked.current = currentIds;
      initialFetched.current = true;
    }

    fetchUnlocked();

    const channel = supabase
      .channel("user_achievements_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const achId = payload.new.achievement_id as string;
          if (
            SUPPORTED_ACHIEVEMENTS.includes(achId as AchievementId) &&
            !knownUnlocked.current.has(achId)
          ) {
            knownUnlocked.current.add(achId);
            pendingToasts.current.push(achId as AchievementId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isGuest]);

  useEffect(() => {
    if (SAFE_PHASES.includes(currentPhase) && pendingToasts.current.length > 0) {
      flushPending();
    }
  }, [currentPhase, flushPending]);
}
