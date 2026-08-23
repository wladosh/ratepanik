"use client";

import { useState } from "react";
import { QUESTION_TIMER_MS } from "@/lib/game-store";

interface QuestionTimerBarProps {
  startedAt: string;
  durationMs?: number;
}

/**
 * Countdown bar synced to a server-side timestamp.
 *
 * The CSS animation is offset by a negative `animationDelay` equal to the
 * already-elapsed time so that late-joining clients see the correct position.
 * Remount via `key` when the round/block changes to reset.
 */
export function QuestionTimerBar({
  startedAt,
  durationMs = QUESTION_TIMER_MS,
}: QuestionTimerBarProps) {
  // Capture elapsed once on mount (stable across re-renders).
  // Parent should change `key` when the round resets.
  const [initialElapsed] = useState(
    () => Math.max(0, Date.now() - new Date(startedAt).getTime()),
  );

  if (initialElapsed >= durationMs) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={durationMs}
      aria-valuenow={Math.max(0, durationMs - initialElapsed)}
      aria-label="Verbleibende Zeit"
      style={{
        width: "100%",
        height: 6,
        borderRadius: "var(--rp-radius-pill)",
        background: "var(--rp-bg-muted)",
        overflow: "hidden",
        marginTop: 8,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: "var(--rp-radius-pill)",
          background: "var(--rp-peach)",
          transformOrigin: "left center",
          animation: `rp-timer-shrink ${durationMs}ms linear forwards`,
          animationDelay: `-${initialElapsed}ms`,
          willChange: "transform",
        }}
      />
    </div>
  );
}
