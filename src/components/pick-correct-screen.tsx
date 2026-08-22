"use client";

import { useMemo } from "react";
import { useGame } from "@/lib/game-context";
import type { PickCorrectPayload } from "@/lib/content";

const CARD_COLORS = [
  "from-rose-500 to-pink-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-pink-600",
];

export function PickCorrectScreen() {
  const game = useGame();
  const prompt = game.currentPrompt;
  const payload = prompt?.payload as PickCorrectPayload | undefined;

  const sortedPlayers = useMemo(
    () =>
      [...game.players].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [game.players]
  );

  const activePlayer = sortedPlayers[game.activePlayerIndex];
  const correctFound = game.turns.filter((t) => t.is_correct).length;
  const tappedIndices = useMemo(
    () => new Set(game.turns.map((t) => t.card_index)),
    [game.turns]
  );

  const turnResults = useMemo(() => {
    const map = new Map<number, { is_correct: boolean; player_id: string }>();
    for (const t of game.turns) {
      map.set(t.card_index, { is_correct: t.is_correct, player_id: t.player_id });
    }
    return map;
  }, [game.turns]);

  const blockNum = (game.room?.current_block_index ?? 0) + 1;

  if (!prompt || !payload) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
        <div className="text-white/60 text-lg animate-pulse">Karten werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 px-4 py-6">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80 backdrop-blur-sm">
            🃏 Passendes wählen
          </span>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80 backdrop-blur-sm">
            Block {blockNum} · {correctFound}/4 gefunden
          </span>
        </div>

        {/* Question */}
        <div className="mb-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm text-center">
          <h2 className="text-lg sm:text-xl font-bold text-white">{prompt.prompt}</h2>
        </div>

        {/* Turn indicator */}
        <div className="mb-4 rounded-2xl bg-white/10 p-3 backdrop-blur-sm text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{activePlayer ? game.getAvatar(activePlayer.id) : ""}</span>
            <span className="text-base font-bold text-white">
              {game.isMyTurn ? (
                <span className="text-yellow-300">Du bist dran!</span>
              ) : (
                <>{activePlayer?.display_name} ist dran...</>
              )}
            </span>
          </div>
          <div className="mt-2 flex justify-center gap-1.5">
            {sortedPlayers.map((p, i) => (
              <span
                key={p.id}
                className={`text-lg transition-all ${
                  i === game.activePlayerIndex
                    ? "scale-125 opacity-100"
                    : "opacity-40"
                }`}
                title={p.display_name}
              >
                {game.getAvatar(p.id)}
              </span>
            ))}
          </div>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {payload.cards.map((card, i) => {
            const tapped = tappedIndices.has(i);
            const result = turnResults.get(i);
            const tapper = result ? game.players.find((p) => p.id === result.player_id) : null;

            return (
              <button
                key={i}
                onClick={() => void game.tapCard(i)}
                disabled={tapped || !game.isMyTurn}
                className={`relative rounded-2xl p-4 text-center transition-all min-h-[80px] flex flex-col items-center justify-center ${
                  tapped
                    ? result?.is_correct
                      ? "bg-green-500/30 border-2 border-green-400/50 scale-95"
                      : "bg-red-500/20 border-2 border-red-400/30 opacity-50 scale-95"
                    : game.isMyTurn
                      ? `bg-gradient-to-br ${CARD_COLORS[i]} shadow-lg hover:scale-[1.05] hover:shadow-xl active:scale-[0.95] cursor-pointer`
                      : `bg-gradient-to-br ${CARD_COLORS[i]} shadow-lg opacity-70 cursor-not-allowed`
                }`}
              >
                {tapped && (
                  <span className="absolute top-1 right-1 text-lg">
                    {result?.is_correct ? "✅" : "❌"}
                  </span>
                )}
                <span className={`text-sm sm:text-base font-bold ${tapped ? "text-white/70" : "text-white"}`}>
                  {card}
                </span>
                {tapped && tapper && (
                  <span className="mt-1 text-xs text-white/50">
                    {game.getAvatar(tapper.id)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div className="mt-4 flex justify-center gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-all ${
                i < correctFound ? "bg-green-400" : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
