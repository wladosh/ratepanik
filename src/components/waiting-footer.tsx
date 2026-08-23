"use client";

import type { PlayableMode } from "@/lib/game-store";
import styles from "./match-play-foundation.module.css";

const MODE_WAITING_COPY: Record<PlayableMode, string> = {
  number_guess: "haben schon geraten",
  pick_correct: "haben schon gewählt",
  find_lie: "haben die Lüge markiert",
  order_it: "haben ihre Reihenfolge bestätigt",
};

export interface WaitingFooterProps {
  answered: number;
  total: number;
  mode?: PlayableMode | null;
  /** Overrides the text after the count. */
  label?: string;
  className?: string;
}

export function WaitingFooter({
  answered,
  total,
  mode,
  label,
  className,
}: WaitingFooterProps) {
  if (total <= 0) return null;

  const safeAnswered = Math.min(total, Math.max(0, answered));
  const resolvedLabel =
    label ??
    (mode ? MODE_WAITING_COPY[mode] : "haben schon peinlich getippt");

  return (
    <div
      className={[styles.waitingFooter, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span>
        <span className={styles.waitingCount}>
          {safeAnswered}/{total}
        </span>{" "}
        {resolvedLabel}
      </span>
    </div>
  );
}
