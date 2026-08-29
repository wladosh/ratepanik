"use client";

import { useEffect, useRef, useState } from "react";
import { useGame, type GamePhase } from "@/lib/game-context";
import { useAchievementUnlockWatcher } from "@/lib/use-achievement-unlock";
import { usePresenceHeartbeat } from "@/lib/use-presence-heartbeat";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { generateGuestName } from "@/lib/guest-name";
import { HomeScreen } from "./home-screen";
import { LobbyScreen } from "./lobby-screen";
import { GuestExitToLogin, JoiningScreen } from "./joining-screen";
import { ThemePickScreen } from "./theme-pick-screen";
import { NumberGuessScreen } from "./number-guess-screen";
import { NumberGuessRevealScreen } from "./number-guess-reveal-screen";
import { FindLieScreen } from "./find-lie-screen";
import { FindLieRevealScreen } from "./find-lie-reveal-screen";
import { OrderItScreen } from "./order-it-screen";
import { OrderItRevealScreen } from "./order-it-reveal-screen";
import { PickCorrectScreen } from "./pick-correct-screen";
import { BlockScoreboardScreen } from "./block-scoreboard-screen";
import { FinalScreen } from "./final-screen";
import { VsIntroScreen } from "./vs-intro-screen";
import { FinaleRouletteScreen } from "./finale-roulette-screen";
import { FinaleStepScreen } from "./finale-step-screen";
import { FinaleRevealScreen } from "./finale-reveal-screen";
import { FinaleFinishedScreen } from "./finale-finished-screen";

const MATCH_PHASES: GamePhase[] = [
  "vs_intro",
  "theme_pick",
  "number_guess",
  "number_guess_waiting",
  "number_guess_reveal",
  "find_lie",
  "find_lie_waiting",
  "find_lie_reveal",
  "order_it",
  "order_it_waiting",
  "order_it_reveal",
  "pick_correct",
  "block_scoreboard",
  "finale_roulette",
  "finale_step",
  "finale_step_waiting",
  "finale_reveal",
  "finale_finished",
];

function LeaveMatchDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center px-6"
      style={{ background: "rgba(26, 26, 46, 0.85)" }}
    >
      <div
        className="nb-card-lg w-full max-w-xs p-6 text-center animate-fade-in"
      >
        <p className="text-3xl mb-3">&#x1F6AA;</p>
        <h3
          className="nb-heading text-lg mb-1"
        >
          {t.game.leaveTitle}
        </h3>
        <p
          className="text-sm mb-5"
          style={{ color: "var(--rp-text-secondary)" }}
        >
          {t.game.leaveBody}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="nb-btn flex-1 h-11 text-sm"
            style={{
              background: "var(--rp-nb-white)",
              color: "var(--rp-nb-black)",
            }}
          >
            {t.game.leaveCancel}
          </button>
          <button
            onClick={onConfirm}
            className="nb-btn flex-1 h-11 text-sm text-white"
            style={{
              background: "var(--rp-nb-red)",
            }}
          >
            {t.game.leaveConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function useGuestLobbyBack(active: boolean, onLeave: () => void) {
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;

  useEffect(() => {
    if (!active) return;
    window.history.pushState({ rpGuestLock: true }, "");
    const onPop = () => {
      onLeaveRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [active]);
}

export function Game() {
  const game = useGame();
  const { t } = useI18n();
  const { isGuest } = useAuth();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useAchievementUnlockWatcher(game.phase);
  usePresenceHeartbeat();
  useGuestLobbyBack(Boolean(isGuest && game.phase === "lobby"), () => {
    void game.leaveRoom();
  });

  const isMatchPhase = MATCH_PHASES.includes(game.phase);

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      {(() => {
        switch (game.phase) {
          case "home":
            return (isGuest && !game.wasKicked) ? <GuestExitToLogin /> : <HomeScreen />;
          case "lobby":
            return <LobbyScreen />;
          case "vs_intro":
            return <VsIntroScreen />;
          case "theme_pick":
            return <ThemePickScreen />;
          case "playing_loading":
            return game.room || game.restoring ? (
              <div
                className="flex flex-1 items-center justify-center"
                style={{ background: "var(--rp-nb-cream)" }}
              >
                <div className="nb-heading text-lg" style={{ color: "var(--rp-nb-black)" }}>
                  {t.game.playingLoading}
                </div>
              </div>
            ) : (
              <JoiningScreen
                error={game.error}
                onRetry={
                  game.error
                    ? () => {
                        const code = new URLSearchParams(window.location.search).get("join");
                        if (code) void game.joinRoom(code, generateGuestName());
                      }
                    : undefined
                }
              />
            );
          case "number_guess":
          case "number_guess_waiting":
            return <NumberGuessScreen />;
          case "number_guess_reveal":
            return <NumberGuessRevealScreen />;
          case "find_lie":
          case "find_lie_waiting":
            return <FindLieScreen />;
          case "find_lie_reveal":
            return <FindLieRevealScreen />;
          case "order_it":
          case "order_it_waiting":
            return <OrderItScreen />;
          case "order_it_reveal":
            return <OrderItRevealScreen />;
          case "pick_correct":
            return <PickCorrectScreen />;
          case "block_scoreboard":
            return <BlockScoreboardScreen />;
          case "finale_roulette":
            return <FinaleRouletteScreen />;
          case "finale_step":
          case "finale_step_waiting":
            return <FinaleStepScreen />;
          case "finale_reveal":
            return <FinaleRevealScreen />;
          case "finale_finished":
            return <FinaleFinishedScreen />;
          case "final":
            return <FinalScreen />;
          default:
            return (isGuest && !game.wasKicked) ? <GuestExitToLogin /> : <HomeScreen />;
        }
      })()}

      {isMatchPhase && (
        <button
          onClick={() => setShowLeaveConfirm(true)}
          className="nb-btn absolute top-3 left-3 z-40 flex items-center justify-center min-w-11 min-h-11 w-11 h-11 transition-all"
          style={{
            background: "var(--rp-nb-white)",
            marginTop: "calc(6px + var(--ps-notch-inset, 0px))",
          }}
          aria-label={t.game.leaveAria}
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

      {game.disconnected && (
        <div className="rp-shell-banner nb-card px-5 py-3 text-center animate-fade-in" style={{ background: "var(--rp-nb-yellow)" }}>
          <p className="font-bold text-sm" style={{ color: "var(--rp-nb-black)" }}>{t.game.disconnectedTitle}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--rp-nb-black)" }}>{t.game.disconnectedBody}</p>
        </div>
      )}

      {game.error && game.room && (
        <div
          className="rp-shell-banner nb-card px-5 py-3 text-center font-bold text-white animate-fade-in"
          style={{ background: "var(--rp-nb-red)" }}
          role="alert"
        >
          {game.error}
        </div>
      )}

      {game.notice && (
        <div
          className="rp-shell-banner nb-card px-5 py-3 text-center font-bold text-white animate-fade-in"
          style={{ background: "var(--rp-nb-green)" }}
          role="status"
        >
          {game.notice}
        </div>
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
    </div>
  );
}
