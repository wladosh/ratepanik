"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGame } from "@/lib/game-context";

const OPTION_COLORS = [
  "from-red-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-green-600",
  "from-amber-500 to-orange-600",
];

const OPTION_ICONS = ["▲", "◆", "●", "■"];

export function QuestionScreen() {
  const game = useGame();
  const question = game.currentQuestion;
  const myAnswer = game.answers.find((a) => a.player_id === game.myPlayerId);
  const hasAnswered = !!myAnswer;

  const [timeLeft, setTimeLeft] = useState(game.timePerQuestion);
  const [isExpired, setIsExpired] = useState(false);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  const handleTimeout = useCallback(() => {
    setIsExpired(true);
    if (!submittedRef.current) {
      submittedRef.current = true;
      void game.submitAnswer(-1, game.timePerQuestion * 1000);
    }
  }, [game]);

  useEffect(() => {
    submittedRef.current = !!myAnswer;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on question change
    setIsExpired(false);
    const now = performance.now();
    startTimeRef.current = now;

    const timer = setInterval(() => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, game.timePerQuestion - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleTimeout();
      }
    }, 100);

    timerRef.current = timer;
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentQuestionIndex]);

  function handleAnswer(optionIndex: number) {
    if (hasAnswered || isExpired || submittedRef.current) return;
    submittedRef.current = true;

    // eslint-disable-next-line react-hooks/purity -- event handler, not render
    const timeMs = performance.now() - startTimeRef.current;
    void game.submitAnswer(optionIndex, timeMs);
  }

  if (!question) return null;

  const progress = timeLeft / game.timePerQuestion;
  const isUrgent = timeLeft <= 5;
  const answeredCount = game.answers.length;

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
      {/* Timer bar */}
      <div className="relative h-2 w-full bg-white/10">
        <div
          className={`h-full transition-all duration-100 ease-linear ${
            isUrgent
              ? "bg-red-500"
              : "bg-gradient-to-r from-green-400 to-emerald-500"
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4 sm:py-6">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80 backdrop-blur-sm">
            {question.category}
          </span>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80 backdrop-blur-sm">
            Frage {game.currentQuestionIndex + 1}/{game.questions.length}
          </span>
        </div>

        {/* Timer display */}
        <div className="mb-6 text-center">
          <span
            className={`text-5xl sm:text-6xl font-black tabular-nums ${
              isUrgent ? "text-red-400 animate-pulse" : "text-white"
            }`}
          >
            {Math.ceil(timeLeft)}
          </span>
        </div>

        {/* Question text */}
        <div className="mb-8 rounded-3xl bg-white/10 p-6 sm:p-8 backdrop-blur-sm">
          <h2 className="text-center text-xl sm:text-2xl font-bold text-white leading-relaxed">
            {question.text}
          </h2>
        </div>

        {/* Answer options */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={hasAnswered || isExpired}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${OPTION_COLORS[i]} p-4 sm:p-5 text-left shadow-lg transition-all ${
                hasAnswered || isExpired
                  ? "opacity-60"
                  : "hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              } ${
                hasAnswered && myAnswer?.choice_index === i
                  ? "ring-4 ring-white opacity-100"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white">
                  {OPTION_ICONS[i]}
                </span>
                <span className="flex-1 text-base sm:text-lg font-bold text-white">
                  {option}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Answered indicator */}
        {hasAnswered && (
          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm animate-fade-in">
            <p className="text-xl font-bold text-white">Geantwortet! ✓</p>
            <p className="mt-1 text-sm text-white/60">
              {answeredCount} von {game.players.length} haben geantwortet
            </p>
            <div className="mt-3 flex justify-center gap-1">
              {game.players.map((p) => {
                const answered = game.answers.some(
                  (a) => a.player_id === p.id
                );
                return (
                  <span
                    key={p.id}
                    className={`text-xl transition-opacity ${
                      answered ? "opacity-100" : "opacity-30"
                    }`}
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
