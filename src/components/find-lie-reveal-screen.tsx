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

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-6"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-3 text-center">
          <span className="text-5xl">{"\u{1F925}"}</span>
        </div>

        <div
          className="mb-5 p-4 text-center"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--rp-text-secondary)" }}>
            Die Frage
          </p>
          <p className="text-sm font-bold mt-1 leading-snug" style={{ color: "var(--rp-text)" }}>
            {prompt.prompt}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wider mt-3" style={{ color: "var(--rp-text-secondary)" }}>
            Die Lüge war
          </p>
          <p className="text-lg font-bold mt-2 leading-snug" style={{ color: "var(--rp-peach)" }}>
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
                className="flex items-center gap-3 px-4 py-3 animate-fade-in"
                style={{
                  background: correct ? "rgba(61, 204, 138, 0.10)" : "var(--rp-bg-elevated)",
                  borderRadius: "var(--rp-radius-md)",
                  border: correct
                    ? "1px solid rgba(61, 204, 138, 0.35)"
                    : "1px solid var(--rp-border)",
                }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                  {entry.player ? <PlayerSchleimi playerId={entry.player.id} size={36} /> : null}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: "var(--rp-text)" }}>
                    {entry.player?.display_name}
                    {isMe && (
                      <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--rp-text-secondary)" }}>
                        (Du)
                      </span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: "var(--rp-text-secondary)" }}>
                    {entry.choice == null
                      ? "Keine Antwort"
                      : `Tipp: ${LABELS[entry.choice] ?? entry.choice + 1}`}
                  </p>
                </div>
                <span className="text-lg font-black tabular-nums" style={{ color: "var(--rp-purple)" }}>
                  +{entry.points}
                </span>
              </div>
            );
          })}
        </div>

        {game.isHost ? (
          <button
            onClick={() => void game.advanceFromReveal()}
            className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
              boxShadow: "0 6px 20px rgba(255, 138, 113, 0.35)",
            }}
          >
            Block-Ergebnis anzeigen
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
              Der Host zeigt das Block-Ergebnis…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
