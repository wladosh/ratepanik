"use client";

import { useMemo } from "react";
import { useGame } from "@/lib/game-context";
import type { NumberGuessPayload } from "@/lib/content";
import { numberGuessCorrectFromPayload, scoreNumberGuessAnswers } from "@/lib/game-store";

const RANK_MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}", "4."];

export function NumberGuessRevealScreen() {
  const game = useGame();
  const prompt = game.currentPrompt;
  const payload = prompt?.payload as NumberGuessPayload | undefined;
  const correctAnswer = numberGuessCorrectFromPayload(prompt?.payload) ?? payload?.answer;

  const ranked = useMemo(() => {
    if (correctAnswer === undefined || correctAnswer === null) return [];
    const ca = correctAnswer;
    const scored = scoreNumberGuessAnswers(
      game.roundAnswers.map((a) => ({
        id: a.id,
        numericAnswer: a.numeric_answer,
      })),
      ca,
      game.players.length,
    );
    const byId = new Map(scored.map((s) => [s.id, s]));
    return game.roundAnswers
      .map((a) => {
        const s = byId.get(a.id);
        return {
          ...a,
          distance: s?.distance ?? Math.abs((a.numeric_answer ?? 0) - ca),
          rank: s?.rank ?? 0,
          points: s?.points ?? 0,
          player: game.players.find((p) => p.id === a.player_id),
        };
      })
      .sort((a, b) => a.rank - b.rank);
  }, [game.roundAnswers, game.players, correctAnswer]);

  const myRanked = ranked.find((r) => r.player_id === game.myPlayerId);
  const isLastRound = (game.currentBlock?.current_round ?? 0) >= (game.currentBlock?.rounds_total ?? 2) - 1;

  if (!prompt || correctAnswer === undefined) return null;

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-6"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Result emoji */}
        <div className="mb-3 text-center">
          <span className="text-5xl animate-bounce-slow">
            {myRanked?.rank === 1 ? "\u{1F3AF}" : myRanked?.rank === 2 ? "\u{1F44F}" : "\u{1F62C}"}
          </span>
        </div>

        {/* Correct answer card */}
        <div
          className="mb-5 p-4 text-center"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--rp-text-secondary)" }}>
            Richtige Antwort
          </p>
          <p className="text-3xl font-black mt-1" style={{ color: "var(--rp-peach)" }}>
            {correctAnswer.toLocaleString("de-DE")}
            {payload?.unit ? ` ${payload.unit}` : ""}
          </p>
        </div>

        {/* Rankings */}
        <div className="mb-5 space-y-2">
          {ranked.map((entry) => {
            const isMe = entry.player_id === game.myPlayerId;
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3 animate-fade-in"
                style={{
                  background: entry.rank === 1
                    ? "rgba(255, 214, 107, 0.15)"
                    : "var(--rp-bg-elevated)",
                  borderRadius: "var(--rp-radius-md)",
                  border: entry.rank === 1 ? "1px solid rgba(255, 214, 107, 0.3)" : "1px solid var(--rp-border)",
                  boxShadow: isMe ? "0 4px 16px rgba(42, 42, 74, 0.1)" : "none",
                }}
              >
                <span className="w-8 text-center text-lg">
                  {RANK_MEDALS[entry.rank - 1] ?? `${entry.rank}.`}
                </span>
                <span className="text-2xl">
                  {entry.player ? game.getAvatar(entry.player.id) : ""}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: "var(--rp-text)" }}>
                    {entry.player?.display_name}
                    {isMe && <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--rp-text-secondary)" }}>(Du)</span>}
                  </p>
                  <p className="text-xs" style={{ color: "var(--rp-text-secondary)" }}>
                    {(entry.numeric_answer ?? 0).toLocaleString("de-DE")}
                    {payload?.unit ? ` ${payload.unit}` : ""} &middot; Abstand: {entry.distance.toLocaleString("de-DE")}
                  </p>
                </div>
                <span className="text-lg font-black tabular-nums" style={{ color: "var(--rp-purple)" }}>
                  +{entry.points}
                </span>
              </div>
            );
          })}
        </div>

        {/* Host advance button */}
        {game.isHost ? (
          <button
            onClick={() => void game.advanceFromReveal()}
            disabled={game.hostActionLock}
            className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
              boxShadow: "0 6px 20px rgba(255, 138, 113, 0.35)",
            }}
          >
            {isLastRound ? "Block-Ergebnis anzeigen" : "Nächste Runde →"}
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
              {isLastRound ? "Der Host zeigt das Block-Ergebnis…" : "Der Host startet die nächste Runde…"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
