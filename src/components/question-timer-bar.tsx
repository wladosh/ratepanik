"use client";

import type { CSSProperties } from "react";
import { QUESTION_TIMER_MS } from "@/lib/game-store";
import styles from "./match-play-foundation.module.css";
import { useSharedCountdown } from "./use-shared-countdown";

type TimerFillStyle = CSSProperties & {
  "--timer-progress": number;
};

export interface QuestionTimerBarProps {
  /** Server-driven deadline (epoch ms) — identical for every client. */
  deadlineMs: number;
  durationMs?: number;
  ariaLabel?: string;
  className?: string;
}

/**
 * Countdown bar synced to a shared server-driven deadline.
 *
 * Every client computes the same `deadlineMs` from the DB-synced
 * `match_blocks.started_at` + `QUESTION_TIMER_MS`, so the bar position
 * is consistent across the room — no independent local clocks.
 *
 * The fill is always derived from the absolute deadline, so delayed browser
 * timers and late joins cannot drift from the room's shared clock.
 */
export function QuestionTimerBar({
  deadlineMs,
  durationMs = QUESTION_TIMER_MS,
  ariaLabel = "Verbleibende Antwortzeit",
  className,
}: QuestionTimerBarProps) {
  const countdown = useSharedCountdown(deadlineMs, durationMs);

  if (countdown.expired) return null;

  const urgent = countdown.progress <= 0.2;
  return (
    <div
      className={[styles.timerTrack, className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={durationMs}
      aria-valuenow={Math.round(countdown.remainingMs)}
      aria-valuetext={`${countdown.remainingSeconds} Sekunden verbleibend`}
      aria-label={ariaLabel}
    >
      <div
        className={[
          styles.timerFill,
          urgent ? styles.timerFillUrgent : null,
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          { "--timer-progress": countdown.progress } as TimerFillStyle
        }
        aria-hidden="true"
      />
    </div>
  );
}
