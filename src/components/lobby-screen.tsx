"use client";

import { useGame } from "@/lib/game-context";

export function LobbyScreen() {
  const game = useGame();

  async function handleStart() {
    if (game.players.length < 2) return;
    await game.startGame();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 px-4 py-6">
      <div className="mx-auto w-full max-w-lg flex-1">
        {/* Header */}
        <div className="mb-6 text-center">
          <button
            onClick={game.goHome}
            className="mb-4 text-white/70 hover:text-white text-sm transition-colors"
          >
            ← Verlassen
          </button>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Lobby</h2>
          <div className="mt-3 inline-flex flex-col items-center gap-1 rounded-2xl bg-white/20 px-6 py-3 backdrop-blur-sm">
            <span className="text-sm font-medium text-white/80">
              Raumcode:
            </span>
            <span className="text-3xl font-black tracking-[0.3em] text-white select-all">
              {game.room?.code}
            </span>
            <span className="text-xs text-white/60">
              Teile diesen Code mit deinen Freunden!
            </span>
          </div>
        </div>

        {/* Players */}
        <div className="mb-6 rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">
            Spieler ({game.players.length})
          </h3>
          <div className="space-y-2">
            {game.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 animate-fade-in"
              >
                <span className="text-2xl">{game.getAvatar(player.id)}</span>
                <span className="flex-1 font-bold text-white">
                  {player.display_name}
                  {player.id === game.myPlayerId && (
                    <span className="ml-2 text-xs text-white/50">(Du)</span>
                  )}
                </span>
                {player.is_host && (
                  <span className="rounded-full bg-yellow-400/80 px-3 py-0.5 text-xs font-bold text-yellow-900">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>

          {game.players.length < 2 && (
            <p className="mt-3 text-center text-sm text-white/50">
              Warte auf weitere Spieler...
            </p>
          )}
        </div>

        {/* Start / waiting */}
        {game.isHost ? (
          <button
            onClick={handleStart}
            disabled={game.players.length < 2}
            className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-purple-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {game.players.length < 2
              ? "Mindestens 2 Spieler nötig"
              : "Spiel starten! 🎮"}
          </button>
        ) : (
          <div className="w-full rounded-2xl bg-white/10 px-6 py-4 text-center backdrop-blur-sm">
            <p className="text-lg font-bold text-white/80">
              Warte auf den Host... ⏳
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
