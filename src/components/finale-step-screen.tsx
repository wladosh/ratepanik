"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";
import { MatchPlayShell } from "./match-play-shell";
import { PlayerSchleimi } from "./player-schleimi";
import { AnswerWaitingPanel } from "./answer-waiting-panel";

export function FinaleStepScreen() {
  const game = useGame();
  const view = game.finaleView;
  const submittedRef = useRef(false);
  const lastStepRef = useRef(view?.currentStep);

  useEffect(() => {
    if (lastStepRef.current !== view?.currentStep) {
      submittedRef.current = false;
      lastStepRef.current = view?.currentStep;
    }
  }, [view?.currentStep]);

  if (!view?.currentStepView) {
    return (
      <MatchPlayShell ariaLabel="Finale">
        <div className="flex flex-1 items-center justify-center">
          <div className="nb-heading text-lg" style={{ color: "var(--rp-nb-black)" }}>
            Wird geladen…
          </div>
        </div>
      </MatchPlayShell>
    );
  }

  const step = view.currentStepView;
  const isEliminated = view.eliminatedPlayerIds.includes(game.myPlayerId ?? "");
  const hasPicked = step.myPick !== null;
  const isWaiting = hasPicked || isEliminated;

  const handlePick = async (side: "left" | "right") => {
    if (submittedRef.current || hasPicked || isEliminated) return;
    submittedRef.current = true;
    try {
      await game.submitFinalePick(side);
    } catch {
      submittedRef.current = false;
    }
  };

  return (
    <MatchPlayShell ariaLabel="Finale – Frage">
      <div
        className="flex flex-1 flex-col items-center px-4 pb-6"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))" }}
      >
        {/* Header */}
        <div className="mt-14 mb-4 w-full max-w-sm">
          <div className="mb-3 flex items-center justify-between">
            <span
              className="nb-card inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.13em]"
              style={{ background: "var(--rp-nb-red)", color: "white" }}
            >
              ⚡ FINALE
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              Schritt {view.currentStep + 1} / {view.totalSteps}
            </span>
          </div>

          {/* Living players indicator */}
          <div className="flex items-center gap-1 mb-4">
            <span
              className="text-[10px] font-black uppercase tracking-wider mr-1"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              Noch dabei:
            </span>
            {view.livingPlayerIds.map((pid) => (
              <span key={pid} className="relative">
                <PlayerSchleimi playerId={pid} size={28} />
                {pid === game.myPlayerId && (
                  <span
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-black"
                    style={{ color: "var(--rp-nb-peach)" }}
                  >
                    DU
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="w-full max-w-sm mb-6">
          <div
            className="nb-card-lg p-5 text-center"
            style={{ background: "var(--rp-nb-white)" }}
          >
            <p className="text-lg font-black" style={{ color: "var(--rp-nb-text)" }}>
              {step.prompt}
            </p>
          </div>
        </div>

        {/* Eliminated spectator view */}
        {isEliminated && (
          <AnswerWaitingPanel
            title="Du bist ausgeschieden"
            description={`Noch ${view.livingPlayerIds.length} Spieler im Rennen. Schau zu!`}
          />
        )}

        {/* Waiting after pick */}
        {hasPicked && !isEliminated && (
          <AnswerWaitingPanel
            title="Antwort gesperrt"
            description="Warte auf die anderen Spieler…"
          >
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
                {step.answeredCount} / {view.livingPlayerIds.length} haben geantwortet
              </span>
            </div>
          </AnswerWaitingPanel>
        )}

        {/* Pick options (A/B) */}
        {!isWaiting && (
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => void handlePick("left")}
              className="nb-btn w-full py-5 text-[17px] font-black text-white"
              style={{ background: "var(--rp-nb-peach)" }}
              aria-label={`Option A: ${step.optionLeft}`}
            >
              <span className="flex items-center justify-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center text-sm font-black"
                  style={{
                    borderRadius: "var(--rp-nb-radius-sm)",
                    background: "rgba(255,255,255,0.3)",
                  }}
                >
                  A
                </span>
                <span>{step.optionLeft}</span>
              </span>
            </button>

            <button
              onClick={() => void handlePick("right")}
              className="nb-btn w-full py-5 text-[17px] font-black text-white"
              style={{ background: "var(--rp-nb-purple-deep)" }}
              aria-label={`Option B: ${step.optionRight}`}
            >
              <span className="flex items-center justify-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center text-sm font-black"
                  style={{
                    borderRadius: "var(--rp-nb-radius-sm)",
                    background: "rgba(255,255,255,0.3)",
                  }}
                >
                  B
                </span>
                <span>{step.optionRight}</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </MatchPlayShell>
  );
}
