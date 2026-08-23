import type { ReactNode } from "react";
import styles from "./match-play-foundation.module.css";

export interface WaitingParticipant {
  id: string;
  name: string;
  avatar: ReactNode;
  answered: boolean;
}

export interface AnswerWaitingPanelProps {
  title: ReactNode;
  description?: ReactNode;
  artwork?: ReactNode;
  artworkLabel?: string;
  participants?: readonly WaitingParticipant[];
  children?: ReactNode;
  className?: string;
}

/** Submission confirmation with an accessible, live participant status list. */
export function AnswerWaitingPanel({
  title,
  description,
  artwork,
  artworkLabel,
  participants = [],
  children,
  className,
}: AnswerWaitingPanelProps) {
  const answered = participants.filter((participant) => participant.answered)
    .length;

  return (
    <section
      className={[styles.waitingPanel, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {artwork ? (
        <div
          className={styles.waitingArtwork}
          role={artworkLabel ? "img" : undefined}
          aria-label={artworkLabel}
          aria-hidden={artworkLabel ? undefined : "true"}
        >
          {artwork}
        </div>
      ) : null}
      <h2 className={styles.waitingTitle}>{title}</h2>
      {description ? (
        <div className={styles.waitingDescription}>{description}</div>
      ) : null}
      {participants.length > 0 ? (
        <>
          <p className={styles.visuallyHidden}>
            {answered} von {participants.length} Personen sind fertig.
          </p>
          <ul className={styles.participantList} aria-label="Antwortstatus">
            {participants.map((participant) => (
              <li
                key={participant.id}
                className={[
                  styles.participant,
                  participant.answered ? styles.participantAnswered : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={participant.name}
                aria-label={`${participant.name}: ${
                  participant.answered ? "fertig" : "wartet"
                }`}
              >
                <span aria-hidden="true">{participant.avatar}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {children}
    </section>
  );
}
