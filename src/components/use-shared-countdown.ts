"use client";

import { useEffect, useState } from "react";

export interface SharedCountdown {
  /** Milliseconds left on the shared, absolute deadline. */
  remainingMs: number;
  /** A clamped value from 0 to 1. */
  progress: number;
  /** Display-friendly seconds, rounded up so the timer does not show 0 early. */
  remainingSeconds: number;
  expired: boolean;
}

/**
 * Drives countdown UI from an absolute deadline instead of decrementing local
 * state. Delayed intervals and background tabs therefore cannot make clients
 * drift apart.
 */
export function useSharedCountdown(
  deadlineMs: number | null | undefined,
  durationMs: number,
  resolutionMs = 250,
): SharedCountdown {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (deadlineMs == null || !Number.isFinite(deadlineMs)) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const tick = () => {
      const now = Date.now();
      setNowMs(now);
      if (!cancelled && now < deadlineMs) {
        timeoutId = setTimeout(
          tick,
          Math.min(Math.max(50, resolutionMs), deadlineMs - now),
        );
      }
    };

    timeoutId = setTimeout(tick, 0);
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [deadlineMs, resolutionMs]);

  const safeDuration = Math.max(1, durationMs);
  const remainingMs =
    deadlineMs == null || !Number.isFinite(deadlineMs)
      ? 0
      : Math.max(0, deadlineMs - nowMs);

  return {
    remainingMs,
    progress: Math.min(1, remainingMs / safeDuration),
    remainingSeconds: Math.ceil(remainingMs / 1000),
    expired: remainingMs <= 0,
  };
}
