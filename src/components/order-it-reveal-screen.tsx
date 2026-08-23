"use client";

import { useMemo } from "react";
import { PlayerSchleimi } from "@/components/player-schleimi";
import { useGame } from "@/lib/game-context";
import type { OrderItPayload } from "@/lib/content";
import { calculateOrderItPoints } from "@/lib/game-store";

export function OrderItRevealScreen() {
  const game = useGame();
  const prompt = game.currentPrompt;
  const payload = prompt?.payload as OrderItPayload | undefined;
  const items = payload?.items ?? [];
  const correctOrder = payload?.correct_order ?? [];

  const rows = useMemo(() => {
    return game.roundAnswers.map((a) => {
      const order = Array.isArray(a.payload_answer)
        ? (a.payload_answer as number[])
        : [];
      const points = calculateOrderItPoints(order, correctOrder);
      return {
        ...a,
        order,
        points,
        player: game.players.find((p) => p.id === a.player_id),
      };
    });
  }, [game.roundAnswers, game.players, correctOrder]);

  if (!prompt || items.length === 0 || correctOrder.length === 0) return null;

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
          <span className="text-5xl">{"\u{2195}\u{FE0F}"}</span>
        </div>

        <div
          className="mb-5 p-4"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider text-center mb-3"
            style={{ color: "var(--rp-text-secondary)" }}
          >
            Richtige Reihenfolge
            {payload?.order_axis ? ` · ${payload.order_axis}` : ""}
          </p>
          <ol className="space-y-2">
            {correctOrder.map((orig, i) => (
              <li
                key={`${orig}-${i}`}
                className="flex items-center gap-3 text-sm font-semibold"
                style={{ color: "var(--rp-text)" }}
              >
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0"
                  style={{ background: "var(--rp-peach)", color: "#fff" }}
                >
                  {i + 1}
                </span>
                {items[orig] ?? `#${orig + 1}`}
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-5 space-y-2">
          {rows.map((entry) => {
            const isMe = entry.player_id === game.myPlayerId;
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3 animate-fade-in"
                style={{
                  background: "var(--rp-bg-elevated)",
                  borderRadius: "var(--rp-radius-md)",
                  border: "1px solid var(--rp-border)",
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
                  <p className="text-xs truncate" style={{ color: "var(--rp-text-secondary)" }}>
                    {entry.order.length === 0
                      ? "Keine Antwort"
                      : entry.order.map((orig) => items[orig] ?? "?").join(" → ")}
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
