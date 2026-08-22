"use client";

import { useGame } from "@/lib/game-context";

export function RevealScreen() {
  const game = useGame();

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8" style={{ background: "var(--rp-bg-hero)" }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-2 text-sm font-semibold text-[var(--rp-text-secondary)] uppercase tracking-wider">
            Block {game.currentBlockIndex + 1} · Runde {game.currentRoundInBlock + 1}
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--rp-text)]">
            Ergebnis
          </h2>
          {game.currentBlock?.themeName && (
            <p className="mt-1 text-sm text-[var(--rp-text-secondary)]">
              {game.currentBlock.themeName} — {game.mode === "number_guess" ? "Zahlenraten" : "Passendes wählen"}
            </p>
          )}
        </div>

        {/* Points earned this round */}
        {game.lastRoundPoints > 0 && (
          <div className="mb-4 text-center animate-fade-in">
            <span className="text-3xl font-extrabold" style={{ color: "var(--rp-success)" }}>
              +{game.lastRoundPoints}
            </span>
            <span className="ml-2 text-sm text-[var(--rp-text-secondary)]">Punkte</span>
          </div>
        )}

        {/* Standings */}
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
                className="flex items-center gap-3 rounded-[var(--rp-radius-md)] px-4 py-3 animate-fade-in"
                style={{
                  background: player.id === game.myPlayerId ? "rgba(139, 124, 255, 0.08)" : "transparent",
                  animationDelay: `${i * 100}ms`,
                }}
              >
                <span className="w-6 text-center text-sm font-extrabold text-[var(--rp-text-secondary)]">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                </span>
                <span className="text-xl">{game.getAvatar(player.id)}</span>
                <span className="flex-1 font-bold text-[var(--rp-text)]">
                  {player.display_name}
                  {player.id === game.myPlayerId && (
                    <span className="ml-1 text-xs text-[var(--rp-text-secondary)]">(Du)</span>
                  )}
                </span>
                <span className="text-base font-extrabold text-[var(--rp-text)] tabular-nums">
                  {player.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action */}
        {game.isHost ? (
          <button
            onClick={() => void game.nextRound()}
            className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
              boxShadow: "0 4px 16px rgba(255, 138, 113, 0.35)",
            }}
          >
            Weiter →
          </button>
        ) : (
          <div className="text-center text-sm text-[var(--rp-text-secondary)]">
            Der Host geht weiter...
          </div>
        )}
      </div>
    </div>
  );
}
