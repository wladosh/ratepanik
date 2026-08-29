"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";
import { MatchPlayShell } from "./match-play-shell";
import { PlayerSchleimi } from "./player-schleimi";
import { PlayerNameRow } from "./player-name-row";
import {
  FINALE_SURVIVOR_BONUS,
  FINALE_STEP_SURVIVE_BONUS,
} from "@/lib/finale-survival";

const AUTO_ADVANCE_MS = 4500;

export function FinaleFinishedScreen() {
  const game = useGame();
  const view = game.finaleView;
  const advancedRef = useRef(false);

  const survivorId = view?.survivorId;
  const survivor = game.players.find((p) => p.id === survivorId);
  const iAmSurvivor = survivorId === game.myPlayerId;

  const multipleSurvivors = (view?.livingPlayerIds.length ?? 0) > 1;
  const noSurvivor = !survivorId && !multipleSurvivors;

  const stepsRevealed = view?.pastSteps.length ?? 0;

  const playerName = (playerId: string) =>
    game.players.find((p) => p.id === playerId)?.display_name ?? "?";

  useEffect(() => {
    if (!game.isHost || advancedRef.current) return;
    const timer = setTimeout(() => {
      advancedRef.current = true;
      void game.advanceFromFinale();
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [game]);

  const handleContinue = () => {
    if (!game.isHost) return;
    if (advancedRef.current) return;
    advancedRef.current = true;
    void game.advanceFromFinale();
  };

  return (
    <MatchPlayShell ariaLabel="Finale – Bonuspunkte">
      <div
        className="flex flex-1 flex-col items-center justify-center px-4 pb-6"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))" }}
      >
        <div className="mb-6 text-center">
          <span
            className="nb-card inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.13em] mb-3"
            style={{ background: "var(--rp-nb-red)", color: "white" }}
          >
            ⚡ FINALE BEENDET
          </span>
        </div>

        {survivor && (
          <div
            className="nb-card-lg w-full max-w-sm p-6 text-center mb-6 animate-fade-in"
            style={{ background: "var(--rp-nb-yellow)" }}
          >
            <div className="flex justify-center mb-3">
              <span
                className="nb-card flex h-20 w-20 items-center justify-center"
                style={{ background: "var(--rp-nb-white)" }}
              >
                <PlayerSchleimi playerId={survivor.id} size={72} />
              </span>
            </div>
            <p className="text-3xl mb-2">⚡</p>
            <h1 className="nb-heading text-[26px] mb-1">
              {iAmSurvivor ? "Du hast überlebt!" : `${survivor.display_name} überlebt!`}
            </h1>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              +{FINALE_SURVIVOR_BONUS + stepsRevealed * FINALE_STEP_SURVIVE_BONUS} Bonuspunkte
            </p>
          </div>
        )}

        {multipleSurvivors && (
          <div
            className="nb-card-lg w-full max-w-sm p-6 text-center mb-6 animate-fade-in"
            style={{ background: "var(--rp-nb-green)" }}
          >
            <p className="text-3xl mb-2">🎉</p>
            <h1 className="nb-heading text-[26px] mb-1 text-white">
              Alle haben überlebt!
            </h1>
            <p className="text-sm font-bold text-white" style={{ opacity: 0.9 }}>
              {view!.livingPlayerIds.length} Spieler erhalten Bonuspunkte.
            </p>
            <div className="flex justify-center gap-2 mt-3">
              {view!.livingPlayerIds.map((pid) => (
                <div key={pid} className="flex flex-col items-center gap-1">
                  <PlayerSchleimi playerId={pid} size={40} />
                  <span className="text-[10px] font-black text-white">
                    {playerName(pid)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {noSurvivor && (
          <div
            className="nb-card-lg w-full max-w-sm p-6 text-center mb-6 animate-fade-in"
            style={{ background: "var(--rp-nb-cream)" }}
          >
            <p className="text-3xl mb-2">💀</p>
            <h1 className="nb-heading text-[26px] mb-1">Alle raus!</h1>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              Keiner hat es geschafft. Keine Bonuspunkte.
            </p>
          </div>
        )}

        {view && view.eliminatedPlayerIds.length > 0 && (
          <div className="w-full max-w-sm mb-5">
            <h3
              className="text-[10px] font-black uppercase tracking-wider mb-2 px-1"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              Ausgeschieden ({view.eliminatedPlayerIds.length})
            </h3>
            <div className="space-y-2">
              {view.eliminatedPlayerIds.map((pid) => (
                <div
                  key={pid}
                  className="nb-card flex items-center gap-3 px-3 py-2"
                  style={{ background: "var(--rp-nb-white)", opacity: 0.6 }}
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
                </div>
              ))}
            </div>
          </div>
        )}

        <p
          className="text-xs font-bold mb-4"
          style={{ color: "var(--rp-nb-text-secondary)" }}
        >
          Weiter zum Endstand…
        </p>

        {game.isHost && (
          <button
            onClick={handleContinue}
            className="nb-btn h-[52px] w-full max-w-sm text-[15px] text-white"
            style={{ background: "var(--rp-nb-peach)" }}
          >
            Zum Endstand →
          </button>
        )}
      </div>
    </MatchPlayShell>
  );
}
