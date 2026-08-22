"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";
import type { NumberGuessPayload } from "@/lib/content";

function PeopleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

export function NumberGuessScreen() {
  const game = useGame();
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const lastPromptRef = useRef<string | null>(null);

  const prompt = game.currentPrompt;
  const payload = prompt?.payload as NumberGuessPayload | undefined;
  const hasAnswered = game.phase === "number_guess_waiting";

  useEffect(() => {
    if (prompt?.id && prompt.id !== lastPromptRef.current) {
      lastPromptRef.current = prompt.id;
      setGuess("");
      setSubmitted(false);
    }
  }, [prompt?.id]);

  const answeredCount = game.roundAnswers.length;
  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 4;
  const roundNum = (game.currentBlock?.current_round ?? 0) + 1;
  const roundsTotal = game.currentBlock?.rounds_total ?? 2;

  const handleSubmit = useCallback(async () => {
    const num = parseFloat(guess);
    if (isNaN(num) || submitted) return;
    setSubmitted(true);
    await game.submitNumberGuess(num);
  }, [guess, submitted, game]);

  if (!prompt) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "var(--rp-bg-hero)" }}
      >
        <div className="text-lg animate-pulse font-medium" style={{ color: "var(--rp-text-secondary)" }}>
          Frage wird geladen\u2026
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
        {/* Header pills */}
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
            {roundsTotal > 1 && (
              <span className="ml-1 text-xs opacity-60">
                &middot; Runde {roundNum}/{roundsTotal}
              </span>
            )}
          </span>

          <span
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-sm font-semibold"
            style={{
              background: "var(--rp-bg-elevated)",
              color: "var(--rp-text-secondary)",
              boxShadow: "0 2px 8px rgba(42, 42, 74, 0.06)",
            }}
          >
            Zahlenraten
          </span>
        </div>

        {/* Question card */}
        <div
          className="p-5 mb-5"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <h2
            className="text-xl font-bold leading-snug"
            style={{ color: "var(--rp-text)" }}
          >
            {prompt.prompt}
          </h2>
          {payload?.unit && (
            <p className="mt-2 text-sm" style={{ color: "var(--rp-text-secondary)" }}>
              Antwort in: {payload.unit}
            </p>
          )}
          {prompt.hint && (
            <p className="mt-2 text-sm italic" style={{ color: "var(--rp-text-secondary)", opacity: 0.7 }}>
              Hinweis: {prompt.hint}
            </p>
          )}
        </div>

        {/* Input or waiting state */}
        {!hasAnswered && !submitted ? (
          <div className="space-y-4 mb-5">
            <input
              type="number"
              inputMode="decimal"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Deine Sch\u00e4tzung\u2026"
              autoFocus
              className="w-full h-[60px] rounded-[var(--rp-radius-md)] border-2 px-5 text-center text-3xl font-black transition-all focus:outline-none"
              style={{
                borderColor: "var(--rp-border)",
                background: "var(--rp-bg-elevated)",
                color: "var(--rp-text)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--rp-focus-ring)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 124, 255, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--rp-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!guess || isNaN(parseFloat(guess))}
              className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
              style={{
                background: (!guess || isNaN(parseFloat(guess)))
                  ? "var(--rp-peach)"
                  : "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
                boxShadow: guess && !isNaN(parseFloat(guess))
                  ? "0 6px 20px rgba(255, 138, 113, 0.35)"
                  : "none",
              }}
            >
              Abschicken
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
            <div className="flex items-center justify-center gap-2 mt-3">
              <PeopleIcon className="w-5 h-5" style={{ color: "var(--rp-purple-soft)" }} />
              <span className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
                {answeredCount} von {game.players.length} haben geantwortet
              </span>
            </div>
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
    </div>
  );
}
