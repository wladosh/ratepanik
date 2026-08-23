"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { NumberGuessPayload } from "@/lib/content";
import { useGame } from "@/lib/game-context";
import { MODE_NUMBER_GUESS_256 } from "@/lib/rp-assets";
import { AnswerWaitingPanel } from "./answer-waiting-panel";
import { GuessConsole } from "./guess-console";
import { MatchPlayShell } from "./match-play-shell";
import { MatchStatusHeader } from "./match-status-header";
import styles from "./number-guess-screen.module.css";
import { QuestionStage } from "./question-stage";
import { QuestionTimerBar } from "./question-timer-bar";
import { TimerPill } from "./timer-pill";
import { WaitingFooter } from "./waiting-footer";

interface PromptDraft {
  promptId: string;
  value: string;
}

interface PromptSubmission {
  promptId: string;
  value: number;
}

const GUESS_FORMATTER = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 20,
  useGrouping: true,
});

function formatGuess(value: number): string {
  return GUESS_FORMATTER.format(value);
}

export function NumberGuessScreen() {
  const game = useGame();
  const [draft, setDraft] = useState<PromptDraft | null>(null);
  const [submission, setSubmission] = useState<PromptSubmission | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const prompt = game.currentPrompt;
  const payload = prompt?.payload as NumberGuessPayload | undefined;
  const promptId = prompt?.id ?? "";
  const guess = draft?.promptId === promptId ? draft.value : "";
  const localSubmission =
    submission?.promptId === promptId ? submission.value : null;
  const storedSubmission =
    game.roundAnswers.find((answer) => answer.player_id === game.myPlayerId)
      ?.numeric_answer ?? null;
  const submittedGuess = localSubmission ?? storedSubmission;
  const hasAnswered = game.phase === "number_guess_waiting";
  const waiting = hasAnswered || localSubmission !== null;

  const localAnswerIsPending =
    localSubmission !== null &&
    !game.roundAnswers.some((answer) => answer.player_id === game.myPlayerId);
  const answeredCount =
    game.roundAnswers.length + (localAnswerIsPending ? 1 : 0);
  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 4;
  const roundNum = (game.currentBlock?.current_round ?? 0) + 1;
  const roundsTotal = game.currentBlock?.rounds_total ?? 1;

  const handleSubmit = useCallback(
    async (value: number) => {
      if (!prompt || hasAnswered || submission?.promptId === prompt.id) return;

      const nextSubmission = { promptId: prompt.id, value };
      setSubmissionError(null);
      setSubmission(nextSubmission);

      try {
        await game.submitNumberGuess(value);
      } catch {
        setSubmission((current) =>
          current?.promptId === prompt.id ? null : current,
        );
        setSubmissionError(
          "Deine Schätzung konnte nicht gespeichert werden. Versuch es noch einmal.",
        );
      }
    },
    [game, hasAnswered, prompt, submission],
  );

  if (!prompt) {
    return (
      <MatchPlayShell ariaLabel="Zahlenraten">
        <div className="flex flex-1 items-center justify-center">
          <p
            className="text-lg font-medium motion-safe:animate-pulse"
            role="status"
            style={{ color: "var(--rp-text-secondary)" }}
          >
            Frage wird geladen…
          </p>
        </div>
      </MatchPlayShell>
    );
  }

  const timer =
    !waiting && game.questionDeadlineMs != null ? (
      <QuestionTimerBar
        key={`${game.currentBlock?.id ?? "block"}:${game.currentBlock?.current_round ?? 0}`}
        deadlineMs={game.questionDeadlineMs}
        durationMs={game.questionTimerMs ?? undefined}
      />
    ) : undefined;

  const participants = game.players.map((player) => ({
    id: player.id,
    name: player.display_name,
    avatar: game.getAvatar(player.id),
    answered:
      (player.id === game.myPlayerId && localSubmission !== null) ||
      game.roundAnswers.some((answer) => answer.player_id === player.id),
  }));

  return (
    <MatchPlayShell
      ariaLabel="Zahlenraten"
      contentClassName={styles.screenContent}
      footer={
        waiting ? (
          <WaitingFooter
            answered={answeredCount}
            total={game.players.length}
            mode="number_guess"
          />
        ) : undefined
      }
    >
      <MatchStatusHeader
        current={blockNum}
        total={totalBlocks}
        mode="number_guess"
        questionLabel="Block"
        modeLabel={
          roundsTotal > 1
            ? `Schätzen ${roundNum}/${roundsTotal}`
            : undefined
        }
        timer={
          <TimerPill
            timerSeconds={game.currentBlock?.timer_seconds}
            startedAt={game.currentBlock?.started_at}
          />
        }
      />

      <QuestionStage
        question={prompt.prompt}
        headingId="number-guess-question"
        eyebrow="Schätz-Challenge"
        eyebrowIcon="≈"
        accentColor="#3973aa"
        accentBackground="rgba(126, 182, 255, 0.16)"
        stageTint="rgba(232, 245, 255, 0.96)"
        stageBorder="rgba(126, 182, 255, 0.2)"
        artworkBackground="rgba(211, 235, 255, 0.76)"
        supportingContent={
          prompt.hint ? (
            <span className={styles.promptHint}>
              <span aria-hidden="true">💡</span>
              <span>{prompt.hint}</span>
            </span>
          ) : undefined
        }
        artwork={
          <Image
            src={MODE_NUMBER_GUESS_256}
            alt=""
            width={118}
            height={118}
            className={styles.stageArtwork}
            priority
          />
        }
        timer={timer}
      />

      {!waiting ? (
        <GuessConsole
          value={guess}
          unit={payload?.unit}
          submissionError={submissionError}
          onChange={(value) => {
            setSubmissionError(null);
            setDraft({ promptId, value });
          }}
          onSubmit={handleSubmit}
        />
      ) : (
        <AnswerWaitingPanel
          title="Schätzung gespeichert"
          description={
            submittedGuess !== null ? (
              <>
                Deine Antwort:
                <br />
                <strong className={styles.submittedGuess}>
                  {formatGuess(submittedGuess)}
                  {payload?.unit ? (
                    <span className={styles.submittedUnit}>
                      {payload.unit}
                    </span>
                  ) : null}
                </strong>
              </>
            ) : (
              "Deine Antwort ist sicher gespeichert."
            )
          }
          artwork={
            <Image
              src={MODE_NUMBER_GUESS_256}
              alt=""
              width={82}
              height={82}
              className={styles.waitingArtwork}
            />
          }
          participants={participants}
        />
      )}
    </MatchPlayShell>
  );
}
