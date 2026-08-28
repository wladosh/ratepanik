"use client";

import { useMemo } from "react";
import { PlayerSchleimi } from "@/components/player-schleimi";
import { useGame } from "@/lib/game-context";
import type { FindLiePayload } from "@/lib/content";
import { calculateFindLiePoints } from "@/lib/game-store";

const LABELS = ["A", "B", "C", "D"];

export function FindLieRevealScreen() {
  const game = useGame();
  const prompt = game.currentPrompt;
  const payload = prompt?.payload as FindLiePayload | undefined;
  const lieIndex = payload?.lie_index;
  const statements = payload?.statements ?? [];

  const rows = useMemo(() => {
    if (lieIndex === undefined) return [];
    return game.roundAnswers.map((a) => {
      const choice = a.numeric_answer == null ? null : Number(a.numeric_answer);
      const points = choice == null ? 0 : calculateFindLiePoints(choice, lieIndex);
      return {
        ...a,
        choice,
        points,
        player: game.players.find((p) => p.id === a.player_id),
      };
    });
  }, [game.roundAnswers, game.players, lieIndex]);

  if (!prompt || lieIndex === undefined) return null;

  const lieText = statements[lieIndex] ?? `Aussage ${LABELS[lieIndex] ?? lieIndex + 1}`;
  const isLastRound =
    (game.currentBlock?.current_round ?? 0) >= (game.currentBlock?.rounds_total ?? 1) - 1;

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-6"
      style={{
        background: "var(--rp-nb-cream)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-3 text-center">
          <span className="text-5xl">{"\u{1F925}"}</span>
        </div>

        <div
          className="nb-card mb-5 p-4 text-center"
          style={{
            background: "var(--rp-nb-white)",
            borderRadius: "var(--rp-nb-radius)",
            border: "var(--rp-nb-border)",
            boxShadow: "var(--rp-nb-shadow)",
          }}
        >
          <p className="nb-kicker text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--rp-nb-black)" }}>
            Die Frage
          </p>
          <p className="text-sm font-bold mt-1 leading-snug" style={{ color: "var(--rp-nb-black)" }}>
            {prompt.prompt}
          </p>
          <p className="nb-kicker text-xs font-semibold uppercase tracking-wider mt-3" style={{ color: "var(--rp-nb-black)" }}>
            Die Lüge war
          </p>
          <p className="text-lg font-bold mt-2 leading-snug" style={{ color: "var(--rp-nb-peach)" }}>
            {LABELS[lieIndex]}. {lieText}
          </p>
        </div>

        <div className="mb-5 space-y-2">
          {rows.map((entry) => {
            const isMe = entry.player_id === game.myPlayerId;
            const correct = entry.points > 0;
            return (
              <div
                key={entry.id}
                className="nb-card flex items-center gap-3 px-4 py-3 animate-fade-in"
                style={{
                  background: correct ? "var(--rp-nb-mint)" : "var(--rp-nb-white)",
                  borderRadius: "var(--rp-nb-radius)",
                  border: "var(--rp-nb-border)",
                  boxShadow: "var(--rp-nb-shadow-sm)",
                }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                  {entry.player ? <PlayerSchleimi playerId={entry.player.id} size={36} /> : null}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: "var(--rp-nb-black)" }}>
                    {entry.player?.display_name}
                    {isMe && (
                      <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--rp-nb-black)" }}>
                        (Du)
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-bold" style={{ color: "var(--rp-nb-black)" }}>
                    {entry.choice == null
                      ? "Keine Antwort"
                      : `Tipp: ${LABELS[entry.choice] ?? entry.choice + 1}`}
                  </p>
                </div>
                <span className="text-lg font-black tabular-nums" style={{ color: "var(--rp-nb-purple-deep)" }}>
                  +{entry.points}
                </span>
              </div>
            );
          })}
        </div>

        {game.isHost ? (
          <button
            onClick={() => void game.advanceFromReveal()}
            disabled={game.hostActionLock}
            className="nb-btn w-full h-[54px] text-[17px] font-bold text-white uppercase transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--rp-nb-shadow-pressed)] disabled:opacity-60"
            style={{
              background: "var(--rp-nb-peach)",
              border: "var(--rp-nb-border)",
              borderRadius: "var(--rp-nb-radius)",
              boxShadow: "var(--rp-nb-shadow)",
            }}
          >
            {isLastRound ? "Block-Ergebnis anzeigen" : "Nächste Runde →"}
          </button>
        ) : (
          <div
            className="nb-card w-full py-4 text-center"
            style={{
              background: "var(--rp-nb-lilac)",
              border: "var(--rp-nb-border)",
              borderRadius: "var(--rp-nb-radius)",
            }}
          >
            <p className="text-base font-semibold" style={{ color: "var(--rp-nb-black)" }}>
              {isLastRound ? "Der Host zeigt das Block-Ergebnis…" : "Der Host startet die nächste Runde…"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
