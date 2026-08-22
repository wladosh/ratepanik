"use client";

import { useState, useEffect } from "react";

interface TimerPillProps {
  timerSeconds?: number | null;
  startedAt?: string | null;
}

export function TimerPill({ timerSeconds, startedAt }: TimerPillProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!timerSeconds || timerSeconds <= 0 || !startedAt) {
      setRemaining(null);
      return;
    }

    function tick() {
      const elapsed = Math.floor(
        (Date.now() - new Date(startedAt!).getTime()) / 1000
      );
      setRemaining(Math.max(0, timerSeconds! - elapsed));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerSeconds, startedAt]);

  if (remaining === null) return null;

  const urgent = remaining <= 5;

  return (
    <span
      className="rp-timer-pill"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        height: 32,
        padding: "0 12px",
        borderRadius: "var(--rp-radius-pill)",
        fontSize: 13,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color: urgent ? "#fff" : "var(--rp-peach-deep)",
        background: urgent ? "var(--rp-danger)" : "rgba(245, 107, 82, 0.10)",
        boxShadow: urgent
          ? "0 0 0 3px rgba(255, 92, 122, 0.25)"
          : "0 2px 8px rgba(42, 42, 74, 0.06)",
        transition: "background 0.3s, color 0.3s, box-shadow 0.3s",
        animation: urgent ? "timer-pulse 1s ease-in-out infinite" : undefined,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {remaining}s
    </span>
  );
}
