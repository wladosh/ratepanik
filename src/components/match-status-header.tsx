import type { CSSProperties, ReactNode } from "react";
import {
  modeEmoji,
  modeLabelDe,
  type PlayableMode,
} from "@/lib/game-store";
import styles from "./match-play-foundation.module.css";

type ModeStyle = CSSProperties & {
  "--mode-color": string;
  "--mode-background": string;
};

const MODE_STYLES: Record<PlayableMode, ModeStyle> = {
  number_guess: {
    "--mode-color": "var(--rp-sky)",
    "--mode-background": "rgba(126, 182, 255, 0.14)",
  },
  pick_correct: {
    "--mode-color": "var(--rp-mint)",
    "--mode-background": "rgba(111, 207, 178, 0.14)",
  },
  find_lie: {
    "--mode-color": "var(--rp-pink)",
    "--mode-background": "rgba(255, 122, 182, 0.13)",
  },
  order_it: {
    "--mode-color": "var(--rp-purple)",
    "--mode-background": "rgba(139, 124, 255, 0.1)",
  },
};

export interface MatchStatusHeaderProps {
  current: number;
  total: number;
  mode?: PlayableMode | null;
  modeLabel?: string;
  modeIcon?: ReactNode;
  /** Usually a TimerPill; kept as a slot for mode-specific status UI. */
  timer?: ReactNode;
  trailing?: ReactNode;
  questionLabel?: string;
  className?: string;
}

/** Question progress, synchronized timer slot, and mode identity. */
export function MatchStatusHeader({
  current,
  total,
  mode,
  modeLabel,
  modeIcon,
  timer,
  trailing,
  questionLabel = "Frage",
  className,
}: MatchStatusHeaderProps) {
  const safeCurrent = Math.max(0, current);
  const safeTotal = Math.max(0, total);
  const resolvedModeLabel = modeLabel ?? (mode ? modeLabelDe(mode) : "");
  const resolvedModeIcon = modeIcon ?? (mode ? modeEmoji(mode) : null);

  return (
    <header
      className={[styles.statusHeader, className].filter(Boolean).join(" ")}
    >
      <div className={styles.statusLeading}>
        <span
          className={styles.statusPill}
          aria-label={`${questionLabel} ${safeCurrent} von ${safeTotal}`}
        >
          <span aria-hidden="true">{questionLabel} </span>
          <span className={styles.statusCurrent} aria-hidden="true">
            {safeCurrent}
          </span>
          <span aria-hidden="true">/{safeTotal}</span>
        </span>
      </div>
      <div className={styles.statusTrailing}>
        {timer}
        {resolvedModeLabel ? (
          <span
            className={styles.modePill}
            style={mode ? MODE_STYLES[mode] : undefined}
          >
            {resolvedModeIcon ? (
              <span aria-hidden="true">{resolvedModeIcon}</span>
            ) : null}
            <span className={styles.modeLabel}>{resolvedModeLabel}</span>
          </span>
        ) : null}
        {trailing}
      </div>
    </header>
  );
}
