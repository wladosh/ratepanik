"use client";

import { useGame } from "@/lib/game-context";
import { modeEmoji, modeLabelDe } from "@/lib/game-store";

export function BlockScoreboardScreen() {
  const game = useGame();
  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 4;
  const isLastBlock = blockNum >= totalBlocks;

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

  const modeLabel = modeLabelDe(game.currentBlock?.mode);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-6"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm">
        <h2
          className="mb-1 text-center text-2xl font-extrabold"
          style={{ color: "var(--rp-text)" }}
        >
          Zwischenstand
        </h2>
        <p className="mb-1 text-center text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          Nach Block {blockNum} von {totalBlocks}
        </p>
        <p className="mb-6 text-center text-xs" style={{ color: "var(--rp-text-secondary)" }}>
          {modeEmoji(game.currentBlock?.mode)} {modeLabel}
        </p>

        {/* Podium for top 3 */}
        {sortedPlayers.length >= 3 && (
          <div className="mb-5 flex items-end justify-center gap-2">
            {/* 2nd place */}
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{game.getAvatar(sortedPlayers[1].id)}</span>
              <div
                className="w-20 rounded-t-2xl px-2 py-3 text-center h-20"
                style={{ background: "rgba(139, 124, 255, 0.08)" }}
              >
                <p className="text-xs truncate" style={{ color: "var(--rp-text-secondary)" }}>
                  {sortedPlayers[1].display_name}
                </p>
                <p className="text-lg font-black" style={{ color: "var(--rp-text)" }}>
                  {sortedPlayers[1].score}
                </p>
                <p className="text-xl">{"\u{1F948}"}</p>
              </div>
            </div>
            {/* 1st place */}
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-1">{game.getAvatar(sortedPlayers[0].id)}</span>
              <div
                className="w-24 rounded-t-2xl px-2 py-3 text-center h-28"
                style={{
                  background: "rgba(255, 214, 107, 0.15)",
                  border: "1px solid rgba(255, 214, 107, 0.3)",
                }}
              >
                <p className="text-xs truncate font-semibold" style={{ color: "var(--rp-text)" }}>
                  {sortedPlayers[0].display_name}
                </p>
                <p className="text-2xl font-black" style={{ color: "var(--rp-text)" }}>
                  {sortedPlayers[0].score}
                </p>
                <p className="text-2xl">{"\u{1F947}"}</p>
              </div>
            </div>
            {/* 3rd place */}
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{game.getAvatar(sortedPlayers[2].id)}</span>
              <div
                className="w-20 rounded-t-2xl px-2 py-3 text-center h-16"
                style={{ background: "rgba(111, 207, 178, 0.08)" }}
              >
                <p className="text-xs truncate" style={{ color: "var(--rp-text-secondary)" }}>
                  {sortedPlayers[2].display_name}
                </p>
                <p className="text-lg font-black" style={{ color: "var(--rp-text)" }}>
                  {sortedPlayers[2].score}
                </p>
                <p className="text-xl">{"\u{1F949}"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Full ranking */}
        <div className="mb-6 space-y-2">
          {sortedPlayers.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 px-4 py-3 animate-fade-in"
              style={{
                animationDelay: `${i * 100}ms`,
                background: i === 0 ? "rgba(255, 214, 107, 0.12)" : "var(--rp-bg-elevated)",
                borderRadius: "var(--rp-radius-md)",
                border: i === 0 ? "1px solid rgba(255, 214, 107, 0.3)" : "1px solid var(--rp-border)",
              }}
            >
              <span className="w-8 text-center text-lg font-black" style={{ color: "var(--rp-text-secondary)" }}>
                {i + 1}.
              </span>
              <span className="text-2xl">{game.getAvatar(player.id)}</span>
              <span className="flex-1 font-bold" style={{ color: "var(--rp-text)" }}>
                {player.display_name}
                {player.id === game.myPlayerId && (
                  <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--rp-text-secondary)" }}>(Du)</span>
                )}
              </span>
              <span className="text-lg font-black tabular-nums" style={{ color: "var(--rp-purple)" }}>
                {player.score}
              </span>
            </div>
          ))}
        </div>

        {game.isHost ? (
          <button
            onClick={() => void game.advanceFromBlockScore()}
            className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
              boxShadow: "0 6px 20px rgba(255, 138, 113, 0.35)",
            }}
          >
            {isLastBlock ? "Endergebnis anzeigen \u{1F3C6}" : "Nächster Block →"}
          </button>
        ) : (
          <div
            className="w-full py-4 text-center rounded-[var(--rp-radius-md)]"
            style={{
              background: "rgba(139, 124, 255, 0.08)",
              border: "2px dashed var(--rp-purple-soft)",
            }}
          >
            <p className="text-base font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
              {isLastBlock
                ? "Der Host zeigt gleich das Endergebnis…"
                : "Der Host startet den nächsten Block…"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
