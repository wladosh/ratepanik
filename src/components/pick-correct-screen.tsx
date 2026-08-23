"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useGame } from "@/lib/game-context";
import { MODE_PICK_CORRECT_256 } from "@/lib/rp-assets";
import type { PickCorrectPayload } from "@/lib/content";
import { MatchPlayShell } from "./match-play-shell";
import { MatchStatusHeader } from "./match-status-header";
import { QuestionStage } from "./question-stage";
import { TimerPill } from "./timer-pill";
import { QuestionTimerBar } from "./question-timer-bar";
import { WaitingFooter } from "./waiting-footer";
import styles from "./pick-correct-screen.module.css";

const ANSWER_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const CORRECT_TARGET = 4;

function PeopleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

export function PickCorrectScreen() {
  const game = useGame();
  const prompt = game.currentPrompt;
  const payload = prompt?.payload as PickCorrectPayload | undefined;

  const sortedPlayers = useMemo(
    () =>
      [...game.players].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [game.players]
  );

  const activePlayer = sortedPlayers[game.activePlayerIndex];
  const correctFound = game.turns.filter((t) => t.is_correct).length;
  const huntComplete = correctFound >= CORRECT_TARGET;

  const tappedPlayerCount = useMemo(
    () => new Set(game.turns.map((t) => t.player_id)).size,
    [game.turns]
  );

  const tappedIndices = useMemo(
    () => new Set(game.turns.map((t) => t.card_index)),
    [game.turns]
  );

  const turnResults = useMemo(() => {
    const map = new Map<number, { is_correct: boolean; player_id: string }>();
    for (const t of game.turns) {
      map.set(t.card_index, { is_correct: t.is_correct, player_id: t.player_id });
    }
    return map;
  }, [game.turns]);

  const playerNames = useMemo(
    () => new Map(game.players.map((player) => [player.id, player.display_name])),
    [game.players]
  );

  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 4;
  const showQuestionTimer =
    !huntComplete &&
    game.questionDeadlineMs != null &&
    game.questionTimerMs != null;
  const showWaitingFooter =
    !huntComplete && !game.isMyTurn && activePlayer != null;

  if (!prompt || !payload) {
    return (
      <MatchPlayShell ariaLabel="Kartenjagd wird geladen">
        <div className={styles.loading}>
          Karten werden geladen…
        </div>
      </MatchPlayShell>
    );
  }

  return (
    <MatchPlayShell
      ariaLabel="Richtig wählen – Kartenjagd"
      contentClassName={styles.content}
      footer={
        showWaitingFooter ? (
          <WaitingFooter
            answered={tappedPlayerCount}
            total={game.players.length}
            mode="pick_correct"
            label="haben schon eine Karte gewählt"
          />
        ) : undefined
      }
    >
      <MatchStatusHeader
        current={blockNum}
        total={totalBlocks}
        timer={
          showQuestionTimer ? (
            <TimerPill
              timerSeconds={game.questionTimerMs! / 1000}
              deadlineMs={game.questionDeadlineMs}
              hideWhenExpired
            />
          ) : undefined
        }
        trailing={
          <div
            className={styles.foundProgress}
            role="progressbar"
            aria-label="Richtige Karten gefunden"
            aria-valuemin={0}
            aria-valuemax={CORRECT_TARGET}
            aria-valuenow={Math.min(correctFound, CORRECT_TARGET)}
          >
            <span className={styles.foundCount}>
              {Math.min(correctFound, CORRECT_TARGET)}/{CORRECT_TARGET}
            </span>
            <span className={styles.foundDots} aria-hidden="true">
              {Array.from({ length: CORRECT_TARGET }, (_, index) => (
                <span
                  key={index}
                  className={
                    index < correctFound
                      ? styles.foundDotComplete
                      : styles.foundDot
                  }
                />
              ))}
            </span>
          </div>
        }
      />

      <QuestionStage
        headingId="pick-correct-question"
        ariaLabel="Aufgabe der Kartenjagd"
        eyebrow="Finde 4 richtige Karten"
        question={prompt.prompt}
        accentColor="var(--rp-peach-deep)"
        accentBackground="rgba(255, 138, 113, 0.13)"
        stageTint="rgba(255, 245, 239, 0.96)"
        stageBorder="rgba(255, 138, 113, 0.17)"
        artworkBackground="rgba(237, 230, 255, 0.68)"
        artwork={
          <Image
            src={MODE_PICK_CORRECT_256}
            alt=""
            width={118}
            height={118}
            className={styles.modeArtwork}
            priority
          />
        }
        timer={
          showQuestionTimer ? (
            <QuestionTimerBar
              key={game.currentBlock?.id ?? prompt.id}
              deadlineMs={game.questionDeadlineMs!}
              durationMs={game.questionTimerMs!}
              ariaLabel="Verbleibende Zeit für die Kartenjagd"
            />
          ) : undefined
        }
      />

      <div
        className={[
          styles.turnStatus,
          game.isMyTurn ? styles.turnStatusActive : styles.turnStatusWaiting,
        ].join(" ")}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className={styles.turnIcon}>
          <PeopleIcon />
        </span>
        <span className={styles.turnCopy}>
          <strong>
            {game.isMyTurn
              ? "Du bist dran"
              : activePlayer
                ? `${activePlayer.display_name} sucht`
                : "Nächster Zug wird vorbereitet"}
          </strong>
          <span>
            {game.isMyTurn
              ? "Tippe auf eine noch verdeckte Karte."
              : "Die Karten öffnen sich Zug für Zug."}
          </span>
        </span>
        <span className={styles.turnPulse} aria-hidden="true" />
      </div>

      <div
        className={styles.cardGrid}
        aria-label="Antwortkarten"
        aria-live="polite"
      >
        {payload.cards.map((card, index) => {
          const tapped = tappedIndices.has(index);
          const result = turnResults.get(index);
          const isCorrect = result?.is_correct === true;
          const state = tapped ? (isCorrect ? "correct" : "wrong") : "available";
          const tappedBy = result ? playerNames.get(result.player_id) : undefined;
          const canTap = game.isMyTurn && !tapped && !huntComplete;
          const stateLabel = tapped
            ? `${isCorrect ? "Richtig" : "Falsch"}${tappedBy ? `, gewählt von ${tappedBy}` : ""}`
            : canTap
              ? "Noch nicht gewählt"
              : "Noch verdeckt";

          return (
            <button
              key={index}
              type="button"
              onClick={() => void game.tapCard(index)}
              disabled={!canTap}
              className={styles.answerCard}
              data-state={state}
              aria-label={`${ANSWER_LABELS[index] ?? index + 1}: ${card}. ${stateLabel}`}
            >
              <span className={styles.answerBadge} aria-hidden="true">
                {tapped ? (isCorrect ? "✓" : "×") : ANSWER_LABELS[index]}
              </span>
              <span className={styles.answerText}>{card}</span>
              <span className={styles.answerState}>
                {tapped ? (
                  <>
                    <span aria-hidden="true">{isCorrect ? "Gefunden" : "Daneben"}</span>
                    {tappedBy ? <small>{tappedBy}</small> : null}
                  </>
                ) : (
                  <span aria-hidden="true">{canTap ? "Wählen" : "Verdeckt"}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </MatchPlayShell>
  );
}
