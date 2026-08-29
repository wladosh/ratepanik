"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/lib/game-context";
import { MatchPlayShell } from "./match-play-shell";
import { FINALE_ROULETTE_DURATION_MS } from "@/lib/finale-survival";

interface ThemeLabel {
  id: string;
  name: string;
}

export function FinaleRouletteScreen() {
  const game = useGame();
  const view = game.finaleView;
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [landed, setLanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const themeLabels: ThemeLabel[] = useMemo(() => {
    if (!view) return [];
    return view.rouletteThemeIds.map((id, i) => {
      const theme = game.themeOptions.find((t) => t.id === id);
      return { id, name: theme?.name_de ?? `Thema ${i + 1}` };
    });
  }, [view, game.themeOptions]);

  // Fetch theme names
  const [themeNames, setThemeNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!view?.rouletteThemeIds.length) return;
    let cancelled = false;
    import("@/lib/supabase/client").then(({ createBrowserSupabase }) => {
      const sb = createBrowserSupabase();
      sb.from("themes")
        .select("id, name_de")
        .in("id", view.rouletteThemeIds)
        .then(({ data }) => {
          if (cancelled || !data) return;
          const map: Record<string, string> = {};
          for (const row of data) map[row.id] = row.name_de;
          setThemeNames(map);
        });
    });
    return () => { cancelled = true; };
  }, [view?.rouletteThemeIds]);

  const themes = useMemo(() => {
    if (!view) return [];
    return view.rouletteThemeIds.map((id, i) => ({
      id,
      name: themeNames[id] ?? themeLabels[i]?.name ?? `Thema ${i + 1}`,
    }));
  }, [view, themeNames, themeLabels]);

  const winnerIndex = view?.winnerThemeIndex ?? 0;

  useEffect(() => {
    if (landed || themes.length === 0) return;

    let speed = 100;
    let idx = 0;
    const totalDuration = FINALE_ROULETTE_DURATION_MS;
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Ease out: slow down progressively
      speed = 100 + progress * 500;

      idx = (idx + 1) % themes.length;
      setHighlightIndex(idx);

      if (progress >= 1) {
        // Land on the winner
        setHighlightIndex(winnerIndex);
        setLanded(true);
        return;
      }

      intervalRef.current = setTimeout(tick, speed);
    }

    intervalRef.current = setTimeout(tick, speed);
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [themes.length, winnerIndex, landed]);

  const COLORS = [
    "var(--rp-nb-peach)",
    "var(--rp-nb-purple-deep)",
    "var(--rp-nb-green)",
    "var(--rp-nb-yellow)",
  ];

  return (
    <MatchPlayShell ariaLabel="Finale – Glücksrad">
      <div
        className="flex flex-1 flex-col items-center justify-center px-4"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))" }}
      >
        <div className="mb-6 text-center">
          <span
            className="nb-card inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.13em] mb-3"
            style={{ background: "var(--rp-nb-red)", color: "white" }}
          >
            ⚡ FINALE
          </span>
          <h1 className="nb-heading text-[28px] mt-2">Glücksrad</h1>
          <p
            className="text-sm font-bold mt-1"
            style={{ color: "var(--rp-nb-text-secondary)" }}
          >
            {landed ? "Das Thema steht fest!" : "Welches Thema wird es?"}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          {themes.map((theme, i) => {
            const isHighlighted = highlightIndex === i;
            const isWinner = landed && i === winnerIndex;
            return (
              <div
                key={theme.id}
                className="nb-card px-4 py-3 text-center font-black uppercase transition-all"
                style={{
                  background: isHighlighted
                    ? COLORS[i % COLORS.length]
                    : "var(--rp-nb-white)",
                  color: isHighlighted ? "white" : "var(--rp-nb-text)",
                  transform: isHighlighted ? "scale(1.05)" : "scale(1)",
                  borderColor: isWinner
                    ? "var(--rp-nb-peach)"
                    : "var(--rp-nb-border-color)",
                  borderWidth: isWinner ? 3 : undefined,
                }}
              >
                {isWinner && (
                  <span className="text-lg mr-2" aria-hidden="true">
                    ★
                  </span>
                )}
                {theme.name}
              </div>
            );
          })}
        </div>

        {landed && (
          <p
            className="mt-6 text-sm font-bold animate-fade-in"
            style={{ color: "var(--rp-nb-text-secondary)" }}
          >
            Gleich geht&apos;s los…
          </p>
        )}
      </div>
    </MatchPlayShell>
  );
}
