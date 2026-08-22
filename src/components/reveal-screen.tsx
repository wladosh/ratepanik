"use client";

import { useGame, useGameDispatch } from "@/lib/game-context";

const OPTION_COLORS_BG = [
  "bg-red-500/20 border-red-500/30",
  "bg-blue-500/20 border-blue-500/30",
  "bg-emerald-500/20 border-emerald-500/30",
  "bg-amber-500/20 border-amber-500/30",
];

export function RevealScreen() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const question = game.questions[game.currentQuestionIndex];
  const hostPlayer = game.players.find((p) => p.id === game.hostId);
  const hostCorrect = hostPlayer?.currentAnswer === question.correctIndex;

  function handleContinue() {
    dispatch({ type: "SHOW_SCOREBOARD" });
  }

  const correctCount = game.players.filter(
    (p) => p.currentAnswer === question.correctIndex
  ).length;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Result emoji */}
        <div className="mb-4 text-center">
          <span className="text-6xl sm:text-7xl animate-bounce-slow">
            {hostCorrect ? "🎉" : "😬"}
          </span>
        </div>

        {/* Result text */}
        <h2 className="mb-2 text-center text-2xl sm:text-3xl font-black text-white">
          {hostCorrect ? "Richtig!" : "Falsch!"}
        </h2>
        <p className="mb-8 text-center text-white/70">
          {correctCount} von {game.players.length} Spielern lagen richtig
        </p>

        {/* Answer breakdown */}
        <div className="mb-8 space-y-3">
          {question.options.map((option, i) => {
            const isCorrect = i === question.correctIndex;
            const voterCount = game.players.filter(
              (p) => p.currentAnswer === i
            ).length;
            const voters = game.players.filter((p) => p.currentAnswer === i);

            return (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl border-2 p-4 transition-all ${
                  isCorrect
                    ? "border-green-400 bg-green-500/20 ring-2 ring-green-400/30"
                    : OPTION_COLORS_BG[i]
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCorrect && <span className="text-xl">✅</span>}
                    <span
                      className={`font-bold ${
                        isCorrect ? "text-green-300" : "text-white/80"
                      }`}
                    >
                      {option}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {voters.map((v) => (
                      <span
                        key={v.id}
                        className="text-lg"
                        title={v.name}
                      >
                        {v.avatar}
                      </span>
                    ))}
                    <span className="text-sm text-white/50">
                      ({voterCount})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Points earned */}
        {hostPlayer && (
          <div className="mb-6 rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
            <p className="text-sm text-white/60">Deine Punkte diese Runde</p>
            <p className="text-3xl font-black text-white">
              +
              {hostCorrect
                ? Math.round(
                    1000 +
                      500 *
                        Math.max(
                          0,
                          1 -
                            (hostPlayer.answerTime ?? game.timePerQuestion * 1000) /
                              (game.timePerQuestion * 1000)
                        )
                  )
                : 0}
            </p>
          </div>
        )}

        <button
          onClick={handleContinue}
          className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-purple-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
        >
          Weiter zum Scoreboard →
        </button>
      </div>
    </div>
  );
}
