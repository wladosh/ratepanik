"use client";

import type { CSSProperties, ReactNode } from "react";
import { type PlayableMode } from "@/lib/game-store";
import { useI18n } from "@/lib/i18n-context";
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
  questionLabel,
  className,
}: MatchStatusHeaderProps) {
  const { t } = useI18n();
  const safeCurrent = Math.max(0, current);
  const safeTotal = Math.max(0, total);
  const resolvedQuestionLabel = questionLabel ?? t.lobby.blockLabel;
  const resolvedModeLabel =
    modeLabel ??
    (mode === "number_guess"
      ? t.lobby.modeGuess
      : mode === "pick_correct"
        ? t.lobby.modePick
        : mode === "find_lie"
          ? t.lobby.modeLie
          : mode === "order_it"
            ? t.lobby.modeOrder
            : "");
  return (
    <header
      className={[styles.statusHeader, className].filter(Boolean).join(" ")}
    >
      <div className={styles.statusLeading}>
        <span
          className={styles.statusPill}
          aria-label={`${resolvedQuestionLabel} ${safeCurrent} ${t.lobby.of} ${safeTotal}`}
        >
          <span aria-hidden="true">{resolvedQuestionLabel} </span>
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
            {modeIcon ? (
              <span aria-hidden="true">{modeIcon}</span>
            ) : null}
            <span className={styles.modeLabel}>{resolvedModeLabel}</span>
          </span>
        ) : null}
        {trailing}
      </div>
    </header>
  );
}
