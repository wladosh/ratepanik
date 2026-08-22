"use client";

import { useGame } from "@/lib/game-context";
import { HomeScreen } from "./home-screen";
import { LobbyScreen } from "./lobby-screen";
import { QuestionScreen } from "./question-screen";
import { RevealScreen } from "./reveal-screen";
import { ScoreboardScreen } from "./scoreboard-screen";
import { FinalScreen } from "./final-screen";

export function Game() {
  const game = useGame();

  return (
    <>
      {game.error && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-red-500 px-6 py-3 text-center font-bold text-white shadow-xl animate-fade-in">
          {game.error}
        </div>
      )}

      {(() => {
        switch (game.phase) {
          case "home":
            return <HomeScreen />;
          case "lobby":
            return <LobbyScreen />;
          case "question":
          case "answered":
            return <QuestionScreen />;
          case "reveal":
            return <RevealScreen />;
          case "scoreboard":
            return <ScoreboardScreen />;
          case "final":
            return <FinalScreen />;
          default:
            return <HomeScreen />;
        }
      })()}
    </>
  );
}
