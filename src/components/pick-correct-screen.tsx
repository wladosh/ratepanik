"use client";

import { useState, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";

export function PickCorrectScreen() {
  const game = useGame();
  const prompt = game.currentPrompt;
  const hasAnswered = game.answers.some((a) => a.player_id === game.myPlayerId);

  const [selectedCards, setSelectedCards] = useState<number[]>([]);
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
          void game.submitPickCorrectCard(-1);
        }
      }
    }, 100);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentBlockIndex, game.currentRoundInBlock]);

  function handleCardTap(cardIndex: number) {
    if (hasAnswered || submittedRef.current || selectedCards.includes(cardIndex)) return;

    const newSelected = [...selectedCards, cardIndex];
    setSelectedCards(newSelected);

    submittedRef.current = true;
    void game.submitPickCorrectCard(cardIndex);
  }

  if (!prompt) return null;

  const payload = prompt.payload as { cards: string[]; correct_indices: number[] };
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
            background: isUrgent ? "var(--rp-danger)" : "var(--rp-sky)",
          }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <span
            className="rounded-[var(--rp-radius-pill)] px-4 py-1.5 text-xs font-bold"
            style={{ background: "rgba(126, 182, 255, 0.2)", color: "var(--rp-sky)" }}
          >
            Passendes wählen
          </span>
          <span className="text-sm font-semibold text-[var(--rp-text-secondary)]">
            Block {game.currentBlockIndex + 1} · Runde {game.currentRoundInBlock + 1}
          </span>
        </div>

        {/* Timer */}
        <div className="mb-3 text-center">
          <span
            className="text-3xl font-extrabold tabular-nums"
            style={{ color: isUrgent ? "var(--rp-danger)" : "var(--rp-text)" }}
          >
            {Math.ceil(timeLeft)}
          </span>
        </div>

        {/* Question */}
        <div
          className="mb-5 p-5"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <p className="text-center text-base font-bold text-[var(--rp-text)]">
            {prompt.prompt}
          </p>
          {prompt.hint && (
            <p className="mt-1 text-center text-xs text-[var(--rp-text-secondary)]">
              💡 {prompt.hint}
            </p>
          )}
          <p className="mt-2 text-center text-xs text-[var(--rp-text-secondary)]">
            Wähle 1 Karte — 4 von 8 sind richtig!
          </p>
        </div>

        {/* 8 Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {payload.cards.map((card, i) => {
            const isSelected = selectedCards.includes(i);
            const isDisabled = hasAnswered;

            return (
              <button
                key={i}
                onClick={() => handleCardTap(i)}
                disabled={isDisabled || isSelected}
                className="relative rounded-[var(--rp-radius-md)] p-4 text-center text-sm font-bold transition-all active:scale-[0.95]"
                style={{
                  background: isSelected
                    ? "var(--rp-purple-soft)"
                    : "var(--rp-bg-elevated)",
                  boxShadow: isSelected ? "none" : "var(--rp-shadow-card)",
                  color: isSelected ? "var(--rp-purple)" : "var(--rp-text)",
                  opacity: isDisabled && !isSelected ? 0.5 : 1,
                }}
              >
                {card}
                {isSelected && (
                  <span className="absolute top-1 right-2 text-xs">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Status */}
        {hasAnswered && (
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-[var(--rp-text)]">
              Gewählt! Warte auf andere Spieler...
            </p>
            <p className="mt-1 text-xs text-[var(--rp-text-secondary)]">
              {game.answers.length} von {game.players.length} haben gewählt
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
