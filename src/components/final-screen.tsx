"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { calculateMatchRewards, type MatchRewardResult } from "@/lib/match-rewards";
import { levelFromXp } from "@/lib/progression";
import { MatchEndRewardsScreen, BriefScoreboard } from "./match-end-rewards";

type FinalStep = "scoreboard" | "rewards";

const SCOREBOARD_AUTO_MS = 3500;

export function FinalScreen() {
  const game = useGame();
  const { user, isGuest, profile, refetchProfile } = useAuth();
  const [rewards, setRewards] = useState<MatchRewardResult | null>(null);
  const [previousXp, setPreviousXp] = useState(0);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [ready, setReady] = useState(() => !!(isGuest || !user));
  const [step, setStep] = useState<FinalStep>("scoreboard");
  const grantedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const myPlayer = sortedPlayers.find((p) => p.id === game.myPlayerId);
  const placement = myPlayer ? sortedPlayers.indexOf(myPlayer) + 1 : sortedPlayers.length;

  const roomId = game.room?.id;
  const userId = user?.id;
  const profileXp = profile?.xp ?? 0;
  const profileLevel = profile?.level ?? 1;
  const profileHirncoins = profile?.hirncoins ?? 0;
  const myScore = myPlayer?.score ?? 0;
  const playerCount = game.players.length;

  const grantRewards = useCallback(async () => {
    if (!roomId || !userId) return;

    const correctAnswerCount = playerCount > 0 && myScore > 0
      ? Math.max(0, Math.round(myScore / 25))
      : 0;

    const result = calculateMatchRewards(placement, correctAnswerCount);

    setPreviousXp(profileXp);
    setPreviousLevel(profileLevel);
    setRewards(result);

    try {
      const { data: existing } = await supabase
        .from("match_rewards")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("match_rewards").insert({
          room_id: roomId,
          user_id: userId,
          placement,
          xp_awarded: result.xpAwarded,
          hirncoins_awarded: result.hirncoinsAwarded,
        });

        const newXp = profileXp + result.xpAwarded;
        const newHirncoins = profileHirncoins + result.hirncoinsAwarded;
        const newLevel = levelFromXp(newXp);

        await supabase
          .from("profiles")
          .update({
            xp: newXp,
            level: newLevel,
            hirncoins: newHirncoins,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        await refetchProfile();
      } else {
        const { data: existingReward } = await supabase
          .from("match_rewards")
          .select("xp_awarded, hirncoins_awarded, placement")
          .eq("room_id", roomId)
          .eq("user_id", userId)
          .single();

        if (existingReward) {
          setRewards({
            placement: existingReward.placement,
            xpAwarded: existingReward.xp_awarded,
            hirncoinsAwarded: existingReward.hirncoins_awarded,
          });
        }
      }
    } catch (err) {
      console.error("Failed to grant match rewards:", err);
    } finally {
      setReady(true);
    }
  }, [roomId, userId, placement, profileXp, profileLevel, profileHirncoins, myScore, playerCount, refetchProfile]);

  useEffect(() => {
    if (grantedRef.current || !roomId || !userId || isGuest) return;
    grantedRef.current = true;
    void grantRewards();
  }, [roomId, userId, isGuest, grantRewards]);

  // Auto-advance from scoreboard to rewards after a brief pause
  useEffect(() => {
    if (step !== "scoreboard" || !ready) return;
    timerRef.current = setTimeout(() => setStep("rewards"), SCOREBOARD_AUTO_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [step, ready]);

  const handleScoreboardContinue = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep("rewards");
  }, []);

  // Guests skip straight to GuestEndScreen (which has its own scoreboard)
  if (isGuest) {
    return (
      <MatchEndRewardsScreen
        rewards={null}
        previousXp={0}
        previousLevel={1}
      />
    );
  }

  if (step === "scoreboard") {
    return <BriefScoreboard onContinue={handleScoreboardContinue} />;
  }

  if (!ready) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "var(--rp-bg-hero)" }}
      >
        <div className="text-lg animate-pulse font-medium" style={{ color: "var(--rp-text-secondary)" }}>
          Belohnungen werden berechnet…
        </div>
      </div>
    );
  }

  return (
    <MatchEndRewardsScreen
      rewards={rewards}
      previousXp={previousXp}
      previousLevel={previousLevel}
    />
  );
}
