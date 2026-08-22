"use client";

import { useGame, useGameDispatch } from "@/lib/game-context";

export function ScoreboardScreen() {
  const game = useGame();
  const dispatch = useGameDispatch();

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const isLastQuestion =
    game.currentQuestionIndex >= game.questions.length - 1;

  function handleNext() {
    dispatch({ type: "NEXT_QUESTION" });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 px-4 py-8">
      <div className="w-full max-w-lg">
        <h2 className="mb-2 text-center text-3xl sm:text-4xl font-black text-white">
          Zwischenstand
        </h2>
        <p className="mb-8 text-center text-white/80">
          Nach Frage {game.currentQuestionIndex + 1} von{" "}
          {game.questions.length}
        </p>

        {/* Podium for top 3 */}
        {sortedPlayers.length >= 3 && (
          <div className="mb-6 flex items-end justify-center gap-2 sm:gap-4">
            {/* 2nd place */}
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{sortedPlayers[1].avatar}</span>
              <div className="w-20 sm:w-24 rounded-t-2xl bg-white/20 px-2 py-4 text-center backdrop-blur-sm h-24">
                <p className="text-xs text-white/70 truncate">
                  {sortedPlayers[1].name}
                </p>
                <p className="text-lg font-black text-white">
                  {sortedPlayers[1].score}
                </p>
                <p className="text-2xl">🥈</p>
              </div>
            </div>
            {/* 1st place */}
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-1">{sortedPlayers[0].avatar}</span>
              <div className="w-24 sm:w-28 rounded-t-2xl bg-white/30 px-2 py-4 text-center backdrop-blur-sm h-32 ring-2 ring-yellow-300/50">
                <p className="text-xs text-white/80 truncate font-semibold">
                  {sortedPlayers[0].name}
                </p>
                <p className="text-2xl font-black text-white">
                  {sortedPlayers[0].score}
                </p>
                <p className="text-3xl">🥇</p>
              </div>
            </div>
            {/* 3rd place */}
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{sortedPlayers[2].avatar}</span>
              <div className="w-20 sm:w-24 rounded-t-2xl bg-white/15 px-2 py-4 text-center backdrop-blur-sm h-20">
                <p className="text-xs text-white/60 truncate">
                  {sortedPlayers[2].name}
                </p>
                <p className="text-lg font-black text-white">
                  {sortedPlayers[2].score}
                </p>
                <p className="text-2xl">🥉</p>
              </div>
            </div>
          </div>
        )}

        {/* Full ranking */}
        <div className="mb-8 space-y-2">
          {sortedPlayers.map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all animate-fade-in ${
                i === 0
                  ? "bg-yellow-400/20 border border-yellow-400/30"
                  : "bg-white/10"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="w-8 text-center text-lg font-black text-white/60">
                {i + 1}.
              </span>
              <span className="text-2xl">{player.avatar}</span>
              <span className="flex-1 font-bold text-white">
                {player.name}
                {player.id === game.hostId && (
                  <span className="ml-2 text-xs text-white/50">(Du)</span>
                )}
              </span>
              <span className="text-lg font-black text-white tabular-nums">
                {player.score}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-purple-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
        >
          {isLastQuestion ? "Ergebnis anzeigen 🏆" : "Nächste Frage →"}
        </button>
      </div>
    </div>
  );
}
