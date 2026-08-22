"use client";

import { useState } from "react";
import { useGame, useGameDispatch } from "@/lib/game-context";

const BOT_NAMES = [
  "SchlauerFuchs",
  "QuizQueen",
  "BrainBoss",
  "WissenWolf",
  "DenkDiva",
  "RätselRitter",
  "FrageFee",
  "NerdNinja",
];

export function LobbyScreen() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [newPlayerName, setNewPlayerName] = useState("");

  function handleAddPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    dispatch({ type: "ADD_PLAYER", name });
    setNewPlayerName("");
  }

  function handleAddBot() {
    const usedNames = game.players.map((p) => p.name);
    const available = BOT_NAMES.filter((n) => !usedNames.includes(n));
    const botName =
      available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : `Bot${game.players.length}`;
    dispatch({ type: "ADD_PLAYER", name: botName });
  }

  function handleStart() {
    if (game.players.length < 2) return;
    dispatch({ type: "START_GAME" });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 px-4 py-6">
      <div className="mx-auto w-full max-w-lg flex-1">
        {/* Header */}
        <div className="mb-6 text-center">
          <button
            onClick={() => dispatch({ type: "GO_HOME" })}
            className="mb-4 text-white/70 hover:text-white text-sm transition-colors"
          >
            ← Zurück
          </button>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Lobby
          </h2>
          <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white/20 px-6 py-3 backdrop-blur-sm">
            <span className="text-sm font-medium text-white/80">
              Raumcode:
            </span>
            <span className="text-2xl font-black tracking-widest text-white">
              {game.roomCode}
            </span>
          </div>
        </div>

        {/* Players */}
        <div className="mb-6 rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">
            Spieler ({game.players.length})
          </h3>
          <div className="space-y-2">
            {game.players.map((player, i) => (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 animate-fade-in"
              >
                <span className="text-2xl">{player.avatar}</span>
                <span className="flex-1 font-bold text-white">
                  {player.name}
                </span>
                {i === 0 && (
                  <span className="rounded-full bg-yellow-400/80 px-3 py-0.5 text-xs font-bold text-yellow-900">
                    Host
                  </span>
                )}
                {i > 0 && (
                  <button
                    onClick={() =>
                      dispatch({
                        type: "REMOVE_PLAYER",
                        playerId: player.id,
                      })
                    }
                    className="text-white/40 hover:text-red-300 text-lg transition-colors"
                    aria-label={`${player.name} entfernen`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add player */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
            placeholder="Spieler hinzufügen..."
            maxLength={20}
            className="flex-1 rounded-2xl border-2 border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 backdrop-blur-sm focus:border-white/50 focus:outline-none transition-all"
          />
          <button
            onClick={handleAddPlayer}
            disabled={!newPlayerName.trim()}
            className="rounded-2xl bg-white/20 px-5 py-3 font-bold text-white backdrop-blur-sm transition-all hover:bg-white/30 disabled:opacity-40"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddBot}
          className="mb-6 w-full rounded-2xl border-2 border-dashed border-white/30 px-4 py-3 text-sm font-medium text-white/70 transition-all hover:border-white/50 hover:text-white"
        >
          🤖 Bot hinzufügen (zum Testen)
        </button>

        {/* Start */}
        <button
          onClick={handleStart}
          disabled={game.players.length < 2}
          className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-purple-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {game.players.length < 2
            ? "Mindestens 2 Spieler nötig"
            : `Spiel starten! 🎮`}
        </button>
      </div>
    </div>
  );
}
