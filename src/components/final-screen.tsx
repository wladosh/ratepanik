"use client";

import { useGame } from "@/lib/game-context";

export function FinalScreen() {
  const game = useGame();
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  if (!winner) return null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8" style={{ background: "var(--rp-bg-hero)" }}>
      <div className="w-full max-w-sm text-center">
        {/* Trophy */}
        <div className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rp/rp_trophy_gold_512.png"
            alt="Trophy"
            width={72}
            height={72}
            className="mx-auto drop-shadow-[0_8px_24px_rgba(255,214,107,0.4)]"
          />
        </div>

        <h1 className="mb-1 text-3xl font-extrabold text-[var(--rp-text)]">
          Spielende!
        </h1>
        <p className="mb-6 text-[var(--rp-text-secondary)]">
          {sortedPlayers[0].score === sortedPlayers[1]?.score
            ? "Geteilter Sieg!"
            : `${winner.display_name} gewinnt!`}
        </p>

        {/* Podium */}
        <div
          className="p-5 mb-6"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <div className="space-y-3">
            {sortedPlayers.map((player, i) => (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-[var(--rp-radius-md)] px-4 py-3 animate-fade-in"
                style={{
                  background: i === 0 ? "rgba(255, 214, 107, 0.12)" : "transparent",
                  animationDelay: `${i * 150}ms`,
                }}
              >
                <span className="w-8 text-center text-lg font-extrabold">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                </span>
                <span className="text-2xl">{game.getAvatar(player.id)}</span>
                <div className="flex-1 text-left">
                  <p className="font-bold text-[var(--rp-text)]">
                    {player.display_name}
                    {player.id === game.myPlayerId && (
                      <span className="ml-1 text-xs text-[var(--rp-text-secondary)]">(Du)</span>
                    )}
                  </p>
                </div>
                <span className="text-lg font-extrabold text-[var(--rp-text)] tabular-nums">
                  {player.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {game.isHost ? (
            <button
              onClick={() => void game.resetGame()}
              className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
                boxShadow: "0 4px 16px rgba(255, 138, 113, 0.35)",
              }}
            >
              Nochmal spielen! 🔄
            </button>
          ) : (
            <div className="text-sm text-[var(--rp-text-secondary)]">
              Der Host kann eine neue Runde starten
            </div>
          )}
          <button
            onClick={game.goHome}
            className="w-full h-[48px] rounded-[var(--rp-radius-pill)] text-base font-bold transition-all active:scale-[0.97] border-2"
            style={{
              borderColor: "var(--rp-border)",
              color: "var(--rp-text-secondary)",
            }}
          >
            Raus
          </button>
        </div>
      </div>
    </div>
  );
}
