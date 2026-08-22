"use client";

import { useGame } from "@/lib/game-context";

const RANK_MESSAGES = [
  "Absoluter Quizkönig! 👑",
  "Knapp daneben ist auch vorbei! 😅",
  "Solide Leistung! 💪",
];

export function FinalScreen() {
  const game = useGame();

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  if (!winner) return null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-600 px-4 py-8">
      <div className="w-full max-w-lg text-center">
        {/* Celebration */}
        <div className="mb-4 text-7xl sm:text-8xl animate-bounce-slow">🏆</div>
        <h1 className="mb-2 text-4xl sm:text-5xl font-black text-white drop-shadow-lg">
          Spielende!
        </h1>
        <p className="mb-8 text-xl text-white/90">
          Und der Gewinner ist...
        </p>

        {/* Winner card */}
        <div className="mb-8 rounded-3xl bg-white/20 p-8 backdrop-blur-sm ring-2 ring-white/30">
          <span className="text-6xl">{game.getAvatar(winner.id)}</span>
          <h2 className="mt-4 text-3xl font-black text-white">
            {winner.display_name}
          </h2>
          <p className="mt-2 text-5xl font-black text-yellow-200">
            {winner.score}
          </p>
          <p className="mt-1 text-sm text-white/70">Punkte</p>
        </div>

        {/* All rankings */}
        <div className="mb-8 space-y-2">
          {sortedPlayers.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm animate-fade-in"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <span className="w-8 text-center text-lg font-black text-white/70">
                {i === 0
                  ? "🥇"
                  : i === 1
                    ? "🥈"
                    : i === 2
                      ? "🥉"
                      : `${i + 1}.`}
              </span>
              <span className="text-2xl">{game.getAvatar(player.id)}</span>
              <div className="flex-1 text-left">
                <p className="font-bold text-white">
                  {player.display_name}
                  {player.id === game.myPlayerId && (
                    <span className="ml-2 text-xs text-white/50">(Du)</span>
                  )}
                </p>
                <p className="text-xs text-white/50">
                  {i < RANK_MESSAGES.length
                    ? RANK_MESSAGES[i]
                    : "Gut gespielt!"}
                </p>
              </div>
              <span className="text-lg font-black text-white tabular-nums">
                {player.score}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {game.isHost ? (
            <button
              onClick={() => void game.resetGame()}
              className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-orange-600 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
            >
              Nochmal spielen! 🔄
            </button>
          ) : (
            <div className="w-full rounded-2xl bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
              <p className="font-bold text-white/80">
                Der Host kann eine neue Runde starten
              </p>
            </div>
          )}
          <button
            onClick={game.goHome}
            className="w-full rounded-2xl border-2 border-white/30 px-6 py-3 text-base font-bold text-white transition-all hover:bg-white/10"
          >
            Neues Spiel
          </button>
        </div>
      </div>
    </div>
  );
}
