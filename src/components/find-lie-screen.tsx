"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";
import { TimerPill } from "./timer-pill";
import { QuestionTimerBar } from "./question-timer-bar";
import { WaitingFooter } from "./waiting-footer";
import { QUESTION_TIMER_MS, modeLabelDe } from "@/lib/game-store";
import type { FindLiePayload } from "@/lib/content";

const LABELS = ["A", "B", "C", "D"];

export function FindLieScreen() {
  const game = useGame();
  const [submitted, setSubmitted] = useState(false);
  const lastPromptRef = useRef<string | null>(null);

  const prompt = game.currentPrompt;
  const payload = prompt?.payload as FindLiePayload | undefined;
  const hasAnswered = game.phase === "find_lie_waiting";

  useEffect(() => {
    if (prompt?.id && prompt.id !== lastPromptRef.current) {
      lastPromptRef.current = prompt.id;
      setSubmitted(false);
    }
  }, [prompt?.id]);

  const answeredCount = game.roundAnswers.length;
  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 4;
  const statements = payload?.statements ?? [];

  const handlePick = useCallback(
    async (index: number) => {
      if (submitted || hasAnswered) return;
      setSubmitted(true);
      try {
        await game.submitFindLie(index);
      } catch {
        setSubmitted(false);
      }
    },
    [submitted, hasAnswered, game]
  );

  if (!prompt || !payload || statements.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "var(--rp-bg-hero)" }}
      >
        <div className="text-lg animate-pulse font-medium" style={{ color: "var(--rp-text-secondary)" }}>
          Aussagen werden geladen…
        </div>
      </div>
    );
  }

  const waiting = hasAnswered || submitted;

  return (
    <div
      className="flex flex-1 flex-col"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="flex-1 flex flex-col px-4 pb-5">
        <div className="flex items-center justify-between mt-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-11 shrink-0" aria-hidden="true" />
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
          </div>
          <div className="flex items-center gap-2">
            <TimerPill timerSeconds={game.currentBlock?.timer_seconds} startedAt={game.currentBlock?.started_at} />
            <span
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-sm font-semibold"
              style={{
                background: "var(--rp-bg-elevated)",
                color: "var(--rp-text-secondary)",
                boxShadow: "0 2px 8px rgba(42, 42, 74, 0.06)",
              }}
            >
              {modeLabelDe("find_lie")}
            </span>
          </div>
        </div>

        <div
          className="p-5"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
            marginBottom: !waiting && game.questionDeadlineMs != null ? 0 : 20,
          }}
        >
          <h2 className="text-xl font-bold leading-snug" style={{ color: "var(--rp-text)" }}>
            {prompt.prompt}
          </h2>
        </div>

        {!waiting && game.questionDeadlineMs != null && (
          <QuestionTimerBar
            key={game.currentBlock!.id}
            deadlineMs={game.questionDeadlineMs}
            durationMs={QUESTION_TIMER_MS}
          />
        )}

        {!waiting ? (
          <div className="space-y-2.5 mb-4">
            {statements.map((statement, i) => (
              <button
                key={i}
                onClick={() => void handlePick(i)}
                className="w-full flex items-center gap-3 px-4 min-h-[56px] py-3 text-left transition-all active:scale-[0.98]"
                style={{
                  background: "var(--rp-bg-elevated)",
                  borderRadius: "var(--rp-radius-md)",
                  border: "2px solid var(--rp-border)",
                  boxShadow: "0 2px 6px rgba(42, 42, 74, 0.08)",
                }}
              >
                <span
                  className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold shrink-0"
                  style={{
                    background: "var(--rp-purple-soft)",
                    color: "var(--rp-text)",
                  }}
                >
                  {LABELS[i] ?? i + 1}
                </span>
                <span className="flex-1 text-[15px] font-semibold leading-snug" style={{ color: "var(--rp-text)" }}>
                  {statement}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div
            className="p-5 mb-5 text-center animate-fade-in"
            style={{
              background: "var(--rp-bg-elevated)",
              borderRadius: "var(--rp-radius-lg)",
              boxShadow: "var(--rp-shadow-card)",
            }}
          >
            <p className="text-xl font-bold" style={{ color: "var(--rp-text)" }}>
              Abgegeben!
            </p>
            <p className="mt-2 text-sm font-semibold tracking-wide" style={{ color: "var(--rp-text-secondary)", opacity: 0.7 }}>
              Antwort weg. Kein Zurück.
            </p>
            <div className="mt-3 flex justify-center gap-2">
              {game.players.map((p) => {
                const answered = game.roundAnswers.some((a) => a.player_id === p.id);
                return (
                  <span
                    key={p.id}
                    className="text-xl transition-opacity"
                    style={{ opacity: answered ? 1 : 0.3 }}
                    title={p.display_name}
                  >
                    {game.getAvatar(p.id)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {waiting && <WaitingFooter answered={answeredCount} total={game.players.length} />}
    </div>
  );
}
