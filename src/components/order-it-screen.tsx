"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderItPayload } from "@/lib/content";
import { PlayerSchleimi } from "@/components/player-schleimi";
import { useGame } from "@/lib/game-context";
import { MODE_ORDER_IT_256 } from "@/lib/rp-assets";
import { AnswerWaitingPanel } from "./answer-waiting-panel";
import { MatchPlayShell } from "./match-play-shell";
import { MatchStatusHeader } from "./match-status-header";
import { shuffleOrderItItems } from "@/lib/shuffle";
import { OrderItSortable, type OrderItItem } from "./order-it-sortable";
import { QuestionStage } from "./question-stage";
import { QuestionTimerBar } from "./question-timer-bar";
import { TimerPill } from "./timer-pill";
import { useAutoSubmitOnExpiry } from "./use-auto-submit-on-expiry";
import styles from "./order-it-screen.module.css";

export function OrderItScreen() {
  const game = useGame();
  const [submitted, setSubmitted] = useState(false);
  const [entries, setEntries] = useState<OrderItItem[]>([]);
  const lastShuffleKeyRef = useRef<string | null>(null);

  const prompt = game.currentPrompt;
  const payload = prompt?.payload as OrderItPayload | undefined;
  const hasAnswered = game.phase === "order_it_waiting";
  const shuffleKey = `${game.currentBlock?.id ?? "block"}:${game.currentBlock?.current_round ?? 0}:${prompt?.id ?? ""}`;

  useEffect(() => {
    if (!prompt?.id || !payload?.items) return;
    if (shuffleKey === lastShuffleKeyRef.current) return;
    lastShuffleKeyRef.current = shuffleKey;
    setSubmitted(false);
    setEntries(shuffleOrderItItems(payload.items, payload.correct_order ?? []));
  }, [payload, prompt?.id, shuffleKey]);

  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 5;
  const roundNum = (game.currentBlock?.current_round ?? 0) + 1;
  const roundsTotal = game.currentBlock?.rounds_total ?? 1;

  const handleSubmit = useCallback(async () => {
    if (submitted || hasAnswered || entries.length === 0) return;
    setSubmitted(true);
    try {
      await game.submitOrderIt(entries.map((entry) => entry.orig));
    } catch {
      setSubmitted(false);
    }
  }, [entries, game, hasAnswered, submitted]);

  const canAutoSubmit = !submitted && !hasAnswered && entries.length > 0;

  useAutoSubmitOnExpiry({
    deadlineMs: game.questionDeadlineMs,
    canAutoSubmit,
    onAutoSubmit: () => {
      void handleSubmit();
    },
  });

  if (!prompt || !payload || (payload.items?.length ?? 0) === 0) {
    return (
      <MatchPlayShell ariaLabel="Reihenfolge sortieren">
        <div className={styles.loading} role="status">
          Reihenfolge wird geladen…
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

  return (
    <MatchPlayShell
      ariaLabel="Reihenfolge sortieren"
      contentClassName={styles.content}
    >
      <MatchStatusHeader
        current={blockNum}
        total={totalBlocks}
        mode="order_it"
        questionLabel="Block"
        modeLabel={
          roundsTotal > 1 ? `Reihenfolge ${roundNum}/${roundsTotal}` : undefined
        }
        timer={
          showQuestionTimer ? (
            <TimerPill
              timerSeconds={game.questionTimerMs! / 1000}
              deadlineMs={game.questionDeadlineMs}
              hideWhenExpired
            />
          ) : undefined
        }
      />

      <QuestionStage
        question={prompt.prompt}
        headingId="order-it-question"
        ariaLabel="Sortieraufgabe"
        eyebrow="Sortier-Challenge"
        eyebrowIcon="↕"
        accentColor="var(--rp-purple)"
        accentBackground="rgba(139, 124, 255, 0.12)"
        stageTint="rgba(247, 240, 255, 0.94)"
        stageBorder="rgba(139, 124, 255, 0.15)"
        artworkBackground="rgba(237, 230, 255, 0.72)"
        supportingContent={
          payload.order_axis ? (
            <span className={styles.orderAxis}>
              <span aria-hidden="true">→</span>
              <span>{payload.order_axis}</span>
            </span>
          ) : undefined
        }
        artwork={
          <Image
            src={MODE_ORDER_IT_256}
            alt=""
            width={118}
            height={118}
            className={styles.stageArtwork}
            preload
          />
        }
        timer={
          showQuestionTimer ? (
            <QuestionTimerBar
              key={`${game.currentBlock?.id ?? "block"}:${game.currentBlock?.current_round ?? 0}`}
              deadlineMs={game.questionDeadlineMs!}
              durationMs={game.questionTimerMs!}
              ariaLabel="Verbleibende Zeit zum Sortieren"
            />
          ) : undefined
        }
      />

      {!waiting ? (
        <section
          className={styles.sortingArea}
          aria-labelledby="order-it-list-title"
        >
          <div className={styles.sortingHeader}>
            <div>
              <h2 id="order-it-list-title" className={styles.sortingTitle}>
                Deine Reihenfolge
              </h2>
              <p id="order-it-drag-hint" className={styles.dragHint}>
                Ziehen zum Sortieren
              </p>
            </div>
          </div>
          <OrderItSortable items={entries} onChange={setEntries} />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            className={styles.submitButton}
          >
            Reihenfolge bestätigen
          </button>
        </section>
      ) : (
        <AnswerWaitingPanel
          className={styles.waitingPanel}
          title="Reihenfolge steht!"
          description="Gespeichert – jetzt sind die anderen dran."
          artwork={
            <Image
              src={MODE_ORDER_IT_256}
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
