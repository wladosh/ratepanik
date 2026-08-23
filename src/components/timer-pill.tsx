"use client";

import styles from "./match-play-foundation.module.css";
import { useSharedCountdown } from "./use-shared-countdown";

export interface TimerPillProps {
  timerSeconds?: number | null;
  startedAt?: string | null;
  /** Prefer this absolute server-derived deadline when already available. */
  deadlineMs?: number | null;
  ariaLabel?: string;
  urgentAtSeconds?: number;
  hideWhenExpired?: boolean;
  className?: string;
}

export function TimerPill({
  timerSeconds,
  startedAt,
  deadlineMs,
  ariaLabel = "Verbleibende Zeit",
  urgentAtSeconds = 5,
  hideWhenExpired = false,
  className,
}: TimerPillProps) {
  const durationMs =
    timerSeconds != null && Number.isFinite(timerSeconds)
      ? Math.max(0, timerSeconds * 1000)
      : 0;
  const startedAtMs = startedAt ? Date.parse(startedAt) : Number.NaN;
  const resolvedDeadline =
    deadlineMs != null && Number.isFinite(deadlineMs)
      ? deadlineMs
      : durationMs > 0 && Number.isFinite(startedAtMs)
        ? startedAtMs + durationMs
        : null;
  const countdown = useSharedCountdown(
    resolvedDeadline,
    Math.max(1, durationMs),
  );

  if (resolvedDeadline == null || (hideWhenExpired && countdown.expired)) {
    return null;
  }

  const urgent = countdown.remainingSeconds <= urgentAtSeconds;

  return (
    <span
      className={[
        styles.timerPill,
        urgent ? styles.timerPillUrgent : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="timer"
      aria-live="off"
      aria-label={`${ariaLabel}: ${countdown.remainingSeconds} Sekunden`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span aria-hidden="true">{countdown.remainingSeconds}s</span>
    </span>
  );
}
