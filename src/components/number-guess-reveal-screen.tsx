"use client";

import { useMemo } from "react";
import { useGame } from "@/lib/game-context";
import type { NumberGuessPayload } from "@/lib/content";
import { calculateNumberGuessPoints } from "@/lib/game-store";

const RANK_MEDALS = ["🥇", "🥈", "🥉", "4."];

export function NumberGuessRevealScreen() {
  const game = useGame();
  const prompt = game.currentPrompt;
  const payload = prompt?.payload as NumberGuessPayload | undefined;
  const correctAnswer = payload?.answer;

  const ranked = useMemo(() => {
    if (correctAnswer === undefined || correctAnswer === null) return [];
    const ca = correctAnswer;
    return game.roundAnswers
      .map((a) => ({
        ...a,
        distance: Math.abs((a.numeric_answer ?? 0) - ca),
        player: game.players.find((p) => p.id === a.player_id),
      }))
      .sort((a, b) => a.distance - b.distance)
      .map((a, i) => ({
        ...a,
        rank: i + 1,
        points: calculateNumberGuessPoints(i + 1, game.roundAnswers.length),
      }));
  }, [game.roundAnswers, game.players, correctAnswer]);

  const myRanked = ranked.find((r) => r.player_id === game.myPlayerId);
  const isLastRound = (game.currentBlock?.current_round ?? 0) >= (game.currentBlock?.rounds_total ?? 2) - 1;

  if (!prompt || correctAnswer === undefined) return null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Result emoji */}
        <div className="mb-4 text-center">
          <span className="text-6xl animate-bounce-slow">
            {myRanked?.rank === 1 ? "🎯" : myRanked?.rank === 2 ? "👏" : "😬"}
          </span>
        </div>

        {/* Correct answer */}
        <div className="mb-6 text-center">
          <p className="text-sm text-white/50 uppercase tracking-wider font-semibold">
            Richtige Antwort
          </p>
          <p className="text-4xl font-black text-yellow-300">
            {correctAnswer.toLocaleString("de-DE")}
            {payload?.unit ? ` ${payload.unit}` : ""}
          </p>
        </div>

        {/* Rankings */}
        <div className="mb-8 space-y-3">
          {ranked.map((entry) => {
            const isMe = entry.player_id === game.myPlayerId;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 animate-fade-in ${
                  entry.rank === 1
                    ? "bg-yellow-400/20 border border-yellow-400/30"
                    : isMe
                      ? "bg-white/15 border border-white/20"
                      : "bg-white/10"
                }`}
              >
                <span className="w-8 text-center text-lg">
                  {RANK_MEDALS[entry.rank - 1] ?? `${entry.rank}.`}
                </span>
                <span className="text-2xl">
                  {entry.player ? game.getAvatar(entry.player.id) : ""}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-white">
                    {entry.player?.display_name}
                    {isMe && <span className="ml-2 text-xs text-white/50">(Du)</span>}
                  </p>
                  <p className="text-sm text-white/50">
                    Geschätzt: {(entry.numeric_answer ?? 0).toLocaleString("de-DE")}
                    {payload?.unit ? ` ${payload.unit}` : ""} · Abstand:{" "}
                    {entry.distance.toLocaleString("de-DE")}
                  </p>
                </div>
                <span className="text-lg font-black text-white tabular-nums">
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
            className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-purple-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
          >
            {isLastRound ? "Block-Ergebnis anzeigen" : "Nächste Runde →"}
          </button>
        ) : (
          <div className="w-full rounded-2xl bg-white/10 px-6 py-4 text-center backdrop-blur-sm">
            <p className="text-lg font-bold text-white/80">
              {isLastRound ? "Der Host zeigt das Block-Ergebnis..." : "Der Host startet die nächste Runde... ⏳"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
