"use client";

import { useGame } from "@/lib/game-context";

const OPTION_COLORS_BG = [
  "bg-red-500/20 border-red-500/30",
  "bg-blue-500/20 border-blue-500/30",
  "bg-emerald-500/20 border-emerald-500/30",
  "bg-amber-500/20 border-amber-500/30",
];

export function RevealScreen() {
  const game = useGame();
  const question = game.currentQuestion;

  if (!question) return null;

  const myAnswer = game.answers.find((a) => a.player_id === game.myPlayerId);
  const myCorrect =
    myAnswer !== undefined && myAnswer.choice_index === question.correctIndex;

  const correctCount = game.answers.filter(
    (a) => a.choice_index === question.correctIndex
  ).length;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Result emoji */}
        <div className="mb-4 text-center">
          <span className="text-6xl sm:text-7xl animate-bounce-slow">
            {myCorrect ? "🎉" : "😬"}
          </span>
        </div>

        {/* Result text */}
        <h2 className="mb-2 text-center text-2xl sm:text-3xl font-black text-white">
          {myAnswer?.choice_index === -1
            ? "Zu spät!"
            : myCorrect
              ? "Richtig!"
              : "Falsch!"}
        </h2>
        <p className="mb-8 text-center text-white/70">
          {correctCount} von {game.players.length} Spielern lagen richtig
        </p>

        {/* Answer breakdown */}
        <div className="mb-8 space-y-3">
          {question.options.map((option, i) => {
            const isCorrect = i === question.correctIndex;
            const voters = game.players.filter((p) =>
              game.answers.some(
                (a) => a.player_id === p.id && a.choice_index === i
              )
            );
            const voterCount = voters.length;

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
                        title={v.display_name}
                      >
                        {game.getAvatar(v.id)}
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
        <div className="mb-6 rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
          <p className="text-sm text-white/60">Deine Punkte diese Runde</p>
          <p className="text-3xl font-black text-white">
            +{game.lastRoundPoints}
          </p>
        </div>

        <button
          onClick={game.showScoreboard}
          className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-purple-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
        >
          Weiter zum Scoreboard →
        </button>
      </div>
    </div>
  );
}
