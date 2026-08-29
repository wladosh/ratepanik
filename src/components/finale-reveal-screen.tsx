"use client";

import { useGame } from "@/lib/game-context";
import { MatchPlayShell } from "./match-play-shell";
import { PlayerSchleimi } from "./player-schleimi";
import { PlayerNameRow } from "./player-name-row";

export function FinaleRevealScreen() {
  const game = useGame();
  const view = game.finaleView;

  if (!view?.currentStepView) return null;

  const step = view.currentStepView;
  const myPick = step.myPick;
  const correctSide = step.correctSide;
  const isMyCorrect = myPick != null && myPick === correctSide;
  const isEliminated = view.eliminatedPlayerIds.includes(game.myPlayerId ?? "");

  const playerName = (playerId: string) =>
    game.players.find((p) => p.id === playerId)?.display_name ?? "?";

  return (
    <MatchPlayShell ariaLabel="Finale – Auflösung">
      <div
        className="flex flex-1 flex-col items-center px-4 pb-6"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))" }}
      >
        <div className="mt-14 mb-4 w-full max-w-sm">
          <div className="mb-3 flex items-center justify-between">
            <span
              className="nb-card inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.13em]"
              style={{ background: "var(--rp-nb-red)", color: "white" }}
            >
              ⚡ AUFLÖSUNG
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              Schritt {view.currentStep + 1} / {view.totalSteps}
            </span>
          </div>
        </div>

        {/* Prompt */}
        <div className="w-full max-w-sm mb-4">
          <div
            className="nb-card-lg p-4 text-center"
            style={{ background: "var(--rp-nb-white)" }}
          >
            <p className="text-base font-black" style={{ color: "var(--rp-nb-text)" }}>
              {step.prompt}
            </p>
          </div>
        </div>

        {/* Options with reveal coloring */}
        <div className="w-full max-w-sm space-y-3 mb-5">
          {(["left", "right"] as const).map((side) => {
            const isCorrect = correctSide === side;
            const label = side === "left" ? "A" : "B";
            const text = side === "left" ? step.optionLeft : step.optionRight;
            const isMyChoice = myPick === side;

            return (
              <div
                key={side}
                className="nb-card px-4 py-4 flex items-center gap-3 transition-all"
                style={{
                  background: isCorrect
                    ? "var(--rp-nb-green)"
                    : "var(--rp-nb-white)",
                  color: isCorrect ? "white" : "var(--rp-nb-text)",
                  borderColor: isMyChoice
                    ? isCorrect
                      ? "var(--rp-nb-green)"
                      : "var(--rp-nb-red)"
                    : "var(--rp-nb-border-color)",
                  borderWidth: isMyChoice ? 3 : undefined,
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-sm font-black"
                  style={{
                    borderRadius: "var(--rp-nb-radius-sm)",
                    background: isCorrect ? "rgba(255,255,255,0.3)" : "var(--rp-nb-cream)",
                    color: isCorrect ? "white" : "var(--rp-nb-text-secondary)",
                  }}
                >
                  {isCorrect ? "✓" : label}
                </span>
                <span className="flex-1 font-black text-[15px]">{text}</span>
                {isMyChoice && (
                  <span
                    className="nb-card px-2 py-0.5 text-[10px] font-black uppercase"
                    style={{
                      background: isCorrect ? "rgba(255,255,255,0.3)" : "var(--rp-nb-red)",
                      color: "white",
                    }}
                  >
                    {isCorrect ? "Richtig!" : "Falsch!"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Your result */}
        {!isEliminated && myPick && (
          <div
            className="nb-card-lg w-full max-w-sm p-4 text-center mb-5 animate-fade-in"
            style={{
              background: isMyCorrect ? "var(--rp-nb-green)" : "var(--rp-nb-red)",
              color: "white",
            }}
          >
            <p className="text-2xl mb-1">{isMyCorrect ? "🎉" : "💀"}</p>
            <p className="font-black text-lg">
              {isMyCorrect ? "Du überlebst!" : "Ausgeschieden!"}
            </p>
          </div>
        )}

        {/* Eliminated this step */}
        {step.eliminatedThisStep.length > 0 && (
          <div className="w-full max-w-sm mb-4">
            <h3
              className="text-[10px] font-black uppercase tracking-wider mb-2 px-1"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              Ausgeschieden in diesem Schritt
            </h3>
            <div className="space-y-2">
              {step.eliminatedThisStep.map((pid) => (
                <div
                  key={pid}
                  className="nb-card flex items-center gap-3 px-3 py-2"
                  style={{
                    background: "var(--rp-nb-white)",
                    opacity: 0.7,
                  }}
                >
                  <span style={{ filter: "grayscale(1)" }}>
                    <PlayerSchleimi playerId={pid} size={28} />
                  </span>
                  <PlayerNameRow
                    className="flex-1"
                    name={playerName(pid)}
                    isMe={pid === game.myPlayerId}
                    youLabel="Du"
                  />
                  <span className="text-xs font-bold" style={{ color: "var(--rp-nb-red)" }}>
                    ✕
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Survivors */}
        <div className="w-full max-w-sm mb-5">
          <h3
            className="text-[10px] font-black uppercase tracking-wider mb-2 px-1"
            style={{ color: "var(--rp-nb-text-secondary)" }}
          >
            Noch im Rennen ({view.livingPlayerIds.length})
          </h3>
          <div className="flex gap-2 flex-wrap">
            {view.livingPlayerIds.map((pid) => (
              <div
                key={pid}
                className="nb-card flex items-center gap-2 px-3 py-2"
                style={{
                  background:
                    pid === game.myPlayerId
                      ? "var(--rp-nb-lilac)"
                      : "var(--rp-nb-white)",
                }}
              >
                <PlayerSchleimi playerId={pid} size={24} />
                <span className="text-xs font-black">
                  {playerName(pid)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Host advance button */}
        {game.isHost && (
          <button
            onClick={() => void game.advanceFinaleFromReveal()}
            className="nb-btn h-[52px] w-full max-w-sm text-[15px] text-white"
            style={{ background: "var(--rp-nb-peach)" }}
          >
            Weiter →
          </button>
        )}
        {!game.isHost && (
          <div
            className="nb-card w-full max-w-sm px-4 py-3 text-center"
            style={{ background: "var(--rp-nb-white)", borderStyle: "dashed" }}
          >
            <p
              className="text-sm font-bold"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              Der Host geht gleich weiter…
            </p>
          </div>
        )}
      </div>
    </MatchPlayShell>
  );
}
