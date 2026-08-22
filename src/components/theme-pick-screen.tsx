"use client";

import { useGame } from "@/lib/game-context";

const THEME_ICONS: Record<string, string> = {
  gaming: "🎮",
  geschichte: "📜",
  "wissenschaft-natur": "🔬",
  sport: "⚽",
  musik: "🎵",
  "film-serie": "🎬",
  "reise-orte": "🌍",
  "alltag-peinlich": "😅",
};

export function ThemePickScreen() {
  const game = useGame();
  const picker = game.players.find((p) => p.id === game.themePickerPlayerId);
  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const mode = game.currentBlock?.mode;

  const modeLabel =
    mode === "number_guess"
      ? "Zahlenraten"
      : mode === "pick_correct"
        ? "Passendes wählen"
        : mode ?? "";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 px-4 py-8">
      <div className="w-full max-w-lg text-center">
        <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/50">
          Block {blockNum} von {game.room?.total_blocks ?? 4}
        </div>

        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80">
          {mode === "number_guess" ? "🔢" : "🃏"} {modeLabel}
        </div>

        <h2 className="mb-2 text-3xl font-black text-white">Thema wählen</h2>

        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="text-2xl">{picker ? game.getAvatar(picker.id) : ""}</span>
          <span className="text-lg text-white/80">
            {game.isThemePicker ? (
              <span className="font-bold text-yellow-300">Du wählst!</span>
            ) : (
              <>
                <span className="font-bold">{picker?.display_name}</span> wählt...
              </>
            )}
          </span>
        </div>

        {game.isThemePicker ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {game.themeOptions.map((theme) => {
              const icon = THEME_ICONS[theme.slug] ?? "❓";
              return (
                <button
                  key={theme.id}
                  onClick={() => void game.selectTheme(theme.id)}
                  className="group relative overflow-hidden rounded-3xl bg-white/10 p-8 backdrop-blur-sm border-2 border-white/10 transition-all hover:scale-[1.03] hover:border-white/30 hover:bg-white/15 active:scale-[0.97]"
                >
                  <span className="mb-3 block text-5xl">{icon}</span>
                  <span className="block text-xl font-bold text-white">
                    {theme.name_de}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-sm">
            <div className="text-4xl animate-bounce-slow mb-4">🤔</div>
            <p className="text-lg text-white/70">
              Warte auf {picker?.display_name}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
