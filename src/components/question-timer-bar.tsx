"use client";

import { useState } from "react";
import { QUESTION_TIMER_MS } from "@/lib/game-store";

interface QuestionTimerBarProps {
  /** Server-driven deadline (epoch ms) — identical for every client. */
  deadlineMs: number;
  durationMs?: number;
}

/**
 * Countdown bar synced to a shared server-driven deadline.
 *
 * Every client computes the same `deadlineMs` from the DB-synced
 * `match_blocks.started_at` + `QUESTION_TIMER_MS`, so the bar position
 * is consistent across the room — no independent local clocks.
 *
 * The CSS animation uses a negative `animationDelay` equal to already-elapsed
 * time so late-joining clients see the correct fill width instantly.
 * Remount via `key` when the round/block changes to reset.
 */
export function QuestionTimerBar({
  deadlineMs,
  durationMs = QUESTION_TIMER_MS,
}: QuestionTimerBarProps) {
  // Capture remaining time once on mount — stable across re-renders.
  // Parent should change `key` when the round resets.
  const [initialRemaining] = useState(() =>
    Math.max(0, deadlineMs - Date.now()),
  );

  if (initialRemaining <= 0) return null;

  const elapsed = durationMs - initialRemaining;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={durationMs}
      aria-valuenow={Math.round(initialRemaining)}
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
          animationDelay: `-${elapsed}ms`,
          willChange: "transform",
        }}
      />
    </div>
  );
}
