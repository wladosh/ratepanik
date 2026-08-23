"use client";

import { useMemo } from "react";
import { useGame } from "@/lib/game-context";
import { TimerPill } from "./timer-pill";
import { QuestionTimerBar } from "./question-timer-bar";
import { WaitingFooter } from "./waiting-footer";
import { QUESTION_TIMER_MS } from "@/lib/game-store";
import type { PickCorrectPayload } from "@/lib/content";

const ANSWER_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const CARD_STYLE = {
  border: "var(--rp-border)",
  bg: "var(--rp-surface)",
  label: "var(--rp-text-secondary)",
};

function PeopleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
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

  const localPlayerTapped = useMemo(
    () => game.turns.some((t) => t.player_id === game.myPlayerId),
    [game.turns, game.myPlayerId]
  );

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

  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 4;

  if (!prompt || !payload) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "var(--rp-bg-hero)" }}
      >
        <div className="text-lg animate-pulse font-medium" style={{ color: "var(--rp-text-secondary)" }}>
          Karten werden geladen…
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 flex-col"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="flex-1 flex flex-col px-4 pb-5">
        {/* Header: Frage pill + Block pill */}
        <div className="flex items-center justify-between mt-2 mb-4">
          <span
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-sm font-semibold"
            style={{
              background: "var(--rp-bg-elevated)",
              color: "var(--rp-text-secondary)",
              boxShadow: "0 2px 8px rgba(42, 42, 74, 0.06)",
            }}
          >
            Frage <span style={{ color: "var(--rp-peach)" }}>{blockNum}</span>/{totalBlocks}
          </span>

          <div className="flex items-center gap-2">
            <TimerPill timerSeconds={game.currentBlock?.timer_seconds} startedAt={game.currentBlock?.started_at} />
            {/* Correct-found pill */}
            <span
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-sm font-semibold"
              style={{
                background: "var(--rp-bg-elevated)",
                color: "var(--rp-text-secondary)",
                boxShadow: "0 2px 8px rgba(42, 42, 74, 0.06)",
              }}
            >
              {correctFound}/4
            </span>
          </div>
        </div>

        {/* Question card */}
        <div
          className="p-5"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
            marginBottom: !localPlayerTapped && game.questionDeadlineMs != null ? 0 : 16,
          }}
        >
          <h2
            className="text-xl font-bold leading-snug"
            style={{ color: "var(--rp-text)" }}
          >
            {prompt.prompt}
          </h2>
        </div>

        {/* Countdown bar — hidden once the local player has tapped */}
        {!localPlayerTapped && game.questionDeadlineMs != null && (
          <QuestionTimerBar
            key={game.currentBlock!.id}
            deadlineMs={game.questionDeadlineMs}
            durationMs={QUESTION_TIMER_MS}
          />
        )}

        {/* Answer buttons */}
        <div className="space-y-2.5 mb-4 flex-1">
          {payload.cards.map((card, i) => {
            const tapped = tappedIndices.has(i);
            const result = turnResults.get(i);
            const isCorrect = result?.is_correct;

            let borderColor = CARD_STYLE.border;
            let bgColor = CARD_STYLE.bg;
            let opacity = "1";
            let boxShadow = "none";

            if (tapped && result) {
              if (isCorrect) {
                borderColor = "var(--rp-success)";
                bgColor = "rgba(61, 204, 138, 0.1)";
              } else {
                borderColor = "var(--rp-danger)";
                bgColor = "rgba(255, 92, 122, 0.06)";
                opacity = "0.6";
              }
            } else if (tapped) {
              borderColor = "var(--rp-purple)";
              boxShadow = "0 0 0 3px var(--rp-purple-soft)";
            }

            return (
              <button
                key={i}
                onClick={() => void game.tapCard(i)}
                disabled={tapped || !game.isMyTurn}
                className="w-full flex items-center gap-3 px-4 min-h-[56px] py-3 text-left transition-all active:scale-[0.98] disabled:active:scale-100"
                style={{
                  background: bgColor,
                  borderRadius: "var(--rp-radius-md)",
                  border: `2px solid ${borderColor}`,
                  boxShadow,
                  opacity,
                }}
              >
                {/* Letter badge */}
                <span
                  className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold shrink-0"
                  style={{
                    background: tapped && result
                      ? isCorrect ? "var(--rp-success)" : "var(--rp-danger)"
                      : "var(--rp-bg-elevated)",
                    color: tapped && result ? "white" : CARD_STYLE.label,
                    boxShadow: tapped && result ? "none" : "0 2px 6px rgba(42, 42, 74, 0.08)",
                  }}
                >
                  {tapped && result
                    ? isCorrect ? "✓" : "✗"
                    : ANSWER_LABELS[i]}
                </span>
                <span
                  className="flex-1 text-[15px] font-semibold leading-snug"
                  style={{ color: "var(--rp-text)" }}
                >
                  {card}
                </span>
              </button>
            );
          })}
        </div>

        {/* Turn / waiting indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          <PeopleIcon className="w-5 h-5" style={{ color: "var(--rp-purple-soft)" }} />
          <span className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
            {game.isMyTurn ? (
              <span className="font-semibold" style={{ color: "var(--rp-peach)" }}>
                Du bist dran!
              </span>
            ) : activePlayer ? (
              <>
                <span className="font-semibold" style={{ color: "var(--rp-text)" }}>
                  {activePlayer.display_name}
                </span>
                {" "}ist dran…
              </>
            ) : (
              <span className="font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
                Warte auf n\u00e4chsten Spieler\u2026
              </span>
            )}
          </span>
          <div className="flex gap-1 ml-1">
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "var(--rp-text-secondary)",
                  opacity: 0.4,
                  animation: `fade-in 0.6s ease-in-out ${d * 0.2}s infinite alternate`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Waiting footer */}
      <WaitingFooter answered={tappedPlayerCount} total={game.players.length} />
    </div>
  );
}
