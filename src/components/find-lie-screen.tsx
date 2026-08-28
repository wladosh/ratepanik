"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FindLiePayload } from "@/lib/content";
import { PlayerSchleimi } from "@/components/player-schleimi";
import { MODE_FIND_LIE_256 } from "@/lib/rp-assets";
import { useGame } from "@/lib/game-context";
import { AnswerWaitingPanel } from "./answer-waiting-panel";
import { MatchPlayShell } from "./match-play-shell";
import { MatchStatusHeader } from "./match-status-header";
import { QuestionStage } from "./question-stage";
import { QuestionTimerBar } from "./question-timer-bar";
import styles from "./find-lie-screen.module.css";

const LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function FindLieScreen() {
  const game = useGame();
  const [submitted, setSubmitted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const lastPromptRef = useRef<string | null>(null);

  const prompt = game.currentPrompt;
  const payload = prompt?.payload as FindLiePayload | undefined;
  const hasAnswered = game.phase === "find_lie_waiting";
  const roundKey = `${game.currentBlock?.id ?? ""}:${game.currentBlock?.current_round ?? 0}:${prompt?.id ?? ""}`;

  useEffect(() => {
    if (prompt?.id && roundKey !== lastPromptRef.current) {
      lastPromptRef.current = roundKey;
      setSubmitted(false);
      setSelectedIndex(null);
    }
  }, [prompt?.id, roundKey]);

  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 5;
  const roundNum = (game.currentBlock?.current_round ?? 0) + 1;
  const roundsTotal = game.currentBlock?.rounds_total ?? 1;
  const statements = payload?.statements ?? [];

  const handlePick = useCallback(
    async (index: number) => {
      if (submitted || hasAnswered) return;
      setSelectedIndex(index);
      setSubmitted(true);
      try {
        await game.submitFindLie(index);
      } catch {
        setSelectedIndex(null);
        setSubmitted(false);
      }
    },
    [game, hasAnswered, submitted],
  );

  if (!prompt || !payload || statements.length === 0) {
    return (
      <MatchPlayShell ariaLabel="Lüge finden">
        <div className={styles.loading} role="status">
          Aussagen werden geladen…
        </div>
      </MatchPlayShell>
    );
  }

  const waiting = hasAnswered || submitted;
  const showQuestionTimer =
    !waiting &&
    game.questionDeadlineMs != null &&
    game.questionTimerMs != null;
  const participants = game.players.map((player) => ({
    id: player.id,
    name: player.display_name,
    avatar: <PlayerSchleimi playerId={player.id} size={28} />,
    answered:
      (player.id === game.myPlayerId && submitted) ||
      game.roundAnswers.some((answer) => answer.player_id === player.id),
  }));
  const selectedStatement =
    selectedIndex != null ? statements[selectedIndex] : undefined;

  return (
    <MatchPlayShell
      ariaLabel="Lüge finden"
      contentClassName={styles.content}
    >
      <MatchStatusHeader
        current={blockNum}
        total={totalBlocks}
        mode="find_lie"
        questionLabel="Block"
        modeLabel={
          roundsTotal > 1 ? `Lüge ${roundNum}/${roundsTotal}` : undefined
        }
      />

      <QuestionStage
        question={prompt.prompt}
        headingId="find-lie-question"
        ariaLabel="Aufgabe: Finde die Lüge"
        eyebrow="Welche Aussage ist falsch?"
        eyebrowIcon={null}
        accentColor="#b83f79"
        accentBackground="rgba(255, 122, 182, 0.15)"
        stageTint="rgba(255, 235, 245, 0.96)"
        stageBorder="rgba(255, 122, 182, 0.2)"
        artworkBackground="rgba(255, 218, 235, 0.72)"
        artwork={
          <Image
            src={MODE_FIND_LIE_256}
            alt=""
            width={128}
            height={128}
            className={styles.stageArtwork}
            unoptimized
          />
        }
        timer={
          showQuestionTimer ? (
            <QuestionTimerBar
              key={`${game.currentBlock?.id ?? "block"}:${game.currentBlock?.current_round ?? 0}`}
              deadlineMs={game.questionDeadlineMs!}
              durationMs={game.questionTimerMs!}
              ariaLabel="Verbleibende Zeit, um die Lüge zu finden"
            />
          ) : undefined
        }
      />

      {!waiting ? (
        <div className={styles.statementList} aria-labelledby="find-lie-question">
          {statements.map((statement, index) => (
            <button
              key={index}
              type="button"
              onClick={() => void handlePick(index)}
              className={styles.statementCard}
              aria-pressed={selectedIndex === index}
              aria-label={`${LABELS[index] ?? index + 1}: ${statement}`}
            >
              <span className={styles.statementBadge} aria-hidden="true">
                {LABELS[index] ?? index + 1}
              </span>
              <span className={styles.statementText}>{statement}</span>
            </button>
          ))}
        </div>
      ) : (
        <AnswerWaitingPanel
          className={styles.waitingPanel}
          title="Lüge markiert"
          description={
            selectedStatement ? (
              <>
                Deine Wahl:{" "}
                <strong className={styles.selectedAnswer}>
                  {LABELS[selectedIndex!] ?? selectedIndex! + 1}
                </strong>
                <span className={styles.selectedStatement}>
                  {selectedStatement}
                </span>
              </>
            ) : (
              "Deine Antwort ist sicher gespeichert. Kein Zurück."
            )
          }
          artwork={
            <Image
              src={MODE_FIND_LIE_256}
              alt=""
              width={96}
              height={96}
              className={styles.waitingArtwork}
              unoptimized
            />
          }
          artworkLabel="Antwort sicher gespeichert"
          participants={participants}
        />
      )}
    </MatchPlayShell>
  );
}
