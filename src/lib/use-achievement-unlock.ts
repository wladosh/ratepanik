"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { useAchievementToast } from "@/lib/achievement-toast-context";
import { isAchievementId, type AchievementId } from "@/lib/achievement-catalog";
import type { GamePhase } from "@/lib/game-context";

const SAFE_PHASES: GamePhase[] = [
  "home",
  "lobby",
  "number_guess_reveal",
  "find_lie_reveal",
  "order_it_reveal",
  "block_scoreboard",
  "final",
];

/**
 * Checks for newly unlocked achievements and fires toasts at safe moments.
 *
 * "Safe moments" per UX spec: phase transitions to home, lobby,
 * number_guess_reveal (Reveal), block_scoreboard, or final (Match-End).
 *
 * Flush happens:
 *  1. On phase change into a safe phase (primary)
 *  2. Immediately after enqueue if already in a safe phase (prevents stuck pending)
 *
 * streak_3 refers to the daily play streak — NOT exact_streak_3 (Hellseher).
 */
export function useAchievementUnlockWatcher(currentPhase: GamePhase) {
  const { user, isGuest } = useAuth();
  const { enqueue } = useAchievementToast();
  const knownUnlocked = useRef<Set<string>>(new Set());
  const pendingToasts = useRef<AchievementId[]>([]);
  const initialFetched = useRef(false);
  const phaseRef = useRef(currentPhase);

  useEffect(() => {
    phaseRef.current = currentPhase;
  });

  const flushPending = useCallback(() => {
    while (pendingToasts.current.length > 0) {
      const id = pendingToasts.current.shift()!;
      enqueue(id);
    }
  }, [enqueue]);

  const pushAndMaybeFlush = useCallback(
    (achId: AchievementId) => {
      pendingToasts.current.push(achId);
      if (SAFE_PHASES.includes(phaseRef.current)) {
        flushPending();
      }
    },
    [flushPending]
  );

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
        for (const achId of currentIds) {
          if (isAchievementId(achId) && !knownUnlocked.current.has(achId)) {
            pushAndMaybeFlush(achId);
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
          if (isAchievementId(achId) && !knownUnlocked.current.has(achId)) {
            knownUnlocked.current.add(achId);
            pushAndMaybeFlush(achId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isGuest, pushAndMaybeFlush]);

  // Flush on phase transition into a safe phase
  useEffect(() => {
    if (SAFE_PHASES.includes(currentPhase) && pendingToasts.current.length > 0) {
      flushPending();
    }
  }, [currentPhase, flushPending]);
}
