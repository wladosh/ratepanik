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

  switch (game.phase) {
    case "home":
      return <HomeScreen />;
    case "lobby":
      return <LobbyScreen />;
    case "question":
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
}
