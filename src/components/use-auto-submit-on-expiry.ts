"use client";

import { useEffect, useRef } from "react";

/**
 * Small buffer (ms) to fire the auto-submit slightly before the shared
 * deadline. This guarantees the submit call is initiated before the
 * game-context timer sets `roundTimedOut = true` and triggers a phase
 * transition that unmounts the screen component.
 *
 * 50 ms is imperceptible to the user (the timer bar is already visually at 0%)
 * but gives enough headroom to avoid the unmount race.
 */
const AUTO_SUBMIT_BUFFER_MS = 50;

/**
 * Auto-submits a draft answer when the shared question timer expires.
 *
 * Fires the `onAutoSubmit` callback just before the deadline if the player
 * has a non-empty draft (`canAutoSubmit = true`). Does nothing when the player
 * has already submitted or has no draft.
 */
export function useAutoSubmitOnExpiry(opts: {
  /** Shared absolute deadline (epoch ms) from the server-driven timer. */
  deadlineMs: number | null | undefined;
  /** True when the player has a non-empty draft AND has not yet submitted. */
  canAutoSubmit: boolean;
  /** Called once at expiry to submit the draft. Must be idempotent / guarded. */
  onAutoSubmit: () => void;
}): void {
  const { deadlineMs, canAutoSubmit } = opts;

  const callbackRef = useRef(opts.onAutoSubmit);
  useEffect(() => {
    callbackRef.current = opts.onAutoSubmit;
  });

  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [deadlineMs]);

  useEffect(() => {
    if (deadlineMs == null || !canAutoSubmit || firedRef.current) return;

    const target = deadlineMs - AUTO_SUBMIT_BUFFER_MS;
    const remaining = target - Date.now();

    const fire = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      callbackRef.current();
    };

    if (remaining <= 0) {
      fire();
      return;
    }

    const timer = setTimeout(fire, remaining);
    return () => clearTimeout(timer);
  }, [deadlineMs, canAutoSubmit]);
}
