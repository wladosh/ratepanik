import type { CSSProperties, ReactNode } from "react";
import styles from "./match-play-foundation.module.css";

type StageStyle = CSSProperties & {
  "--mode-color"?: string;
  "--mode-background"?: string;
  "--stage-border"?: string;
  "--stage-tint"?: string;
  "--artwork-background"?: string;
};

export interface QuestionStageProps {
  question: ReactNode;
  eyebrow?: ReactNode;
  eyebrowIcon?: ReactNode;
  supportingContent?: ReactNode;
  artwork?: ReactNode;
  /** Timer content is placed directly below the card with the shared overlap. */
  timer?: ReactNode;
  headingLevel?: 1 | 2 | 3;
  headingId?: string;
  ariaLabel?: string;
  className?: string;
  accentColor?: string;
  accentBackground?: string;
  stageTint?: string;
  stageBorder?: string;
  artworkBackground?: string;
}

/** Shared prompt card with optional challenge label, artwork, and timer slot. */
export function QuestionStage({
  question,
  eyebrow,
  eyebrowIcon = "✦",
  supportingContent,
  artwork,
  timer,
  headingLevel = 2,
  headingId,
  ariaLabel,
  className,
  accentColor,
  accentBackground,
  stageTint,
  stageBorder,
  artworkBackground,
}: QuestionStageProps) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  const stageStyle: StageStyle = {
    "--mode-color": accentColor,
    "--mode-background": accentBackground,
    "--stage-tint": stageTint,
    "--stage-border": stageBorder,
    "--artwork-background": artworkBackground,
  };

  return (
    <>
      <section
        className={[
          styles.questionStage,
          artwork ? styles.questionStageWithArtwork : null,
          timer
            ? styles.questionStageWithTimer
            : styles.questionStageWithoutTimer,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={stageStyle}
        aria-label={ariaLabel}
        aria-labelledby={headingId}
      >
        {eyebrow ? (
          <div className={styles.eyebrow}>
            {eyebrowIcon ? (
              <span aria-hidden="true">{eyebrowIcon}</span>
            ) : null}
            {eyebrow}
          </div>
        ) : null}
        <Heading id={headingId} className={styles.questionTitle}>
          {question}
        </Heading>
        {supportingContent ? (
          <div className={styles.questionSupporting}>{supportingContent}</div>
        ) : null}
        {artwork ? (
          <div className={styles.artwork} aria-hidden="true">
            {artwork}
          </div>
        ) : null}
      </section>
      {timer ? <div className={styles.timerSlot}>{timer}</div> : null}
    </>
  );
}
