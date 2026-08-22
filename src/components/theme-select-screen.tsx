"use client";

import { useGame } from "@/lib/game-context";

export function ThemeSelectScreen() {
  const game = useGame();

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
      style={{ background: "var(--rp-bg-hero)" }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mb-2 text-sm font-semibold text-[var(--rp-text-secondary)] uppercase tracking-wider">
          Block {game.currentBlockIndex + 1} von {game.totalBlocks}
        </div>
        <h2 className="mb-2 text-2xl font-extrabold text-[var(--rp-text)]">
          Thema wählen
        </h2>
        <p className="mb-8 text-sm text-[var(--rp-text-secondary)]">
          {game.currentBlock?.mode === "number_guess"
            ? "Zahlenraten — Wie nah kommst du dran?"
            : "Passendes wählen — Finde die 4 Richtigen!"}
        </p>

        <div className="space-y-4">
          {game.themeOptions.map((theme) => (
            <button
              key={theme.id}
              onClick={() => void game.selectTheme(theme.id)}
              className="w-full rounded-[var(--rp-radius-lg)] p-5 text-left transition-all active:scale-[0.97] hover:scale-[1.01]"
              style={{
                background: "var(--rp-bg-elevated)",
                boxShadow: "var(--rp-shadow-card)",
              }}
            >
              <span className="text-lg font-bold text-[var(--rp-text)]">
                {theme.name_de}
              </span>
            </button>
          ))}
        </div>

        {!game.isHost && (
          <p className="mt-6 text-sm text-[var(--rp-text-secondary)]">
            Der Host wählt das Thema...
          </p>
        )}
      </div>
    </div>
  );
}
