import type { ReactNode } from "react";
import styles from "./match-play-foundation.module.css";

export interface MatchPlayShellProps {
  children: ReactNode;
  /** Fixed content rendered below the scrollable play area. */
  footer?: ReactNode;
  /** Accessible name for the gameplay region. */
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
  /** Set false when a screen supplies its own background decoration. */
  ambientDecoration?: boolean;
}

/** Shared Gen-2 layout, safe-area handling, scrolling, and ambient backdrop. */
export function MatchPlayShell({
  children,
  footer,
  ariaLabel = "Spielrunde",
  className,
  contentClassName,
  ambientDecoration = true,
}: MatchPlayShellProps) {
  return (
    <main
      className={[styles.shell, className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
    >
      {ambientDecoration ? (
        <>
          <span className={styles.ambientPurple} aria-hidden="true" />
          <span className={styles.ambientPeach} aria-hidden="true" />
        </>
      ) : null}
      <div
        className={[styles.scrollRegion, contentClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
      {footer ? <div className={styles.footerSlot}>{footer}</div> : null}
    </main>
  );
}
