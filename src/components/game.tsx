"use client";

import { useGame } from "@/lib/game-context";
import { HomeScreen } from "./home-screen";
import { LobbyScreen } from "./lobby-screen";
import { ThemePickScreen } from "./theme-pick-screen";
import { NumberGuessScreen } from "./number-guess-screen";
import { NumberGuessRevealScreen } from "./number-guess-reveal-screen";
import { PickCorrectScreen } from "./pick-correct-screen";
import { BlockScoreboardScreen } from "./block-scoreboard-screen";
import { FinalScreen } from "./final-screen";

export function Game() {
  const game = useGame();

  return (
    <>
      {game.disconnected && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-amber-500 px-5 py-3 text-center shadow-xl animate-fade-in">
          <p className="font-bold text-white text-sm">Verbindung verloren.</p>
          <p className="text-white/90 text-xs mt-0.5">Verbindung wird wiederhergestellt…</p>
        </div>
      )}

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
          case "theme_pick":
            return <ThemePickScreen />;
          case "playing_loading":
            return (
              <div
                className="flex flex-1 items-center justify-center"
                style={{ background: "var(--rp-bg-hero)" }}
              >
                <div className="text-lg animate-pulse font-medium" style={{ color: "var(--rp-text-secondary)" }}>
                  Spiel wird geladen…
                </div>
              </div>
            );
          case "number_guess":
          case "number_guess_waiting":
            return <NumberGuessScreen />;
          case "number_guess_reveal":
            return <NumberGuessRevealScreen />;
          case "pick_correct":
            return <PickCorrectScreen />;
          case "block_scoreboard":
            return <BlockScoreboardScreen />;
          case "final":
            return <FinalScreen />;
          default:
            return <HomeScreen />;
        }
      })()}
    </>
  );
}
