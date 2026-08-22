"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";
import type { NumberGuessPayload } from "@/lib/content";

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
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
        <div className="text-white/60 text-lg animate-pulse">Frage wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 px-4 py-6">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80 backdrop-blur-sm">
            🔢 Zahlenraten
          </span>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80 backdrop-blur-sm">
            Block {blockNum} · Runde {roundNum}/{roundsTotal}
          </span>
        </div>

        {/* Question */}
        <div className="mb-6 rounded-3xl bg-white/10 p-6 sm:p-8 backdrop-blur-sm">
          <h2 className="text-center text-xl sm:text-2xl font-bold text-white leading-relaxed">
            {prompt.prompt}
          </h2>
          {payload?.unit && (
            <p className="mt-2 text-center text-sm text-white/50">
              Antwort in: {payload.unit}
            </p>
          )}
          {prompt.hint && (
            <p className="mt-2 text-center text-sm text-white/40 italic">
              Hinweis: {prompt.hint}
            </p>
          )}
        </div>

        {/* Input */}
        {!hasAnswered && !submitted ? (
          <div className="mb-6 space-y-4">
            <input
              type="number"
              inputMode="decimal"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Deine Schätzung..."
              autoFocus
              className="w-full rounded-2xl border-2 border-white/20 bg-white/10 px-6 py-5 text-center text-3xl font-black text-white placeholder:text-white/30 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
            <button
              onClick={handleSubmit}
              disabled={!guess || isNaN(parseFloat(guess))}
              className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-indigo-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              Antwort abgeben
            </button>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm animate-fade-in">
            <p className="text-xl font-bold text-white">Abgegeben!</p>
            <p className="mt-2 text-sm text-white/60">
              {answeredCount} von {game.players.length} haben geantwortet
            </p>
            <div className="mt-4 flex justify-center gap-1.5">
              {game.players.map((p) => {
                const answered = game.roundAnswers.some((a) => a.player_id === p.id);
                return (
                  <span
                    key={p.id}
                    className={`text-xl transition-opacity ${answered ? "opacity-100" : "opacity-30"}`}
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
