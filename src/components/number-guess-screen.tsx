"use client";

import { useState, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";

export function NumberGuessScreen() {
  const game = useGame();
  const prompt = game.currentPrompt;
  const hasAnswered = game.answers.some((a) => a.player_id === game.myPlayerId);

  const [guess, setGuess] = useState("");
  const [timeLeft, setTimeLeft] = useState(game.timePerQuestion);
  const startTimeRef = useRef<number>(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    submittedRef.current = hasAnswered;
    startTimeRef.current = performance.now();

    const timer = setInterval(() => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, game.timePerQuestion - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (!submittedRef.current) {
          submittedRef.current = true;
          void game.submitNumberGuess(0, game.timePerQuestion * 1000);
        }
      }
    }, 100);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentBlockIndex, game.currentRoundInBlock]);

  function handleSubmit() {
    if (hasAnswered || submittedRef.current || !guess.trim()) return;
    submittedRef.current = true;
    const timeMs = performance.now() - startTimeRef.current;
    const numericGuess = parseFloat(guess.replace(",", "."));
    if (isNaN(numericGuess)) return;
    void game.submitNumberGuess(numericGuess, timeMs);
  }

  if (!prompt) return null;

  const payload = prompt.payload as { answer: number; unit?: string };
  const progress = timeLeft / game.timePerQuestion;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: "var(--rp-bg-hero)" }}>
      {/* Timer bar */}
      <div className="relative h-2 w-full bg-[var(--rp-border)]">
        <div
          className="h-full transition-all duration-100 ease-linear"
          style={{
            width: `${progress * 100}%`,
            background: isUrgent ? "var(--rp-danger)" : "var(--rp-mint)",
          }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <span
            className="rounded-[var(--rp-radius-pill)] px-4 py-1.5 text-xs font-bold"
            style={{ background: "var(--rp-purple-soft)", color: "var(--rp-purple)" }}
          >
            Zahlenraten
          </span>
          <span className="text-sm font-semibold text-[var(--rp-text-secondary)]">
            Block {game.currentBlockIndex + 1} · Runde {game.currentRoundInBlock + 1}
          </span>
        </div>

        {/* Timer display */}
        <div className="mb-4 text-center">
          <span
            className="text-4xl font-extrabold tabular-nums"
            style={{ color: isUrgent ? "var(--rp-danger)" : "var(--rp-text)" }}
          >
            {Math.ceil(timeLeft)}
          </span>
        </div>

        {/* Question */}
        <div
          className="mb-6 p-6"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <p className="text-center text-lg font-bold text-[var(--rp-text)] leading-relaxed">
            {prompt.prompt}
          </p>
          {prompt.hint && (
            <p className="mt-2 text-center text-sm text-[var(--rp-text-secondary)]">
              💡 {prompt.hint}
            </p>
          )}
        </div>

        {/* Input */}
        {!hasAnswered ? (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Deine Schätzung"
                autoFocus
                className="w-full h-[56px] rounded-[var(--rp-radius-md)] border-2 px-5 text-xl font-bold text-center text-[var(--rp-text)] placeholder:text-gray-300 focus:outline-none transition-all"
                style={{
                  borderColor: "var(--rp-border)",
                  background: "var(--rp-bg-elevated)",
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
              {payload.unit && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--rp-text-secondary)]">
                  {payload.unit}
                </span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!guess.trim()}
              className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
                boxShadow: guess.trim() ? "0 4px 16px rgba(255, 138, 113, 0.35)" : "none",
              }}
            >
              Abgeben
            </button>
          </div>
        ) : (
          <div
            className="p-6 text-center"
            style={{
              background: "var(--rp-bg-elevated)",
              borderRadius: "var(--rp-radius-lg)",
              boxShadow: "var(--rp-shadow-card)",
            }}
          >
            <p className="text-xl font-bold text-[var(--rp-text)]">Abgegeben! ✓</p>
            <p className="mt-2 text-sm text-[var(--rp-text-secondary)]">
              {game.answers.length} von {game.players.length} haben geantwortet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
