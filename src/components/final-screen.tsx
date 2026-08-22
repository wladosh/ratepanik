"use client";

import { useGame } from "@/lib/game-context";

const MODE_LABELS: Record<string, string> = {
  number_guess: "\u{1F522} Zahlenraten",
  pick_correct: "\u{1F0CF} Passendes wählen",
};

export function FinalScreen() {
  const game = useGame();
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isTie =
    sortedPlayers.length >= 2 && sortedPlayers[0].score === sortedPlayers[1].score;

  if (!winner) return null;

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-6"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mb-3 text-6xl animate-bounce-slow">{"\u{1F3C6}"}</div>
        <h1 className="mb-1 text-3xl font-extrabold" style={{ color: "var(--rp-text)" }}>
          Spielende!
        </h1>
        <p className="mb-6 text-base" style={{ color: "var(--rp-text-secondary)" }}>
          {isTie ? "Gleichstand — geteilter Sieg!" : `${winner.display_name} gewinnt!`}
        </p>

        {/* Winner card */}
        <div
          className="mb-6 p-6"
          style={{
            background: "rgba(255, 214, 107, 0.12)",
            borderRadius: "var(--rp-radius-lg)",
            border: "1px solid rgba(255, 214, 107, 0.3)",
          }}
        >
          <span className="text-5xl">{game.getAvatar(winner.id)}</span>
          <h2 className="mt-3 text-2xl font-extrabold" style={{ color: "var(--rp-text)" }}>
            {winner.display_name}
          </h2>
          <p className="mt-1 text-4xl font-black" style={{ color: "var(--rp-peach)" }}>
            {winner.score}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--rp-text-secondary)" }}>Punkte</p>
        </div>

        {/* All rankings */}
        <div className="mb-5 space-y-2">
          {sortedPlayers.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 px-4 py-3 animate-fade-in"
              style={{
                animationDelay: `${i * 150}ms`,
                background: i === 0 ? "rgba(255, 214, 107, 0.1)" : "var(--rp-bg-elevated)",
                borderRadius: "var(--rp-radius-md)",
                border: "1px solid var(--rp-border)",
              }}
            >
              <span className="w-8 text-center text-lg font-black" style={{ color: "var(--rp-text-secondary)" }}>
                {i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `${i + 1}.`}
              </span>
              <span className="text-2xl">{game.getAvatar(player.id)}</span>
              <div className="flex-1 text-left">
                <p className="font-bold" style={{ color: "var(--rp-text)" }}>
                  {player.display_name}
                  {player.id === game.myPlayerId && (
                    <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--rp-text-secondary)" }}>(Du)</span>
                  )}
                </p>
              </div>
              <span className="text-lg font-black tabular-nums" style={{ color: "var(--rp-purple)" }}>
                {player.score}
              </span>
            </div>
          ))}
        </div>

        {/* Per-block summary */}
        <div
          className="mb-6 p-4"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-md)",
            border: "1px solid var(--rp-border)",
          }}
        >
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--rp-text-secondary)" }}>
            Block-Übersicht
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {game.blocks
              .sort((a, b) => a.block_index - b.block_index)
              .map((block) => (
                <div
                  key={block.id}
                  className="rounded-xl p-2 text-center"
                  style={{ background: "rgba(139, 124, 255, 0.06)" }}
                >
                  <p className="text-[10px]" style={{ color: "var(--rp-text-secondary)" }}>Block {block.block_index + 1}</p>
                  <p className="text-xs">{MODE_LABELS[block.mode] ?? block.mode}</p>
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
                boxShadow: "0 6px 20px rgba(255, 138, 113, 0.35)",
              }}
            >
              Nochmal spielen!
            </button>
          ) : (
            <div
              className="w-full py-3 text-center rounded-[var(--rp-radius-md)]"
              style={{
                background: "rgba(139, 124, 255, 0.08)",
                border: "2px dashed var(--rp-purple-soft)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
                Der Host kann eine neue Runde starten
              </p>
            </div>
          )}
          <button
            onClick={() => void game.leaveRoom()}
            className="w-full h-[48px] rounded-[var(--rp-radius-pill)] text-base font-bold transition-all active:scale-[0.97]"
            style={{
              border: "2px solid var(--rp-purple)",
              color: "var(--rp-purple)",
              background: "transparent",
            }}
          >
            Neues Spiel
          </button>
        </div>
      </div>
    </div>
  );
}
