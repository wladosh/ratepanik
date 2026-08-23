"use client";

import { PlayerSchleimi } from "@/components/player-schleimi";
import { PlayerNameRow } from "@/components/player-name-row";
import { useGame } from "@/lib/game-context";
import { modeEmoji, modeLabelDe } from "@/lib/game-store";
import { SCOREBOARD_LEAD_COPY, competitionRanks, placeGlyph, scoreboardLeadKind } from "@/lib/match-ui";
import { useI18n } from "@/lib/i18n-context";

export function BlockScoreboardScreen() {
  const game = useGame();
  const { locale } = useI18n();
  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 4;
  const isLastBlock = blockNum >= totalBlocks;

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const ranks = competitionRanks(sortedPlayers.map((player) => player.score));
  const modeLabel = modeLabelDe(game.currentBlock?.mode);
  const leader = sortedPlayers[0];
  const leaderIsMe = leader?.id === game.myPlayerId;
  const leadKind = scoreboardLeadKind(
    sortedPlayers.map((player) => player.score),
    leaderIsMe,
  );

  return (
    <div
      className="relative flex flex-1 flex-col items-center overflow-y-auto px-4 pb-6"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div
        className="pointer-events-none absolute -left-16 top-40 h-44 w-44 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--rp-purple-soft)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-24 h-48 w-48 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--rp-peach-soft)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mt-14 w-full max-w-sm">
        <div className="mb-3 flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.13em]"
            style={{
              background: "rgba(255, 255, 255, 0.72)",
              color: "var(--rp-purple)",
              border: "1px solid rgba(139, 124, 255, 0.14)",
              boxShadow: "0 8px 24px rgba(42, 42, 74, 0.06)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span aria-hidden="true">✓</span>
            Block {blockNum} abgeschlossen
          </span>
        </div>

        <h2
          className="text-center text-[28px] font-black tracking-[-0.03em]"
          style={{ color: "var(--rp-text)" }}
        >
          Zwischenstand
        </h2>

        <div className="mb-5 mt-3 flex items-center justify-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: "rgba(255, 255, 255, 0.64)", color: "var(--rp-text-secondary)" }}
          >
            {modeEmoji(game.currentBlock?.mode)} {modeLabel}
          </span>
          <div
            className="flex items-center gap-1.5"
            role="progressbar"
            aria-label={`Blockfortschritt: ${blockNum} von ${totalBlocks}`}
            aria-valuemin={0}
            aria-valuemax={totalBlocks}
            aria-valuenow={blockNum}
          >
            {Array.from({ length: totalBlocks }, (_, index) => (
              <span
                key={index}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: index + 1 === blockNum ? 22 : 8,
                  background:
                    index < blockNum
                      ? "var(--rp-peach)"
                      : "rgba(42, 42, 74, 0.12)",
                }}
              />
            ))}
          </div>
        </div>

        {leader && (
          <section
            className="animate-fade-in relative mb-4 overflow-hidden rounded-[28px] p-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 236, 214, 0.92) 100%)",
              border: "1px solid rgba(255, 176, 112, 0.28)",
              boxShadow: "0 18px 40px rgba(112, 76, 61, 0.13)",
            }}
            aria-label={
              leadKind === "open" || leadKind === "tie"
                ? `Gleichstand bei ${leader.score} Punkten`
                : `${leader.display_name} führt mit ${leader.score} Punkten`
            }
          >
            <div
              className="pointer-events-none absolute -right-7 -top-10 h-28 w-28 rounded-full"
              style={{ background: "rgba(255, 214, 107, 0.28)" }}
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-4">
              <div className="relative shrink-0">
                <span
                  className="flex h-[74px] w-[74px] items-center justify-center rounded-[24px]"
                  style={{
                    background: "rgba(255, 255, 255, 0.82)",
                    boxShadow: "0 10px 24px rgba(112, 76, 61, 0.12)",
                  }}
                >
                  <PlayerSchleimi playerId={leader.id} size={64} />
                </span>
                {leadKind === "you" || leadKind === "them" ? (
                  <span
                    className="absolute -right-2 -top-3 flex h-8 w-8 rotate-6 items-center justify-center rounded-xl text-lg"
                    style={{
                      background: "#FFF4BD",
                      boxShadow: "0 5px 12px rgba(187, 137, 35, 0.18)",
                    }}
                    aria-hidden="true"
                  >
                    👑
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.13em]"
                  style={{ color: "var(--rp-peach-deep)" }}
                >
                  {SCOREBOARD_LEAD_COPY[locale][leadKind]}
                </p>
                <p className="truncate text-xl font-black" style={{ color: "var(--rp-text)" }}>
                  {leader.display_name}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
                  {isLastBlock
                    ? "Das Endergebnis wartet"
                    : `Weiter so – noch ${totalBlocks - blockNum} ${
                        totalBlocks - blockNum === 1 ? "Block" : "Blöcke"
                      }`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black tabular-nums" style={{ color: "var(--rp-purple)" }}>
                  {leader.score}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--rp-text-secondary)" }}>
                  Punkte
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold" style={{ color: "var(--rp-text)" }}>
            Rangliste
          </h3>
          <span className="text-xs font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
            {sortedPlayers.length} {sortedPlayers.length === 1 ? "Spieler" : "Spieler"}
          </span>
        </div>

        <div className="mb-5 space-y-2.5">
          {sortedPlayers.map((player, i) => {
            const rank = ranks[i] ?? i + 1;
            return (
            <div
              key={player.id}
              className="animate-fade-in flex items-center gap-3 px-3.5 py-3"
              style={{
                animationDelay: `${120 + i * 80}ms`,
                background:
                  player.id === game.myPlayerId
                    ? "rgba(255, 255, 255, 0.92)"
                    : "rgba(255, 255, 255, 0.72)",
                borderRadius: 20,
                border:
                  player.id === game.myPlayerId
                    ? "1.5px solid rgba(139, 124, 255, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.72)",
                boxShadow:
                  player.id === game.myPlayerId
                    ? "0 8px 22px rgba(92, 77, 175, 0.1)"
                    : "0 5px 16px rgba(42, 42, 74, 0.05)",
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                style={{
                  background:
                    leadKind === "open" || rank !== 1
                      ? "var(--rp-bg-muted)"
                      : "#FFF4BD",
                  color:
                    leadKind === "open" || rank !== 1
                      ? "var(--rp-text-secondary)"
                      : "#A87513",
                }}
              >
                {leadKind === "open" ? "=" : placeGlyph(rank, "crown")}
              </span>
              <PlayerSchleimi playerId={player.id} size={36} />
              <PlayerNameRow
                className="flex-1"
                name={player.display_name}
                isMe={player.id === game.myPlayerId}
                youLabel={locale === "en" ? "You" : "Du"}
              />
              <div className="text-right">
                <span className="block text-lg font-black tabular-nums" style={{ color: "var(--rp-purple)" }}>
                  {player.score}
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--rp-text-secondary)" }}>
                  Punkte
                </span>
              </div>
            </div>
              );
            })}
        </div>

        {game.isHost ? (
          <button
            onClick={() => void game.advanceFromBlockScore()}
            className="h-[58px] w-full rounded-[var(--rp-radius-pill)] text-[17px] font-extrabold text-white transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
              boxShadow: "0 10px 26px rgba(255, 138, 113, 0.34)",
            }}
          >
            {isLastBlock ? "Endergebnis anzeigen 🏆" : "Nächster Block →"}
          </button>
        ) : (
          <div
            className="w-full rounded-[20px] px-4 py-4 text-center"
            style={{
              background: "rgba(255, 255, 255, 0.68)",
              border: "1.5px dashed rgba(139, 124, 255, 0.35)",
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
