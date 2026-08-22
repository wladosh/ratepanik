"use client";

import { useGame } from "@/lib/game-context";

const THEME_ICONS: Record<string, string> = {
  gaming: "\u{1F3AE}",
  geschichte: "\u{1F4DC}",
  "wissenschaft-natur": "\u{1F52C}",
  sport: "\u26BD",
  musik: "\u{1F3B5}",
  "film-serie": "\u{1F3AC}",
  "reise-orte": "\u{1F30D}",
  "alltag-peinlich": "\u{1F605}",
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
        ? "Passendes w\u00e4hlen"
        : mode ?? "";

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-5 py-6"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--rp-text-secondary)" }}>
          Block {blockNum} von {game.room?.total_blocks ?? 4}
        </p>

        <span
          className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-sm font-semibold mb-3"
          style={{
            background: "var(--rp-bg-elevated)",
            color: "var(--rp-text-secondary)",
            boxShadow: "0 2px 8px rgba(42, 42, 74, 0.06)",
          }}
        >
          {mode === "number_guess" ? "\u{1F522}" : "\u{1F0CF}"} {modeLabel}
        </span>

        <h2 className="mb-2 text-2xl font-extrabold" style={{ color: "var(--rp-text)" }}>
          Thema w\u00e4hlen
        </h2>

        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-2xl">{picker ? game.getAvatar(picker.id) : ""}</span>
          <span className="text-base" style={{ color: "var(--rp-text-secondary)" }}>
            {game.isThemePicker ? (
              <span className="font-bold" style={{ color: "var(--rp-peach)" }}>Du w\u00e4hlst!</span>
            ) : (
              <>
                <span className="font-bold" style={{ color: "var(--rp-text)" }}>{picker?.display_name}</span> w\u00e4hlt\u2026
              </>
            )}
          </span>
        </div>

        {game.isThemePicker ? (
          <div className="grid grid-cols-1 gap-3">
            {game.themeOptions.map((theme) => {
              const icon = THEME_ICONS[theme.slug] ?? "\u2753";
              return (
                <button
                  key={theme.id}
                  onClick={() => void game.selectTheme(theme.id)}
                  className="flex items-center gap-4 p-5 transition-all active:scale-[0.97]"
                  style={{
                    background: "var(--rp-bg-elevated)",
                    borderRadius: "var(--rp-radius-lg)",
                    boxShadow: "var(--rp-shadow-card)",
                    border: "2px solid var(--rp-border)",
                  }}
                >
                  <span className="text-4xl">{icon}</span>
                  <span className="text-lg font-bold" style={{ color: "var(--rp-text)" }}>
                    {theme.name_de}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className="p-8"
            style={{
              background: "var(--rp-bg-elevated)",
              borderRadius: "var(--rp-radius-lg)",
              boxShadow: "var(--rp-shadow-card)",
            }}
          >
            <div className="text-4xl animate-bounce-slow mb-3">{"\u{1F914}"}</div>
            <p className="text-base" style={{ color: "var(--rp-text-secondary)" }}>
              Warte auf {picker?.display_name}\u2026
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
