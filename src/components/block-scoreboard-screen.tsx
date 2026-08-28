"use client";

import { PlayerSchleimi } from "@/components/player-schleimi";
import { PlayerNameRow } from "@/components/player-name-row";
import { useGame } from "@/lib/game-context";
import { modeEmoji, modeLabelDe } from "@/lib/game-store";
import { SCOREBOARD_LEAD_COPY, competitionRanks, placeGlyph, scoreboardLeadKind } from "@/lib/match-ui";
import { useI18n } from "@/lib/i18n-context";

export function BlockScoreboardScreen() {
  const game = useGame();
  const { locale, t } = useI18n();
  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 4;
  const isLastBlock = blockNum >= totalBlocks;

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const ranks = competitionRanks(sortedPlayers.map((player) => player.score));
  const mixedModes = game.roomSettings.modeFilter === "all";
  const modeLabel = mixedModes ? t.lobby.chipAllModes : modeLabelDe(game.currentBlock?.mode);
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
        background: "var(--rp-nb-cream)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="relative z-10 mt-14 w-full max-w-sm">
        <div className="mb-3 flex justify-center">
          <span
            className="nb-card inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.13em]"
            style={{
              background: "var(--rp-nb-white)",
              color: "var(--rp-nb-purple-deep)",
            }}
          >
            <span aria-hidden="true">✓</span>
            Block {blockNum} abgeschlossen
          </span>
        </div>

        <h2 className="nb-heading text-center text-[28px]">
          Zwischenstand
        </h2>

        <div className="mb-5 mt-3 flex items-center justify-center gap-3">
          <span
            className="nb-card inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
            style={{ background: "var(--rp-nb-white)", color: "var(--rp-nb-text-secondary)" }}
          >
            {mixedModes ? "✦" : modeEmoji(game.currentBlock?.mode)} {modeLabel}
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
                className="h-2 transition-all"
                style={{
                  width: index + 1 === blockNum ? 22 : 8,
                  borderRadius: "var(--rp-nb-radius-sm)",
                  background:
                    index < blockNum
                      ? "var(--rp-nb-peach)"
                      : "var(--rp-nb-border-color)",
                  opacity: index < blockNum ? 1 : 0.2,
                }}
              />
            ))}
          </div>
        </div>

        {leader && (
          <section
            className="nb-card-lg animate-fade-in relative mb-4 overflow-hidden p-5"
            style={{
              background: "var(--rp-nb-yellow)",
            }}
            aria-label={
              leadKind === "open" || leadKind === "tie"
                ? `Gleichstand bei ${leader.score} Punkten`
                : `${leader.display_name} führt mit ${leader.score} Punkten`
            }
          >
            <div className="relative flex items-center gap-4">
              <div className="relative shrink-0">
                <span
                  className="nb-card flex h-[74px] w-[74px] items-center justify-center"
                  style={{
                    background: "var(--rp-nb-white)",
                  }}
                >
                  <PlayerSchleimi playerId={leader.id} size={64} />
                </span>
                {leadKind === "you" || leadKind === "them" ? (
                  <span
                    className="absolute -right-2 -top-3 flex h-8 w-8 rotate-6 items-center justify-center text-lg"
                    style={{
                      background: "var(--rp-nb-yellow)",
                      border: "var(--rp-nb-border)",
                      borderRadius: "var(--rp-nb-radius)",
                      boxShadow: "var(--rp-nb-shadow-sm)",
                    }}
                    aria-hidden="true"
                  >
                    👑
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="nb-kicker mb-1">
                  {SCOREBOARD_LEAD_COPY[locale][leadKind]}
                </p>
                <p className="truncate text-xl font-black uppercase" style={{ color: "var(--rp-nb-text)" }}>
                  {leader.display_name}
                </p>
                <p className="mt-1 text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
                  {isLastBlock
                    ? "Das Endergebnis wartet"
                    : `Weiter so – noch ${totalBlocks - blockNum} ${
                        totalBlocks - blockNum === 1 ? "Block" : "Blöcke"
                      }`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black tabular-nums" style={{ color: "var(--rp-nb-purple-deep)" }}>
                  {leader.score}
                </p>
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--rp-nb-text-secondary)" }}>
                  Punkte
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="nb-heading text-sm">
            Rangliste
          </h3>
          <span className="text-xs font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
            {sortedPlayers.length} {sortedPlayers.length === 1 ? "Spieler" : "Spieler"}
          </span>
        </div>

        <div className="mb-5 space-y-2.5">
          {sortedPlayers.map((player, i) => {
            const rank = ranks[i] ?? i + 1;
            return (
            <div
              key={player.id}
              className="nb-card animate-fade-in flex items-center gap-3 px-3.5 py-3"
              style={{
                animationDelay: `${120 + i * 80}ms`,
                background:
                  player.id === game.myPlayerId
                    ? "var(--rp-nb-lilac)"
                    : "var(--rp-nb-white)",
                borderColor:
                  player.id === game.myPlayerId
                    ? "var(--rp-nb-purple-deep)"
                    : "var(--rp-nb-border-color)",
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-sm font-black"
                style={{
                  borderRadius: "var(--rp-nb-radius-sm)",
                  border: "2px solid var(--rp-nb-border-color)",
                  background:
                    leadKind === "open" || rank !== 1
                      ? "var(--rp-nb-white)"
                      : "var(--rp-nb-yellow)",
                  color:
                    leadKind === "open" || rank !== 1
                      ? "var(--rp-nb-text-secondary)"
                      : "var(--rp-nb-text)",
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
                <span className="block text-lg font-black tabular-nums" style={{ color: "var(--rp-nb-purple-deep)" }}>
                  {player.score}
                </span>
                <span className="block text-[9px] font-black uppercase tracking-wide" style={{ color: "var(--rp-nb-text-secondary)" }}>
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
            className="nb-btn h-[58px] w-full text-[17px] text-white"
            style={{
              background: "var(--rp-nb-peach)",
            }}
          >
            {isLastBlock ? "Endergebnis anzeigen 🏆" : "Nächster Block →"}
          </button>
        ) : (
          <div
            className="nb-card w-full px-4 py-4 text-center"
            style={{
              background: "var(--rp-nb-white)",
              borderStyle: "dashed",
            }}
          >
            <p className="text-base font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
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
