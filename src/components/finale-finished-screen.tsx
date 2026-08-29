"use client";

import { useGame } from "@/lib/game-context";
import { MatchPlayShell } from "./match-play-shell";
import { PlayerSchleimi } from "./player-schleimi";
import { PlayerNameRow } from "./player-name-row";

export function FinaleFinishedScreen() {
  const game = useGame();
  const view = game.finaleView;

  const survivorId = view?.survivorId;
  const survivor = game.players.find((p) => p.id === survivorId);
  const iAmSurvivor = survivorId === game.myPlayerId;

  const multipleSurvivors = (view?.livingPlayerIds.length ?? 0) > 1;
  const noSurvivor = !survivorId && !multipleSurvivors;

  const playerName = (playerId: string) =>
    game.players.find((p) => p.id === playerId)?.display_name ?? "?";

  return (
    <MatchPlayShell ariaLabel="Finale – Ergebnis">
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

        {/* Single survivor = winner */}
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
            <p className="text-3xl mb-2">🏆</p>
            <h1 className="nb-heading text-[26px] mb-1">
              {iAmSurvivor ? "Du hast überlebt!" : `${survivor.display_name} gewinnt!`}
            </h1>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              {iAmSurvivor
                ? "Letzter Überlebender — Champion des Finales!"
                : `${survivor.display_name} ist der letzte Überlebende.`}
            </p>
          </div>
        )}

        {/* Multiple survivors (all steps exhausted) */}
        {multipleSurvivors && (
          <div
            className="nb-card-lg w-full max-w-sm p-6 text-center mb-6 animate-fade-in"
            style={{ background: "var(--rp-nb-green)" }}
          >
            <p className="text-3xl mb-2">🎉</p>
            <h1 className="nb-heading text-[26px] mb-1 text-white">
              Unentschieden!
            </h1>
            <p className="text-sm font-bold text-white" style={{ opacity: 0.9 }}>
              {view!.livingPlayerIds.length} Spieler haben alle Schritte überlebt.
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

        {/* No survivor (shouldn't happen due to sudden death, but handle) */}
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
              Keiner hat es geschafft. Nächstes Mal!
            </p>
          </div>
        )}

        {/* Eliminated players list */}
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

        {/* Past steps summary */}
        {view && view.pastSteps.length > 0 && (
          <div className="w-full max-w-sm mb-5">
            <h3
              className="text-[10px] font-black uppercase tracking-wider mb-2 px-1"
              style={{ color: "var(--rp-nb-text-secondary)" }}
            >
              Rückblick
            </h3>
            <div className="space-y-2">
              {view.pastSteps.map((ps, i) => (
                <div
                  key={i}
                  className="nb-card px-3 py-2"
                  style={{ background: "var(--rp-nb-white)" }}
                >
                  <p className="text-xs font-bold" style={{ color: "var(--rp-nb-text)" }}>
                    {i + 1}. {ps.prompt}
                  </p>
                  <p
                    className="text-[10px] font-bold mt-0.5"
                    style={{ color: "var(--rp-nb-green)" }}
                  >
                    ✓ {ps.correctSide === "left" ? ps.optionLeft : ps.optionRight}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue to final scoreboard */}
        {game.isHost ? (
          <button
            onClick={() => void game.goHome()}
            className="nb-btn h-[52px] w-full max-w-sm text-[15px] text-white"
            style={{ background: "var(--rp-nb-peach)" }}
          >
            Zurück zur Lobby
          </button>
        ) : (
          <button
            onClick={() => void game.goHome()}
            className="nb-btn h-[52px] w-full max-w-sm text-[15px] text-white"
            style={{ background: "var(--rp-nb-peach)" }}
          >
            Fertig
          </button>
        )}
      </div>
    </MatchPlayShell>
  );
}
