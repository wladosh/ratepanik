"use client";

import { useGame } from "@/lib/game-context";

export function ScoreboardScreen() {
  const game = useGame();
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8" style={{ background: "var(--rp-bg-hero)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold text-[var(--rp-text)]">Zwischenstand</h2>
          <p className="mt-1 text-sm text-[var(--rp-text-secondary)]">
            Block {game.currentBlockIndex + 1} von {game.totalBlocks}
          </p>
        </div>

        <div
          className="p-4 mb-6"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <div className="space-y-2">
            {sortedPlayers.map((player, i) => (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-[var(--rp-radius-md)] px-4 py-3"
                style={{
                  background: i === 0 ? "rgba(255, 214, 107, 0.1)" : "transparent",
                }}
              >
                <span className="w-6 text-center text-sm font-extrabold">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                </span>
                <span className="text-xl">{game.getAvatar(player.id)}</span>
                <span className="flex-1 font-bold text-[var(--rp-text)]">
                  {player.display_name}
                </span>
                <span className="text-base font-extrabold text-[var(--rp-text)] tabular-nums">
                  {player.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {game.isHost ? (
          <button
            onClick={() => void game.nextRound()}
            className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
              boxShadow: "0 4px 16px rgba(255, 138, 113, 0.35)",
            }}
          >
            Nächster Block →
          </button>
        ) : (
          <div className="text-center text-sm text-[var(--rp-text-secondary)]">
            Warte auf den Host...
          </div>
        )}
      </div>
    </div>
  );
}
