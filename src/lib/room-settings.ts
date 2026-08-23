export type PlayableMode =
  | "number_guess"
  | "pick_correct"
  | "find_lie"
  | "order_it";
export type ModeFilter = "all" | PlayableMode;
export type DifficultyFilter = "mix" | "leicht" | "mittel" | "schwer";
export type ThemeMix = "random" | "manual";
export type TimerSeconds = 5 | 8 | 10 | 15;
export type RevealHoldMs = 500 | 1000 | 1500 | 2000;
export type MaxPlayers = 2 | 3 | 4;
export type BlockCount = 1 | 2 | 3 | 4;
export type QuestionsPerBlock = 1 | 2 | 3 | 4;

export interface RoomSettings {
  v: 1;
  themeMix: ThemeMix;
  themeIds: string[];
  modeFilter: ModeFilter;
  difficulty: DifficultyFilter;
  blocks: BlockCount;
  questionsPerBlock: QuestionsPerBlock;
  timerEnabled: boolean;
  timerSeconds: TimerSeconds;
  revealHoldMs: RevealHoldMs;
  maxPlayers: MaxPlayers;
  allowGuests: boolean;
  autoStart: boolean;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  v: 1,
  themeMix: "random",
  themeIds: [],
  modeFilter: "all",
  difficulty: "mix",
  blocks: 4,
  questionsPerBlock: 2,
  timerEnabled: true,
  timerSeconds: 10,
  revealHoldMs: 1000,
  maxPlayers: 4,
  allowGuests: true,
  autoStart: false,
};

export const TIMER_SECONDS_OPTIONS: TimerSeconds[] = [5, 8, 10, 15];
export const REVEAL_HOLD_OPTIONS: RevealHoldMs[] = [500, 1000, 1500, 2000];

function asUnion<T extends number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function asStringUnion<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseRoomSettings(raw: unknown): RoomSettings {
  const src =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const themeIds = Array.isArray(src.themeIds)
    ? src.themeIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  return {
    v: 1,
    themeMix: asStringUnion(src.themeMix, ["random", "manual"] as const, "random"),
    themeIds,
    modeFilter: asStringUnion(
      src.modeFilter,
      ["all", "number_guess", "pick_correct", "find_lie", "order_it"] as const,
      "all",
    ),
    difficulty: asStringUnion(
      src.difficulty,
      ["mix", "leicht", "mittel", "schwer"] as const,
      "mix",
    ),
    blocks: asUnion(src.blocks, [1, 2, 3, 4] as const, 4),
    questionsPerBlock: asUnion(src.questionsPerBlock, [1, 2, 3, 4] as const, 2),
    timerEnabled: true,
    timerSeconds: asUnion(src.timerSeconds, TIMER_SECONDS_OPTIONS, 10),
    revealHoldMs: asUnion(src.revealHoldMs, REVEAL_HOLD_OPTIONS, 1000),
    maxPlayers: asUnion(src.maxPlayers, [2, 3, 4] as const, 4),
    allowGuests: src.allowGuests !== false,
    autoStart: src.autoStart === true,
  };
}

export function clampRoomSettings(
  settings: RoomSettings,
  occupiedSeats = 1,
): RoomSettings {
  const minSeats = Math.min(4, Math.max(2, occupiedSeats)) as MaxPlayers;
  const maxPlayers = (settings.maxPlayers < minSeats
    ? minSeats
    : settings.maxPlayers) as MaxPlayers;

  const themeMix = settings.themeMix;
  const themeIds =
    themeMix === "manual" ? Array.from(new Set(settings.themeIds)) : [];

  return {
    ...settings,
    v: 1,
    themeMix,
    themeIds,
    maxPlayers,
    timerEnabled: true,
  };
}

export function roundsForMode(
  mode: PlayableMode,
  questionsPerBlock: QuestionsPerBlock,
): number {
  return mode === "number_guess" ? questionsPerBlock : 1;
}

/** Snapshot written onto match_blocks.timer_seconds. Timer is always on. */
export function timerSecondsForBlock(settings: RoomSettings): number {
  return settings.timerSeconds;
}

/**
 * Duration for the Match-Timer bar. Always on — same bar for everyone via started_at.
 * `timer_seconds === 0` or missing on a legacy block falls back to the 10s default.
 */
export function questionTimerMsFromBlock(
  timerSeconds: number | null | undefined,
): number {
  if (typeof timerSeconds === "number" && timerSeconds > 0) {
    return timerSeconds * 1000;
  }
  return DEFAULT_ROOM_SETTINGS.timerSeconds * 1000;
}

export function startBlockedReason(settings: RoomSettings): string | null {
  if (settings.themeMix === "manual" && settings.themeIds.length === 0) {
    return "Wähl mindestens ein Thema — sonst würfeln wir ins Leere.";
  }
  return null;
}

export function settingsSummaryChips(
  settings: RoomSettings,
  themeNames: Record<string, string>,
): string[] {
  const chips: string[] = [];

  if (settings.themeMix === "random") {
    chips.push("Themen: Zufall");
  } else {
    const names = settings.themeIds
      .map((id) => themeNames[id])
      .filter(Boolean);
    chips.push(names.length ? names.join(", ") : "Themen: selbst");
  }

  chips.push(
    settings.modeFilter === "all"
      ? "Alle Modi"
      : settings.modeFilter === "number_guess"
        ? "Nur Schätzfragen"
        : settings.modeFilter === "pick_correct"
          ? "Nur Auswählen"
          : settings.modeFilter === "find_lie"
            ? "Nur Lüge"
            : "Nur Reihenfolge",
  );

  chips.push(
    settings.difficulty === "mix"
      ? "Mix"
      : settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1),
  );

  chips.push(`${settings.blocks} Blöcke`);
  chips.push(`${settings.timerSeconds}s Timer`);
  chips.push(`Max ${settings.maxPlayers}`);
  chips.push(settings.allowGuests ? "Gäste ja" : "Keine Gäste");
  if (settings.autoStart) chips.push("Start wenn voll");

  return chips;
}
