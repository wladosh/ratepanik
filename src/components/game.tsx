"use client";

import { useState } from "react";
import { useGame, type GamePhase } from "@/lib/game-context";
import { HomeScreen } from "./home-screen";
import { LobbyScreen } from "./lobby-screen";
import { ThemePickScreen } from "./theme-pick-screen";
import { NumberGuessScreen } from "./number-guess-screen";
import { NumberGuessRevealScreen } from "./number-guess-reveal-screen";
import { PickCorrectScreen } from "./pick-correct-screen";
import { BlockScoreboardScreen } from "./block-scoreboard-screen";
import { FinalScreen } from "./final-screen";

const MATCH_PHASES: GamePhase[] = [
  "theme_pick",
  "number_guess",
  "number_guess_waiting",
  "number_guess_reveal",
  "pick_correct",
  "block_scoreboard",
];

function LeaveMatchDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ background: "rgba(42, 42, 74, 0.45)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-xs p-6 text-center animate-fade-in"
        style={{
          background: "var(--rp-bg-elevated)",
          borderRadius: "var(--rp-radius-lg)",
          boxShadow: "0 16px 48px rgba(42, 42, 74, 0.25)",
        }}
      >
        <p className="text-3xl mb-3">&#x1F6AA;</p>
        <h3
          className="text-lg font-bold mb-1"
          style={{ color: "var(--rp-text)" }}
        >
          Match wirklich verlassen?
        </h3>
        <p
          className="text-sm mb-5"
          style={{ color: "var(--rp-text-secondary)" }}
        >
          Dein Fortschritt geht verloren und die anderen spielen ohne dich weiter.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-[var(--rp-radius-pill)] text-sm font-bold transition-all active:scale-[0.97]"
            style={{
              border: "2px solid var(--rp-border)",
              color: "var(--rp-text)",
              background: "transparent",
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 rounded-[var(--rp-radius-pill)] text-sm font-bold text-white transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, var(--rp-danger) 0%, #E0445A 100%)",
            }}
          >
            Verlassen
          </button>
        </div>
      </div>
    </div>
  );
}

export function Game() {
  const game = useGame();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const isMatchPhase = MATCH_PHASES.includes(game.phase);

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

      {isMatchPhase && (
        <button
          onClick={() => setShowLeaveConfirm(true)}
          className="fixed top-3 left-3 z-40 flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-90"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(42,42,74,0.10)",
            marginTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset, 0px))",
          }}
          aria-label="Match verlassen"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="var(--rp-text-secondary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 5 12 10 7" />
            <line x1="5" y1="12" x2="15" y2="12" />
          </svg>
        </button>
      )}

      {showLeaveConfirm && (
        <LeaveMatchDialog
          onCancel={() => setShowLeaveConfirm(false)}
          onConfirm={() => {
            setShowLeaveConfirm(false);
            void game.leaveRoom();
          }}
        />
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
