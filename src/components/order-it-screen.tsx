"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";
import { TimerPill } from "./timer-pill";
import { QuestionTimerBar } from "./question-timer-bar";
import { WaitingFooter } from "./waiting-footer";
import { ORDER_IT_TIMER_MS, modeLabelDe } from "@/lib/game-store";
import type { OrderItPayload } from "@/lib/content";

interface OrderEntry {
  orig: number;
  text: string;
}

function shuffleEntries(items: string[], correctOrder: number[]): OrderEntry[] {
  const entries: OrderEntry[] = items.map((text, orig) => ({ orig, text }));
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  const alreadyCorrect =
    entries.length === correctOrder.length &&
    entries.every((e, i) => e.orig === correctOrder[i]);
  if (alreadyCorrect && entries.length > 1) {
    [entries[0], entries[1]] = [entries[1], entries[0]];
  }
  return entries;
}

export function OrderItScreen() {
  const game = useGame();
  const [submitted, setSubmitted] = useState(false);
  const [entries, setEntries] = useState<OrderEntry[]>([]);
  const lastPromptRef = useRef<string | null>(null);

  const prompt = game.currentPrompt;
  const payload = prompt?.payload as OrderItPayload | undefined;
  const hasAnswered = game.phase === "order_it_waiting";

  useEffect(() => {
    if (!prompt?.id || !payload?.items) return;
    if (prompt.id === lastPromptRef.current) return;
    lastPromptRef.current = prompt.id;
    setSubmitted(false);
    setEntries(shuffleEntries(payload.items, payload.correct_order ?? []));
  }, [prompt?.id, payload]);

  const answeredCount = game.roundAnswers.length;
  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 4;

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= entries.length) return;
    setEntries((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (submitted || hasAnswered || entries.length === 0) return;
    setSubmitted(true);
    try {
      await game.submitOrderIt(entries.map((e) => e.orig));
    } catch {
      setSubmitted(false);
    }
  }, [submitted, hasAnswered, entries, game]);

  if (!prompt || !payload || (payload.items?.length ?? 0) === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "var(--rp-bg-hero)" }}
      >
        <div className="text-lg animate-pulse font-medium" style={{ color: "var(--rp-text-secondary)" }}>
          Reihenfolge wird geladen…
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
              {modeLabelDe("order_it")}
            </span>
          </div>
        </div>

        <div
          className="p-5"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
            marginBottom: !waiting && game.questionDeadlineMs != null ? 0 : 16,
          }}
        >
          <h2 className="text-xl font-bold leading-snug" style={{ color: "var(--rp-text)" }}>
            {prompt.prompt}
          </h2>
          {payload.order_axis && (
            <p className="mt-2 text-sm" style={{ color: "var(--rp-text-secondary)" }}>
              Achse: {payload.order_axis}
            </p>
          )}
        </div>

        {!waiting && game.questionDeadlineMs != null && (
          <QuestionTimerBar
            key={game.currentBlock!.id}
            deadlineMs={game.questionDeadlineMs}
            durationMs={ORDER_IT_TIMER_MS}
          />
        )}

        {!waiting ? (
          <div className="space-y-2 mb-4">
            {entries.map((entry, i) => (
              <div
                key={`${entry.orig}-${i}`}
                className="flex items-center gap-2 px-3 min-h-[56px] py-2"
                style={{
                  background: "var(--rp-bg-elevated)",
                  borderRadius: "var(--rp-radius-md)",
                  border: "2px solid var(--rp-border)",
                  boxShadow: "0 2px 6px rgba(42, 42, 74, 0.08)",
                }}
              >
                <span
                  className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold shrink-0"
                  style={{ background: "var(--rp-purple-soft)", color: "var(--rp-text)" }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-[15px] font-semibold leading-snug" style={{ color: "var(--rp-text)" }}>
                  {entry.text}
                </span>
                <div className="flex flex-col shrink-0">
                  <button
                    type="button"
                    aria-label="Nach oben"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="min-w-11 min-h-[22px] flex items-center justify-center disabled:opacity-30"
                    style={{ color: "var(--rp-text-secondary)" }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="Nach unten"
                    disabled={i === entries.length - 1}
                    onClick={() => move(i, 1)}
                    className="min-w-11 min-h-[22px] flex items-center justify-center disabled:opacity-30"
                    style={{ color: "var(--rp-text-secondary)" }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => void handleSubmit()}
              className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
                boxShadow: "0 6px 20px rgba(255, 138, 113, 0.35)",
              }}
            >
              Fertig
            </button>
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
