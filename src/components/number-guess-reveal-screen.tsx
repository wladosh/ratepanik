"use client";

import { useMemo } from "react";
import { PlayerSchleimi } from "@/components/player-schleimi";
import { ModeArt, PlaceBadge } from "@/components/rp-art";
import { useGame } from "@/lib/game-context";
import type { NumberGuessPayload } from "@/lib/content";
import { numberGuessCorrectFromPayload, scoreNumberGuessAnswers } from "@/lib/game-store";

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
  const isLastRound = (game.currentBlock?.current_round ?? 0) >= (game.currentBlock?.rounds_total ?? 1) - 1;

  if (!prompt || correctAnswer === undefined) return null;

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-6"
      style={{
        background: "var(--rp-nb-cream)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-3 flex justify-center">
          <ModeArt mode="number_guess" size={96} priority />
        </div>

        {/* Correct answer card */}
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
          {myRanked?.numeric_answer != null && (
            <p className="text-xs mt-2 font-bold" style={{ color: "var(--rp-nb-black)" }}>
              Deine Schätzung: {myRanked.numeric_answer.toLocaleString("de-DE")}
              {payload?.unit ? ` ${payload.unit}` : ""}
            </p>
          )}
          <p className="nb-kicker text-xs font-semibold uppercase tracking-wider mt-3" style={{ color: "var(--rp-nb-black)" }}>
            Richtige Antwort
          </p>
          <p className="text-3xl font-black mt-1" style={{ color: "var(--rp-nb-peach)" }}>
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
                className="nb-card flex items-center gap-3 px-4 py-3 animate-fade-in"
                style={{
                  background: entry.rank === 1
                    ? "var(--rp-nb-yellow)"
                    : "var(--rp-nb-white)",
                  borderRadius: "var(--rp-nb-radius)",
                  border: "var(--rp-nb-border)",
                  boxShadow: isMe ? "var(--rp-nb-shadow)" : "var(--rp-nb-shadow-sm)",
                }}
              >
                <span className="flex w-8 shrink-0 items-center justify-center">
                  <PlaceBadge rank={entry.rank} size={28} />
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                  {entry.player ? <PlayerSchleimi playerId={entry.player.id} size={36} /> : null}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: "var(--rp-nb-black)" }}>
                    {entry.player?.display_name}
                    {isMe && <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--rp-nb-black)" }}>(Du)</span>}
                  </p>
                  <p className="text-xs font-bold" style={{ color: "var(--rp-nb-black)" }}>
                    {(entry.numeric_answer ?? 0).toLocaleString("de-DE")}
                    {payload?.unit ? ` ${payload.unit}` : ""} &middot; Abstand: {entry.distance.toLocaleString("de-DE")}
                  </p>
                </div>
                <span className="text-lg font-black tabular-nums" style={{ color: "var(--rp-nb-purple-deep)" }}>
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
