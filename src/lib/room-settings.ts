import { interpolate, type Messages } from "./i18n";

export type PlayableMode =
  | "number_guess"
  | "pick_correct"
  | "find_lie"
  | "order_it";
export type ModeFilter = "all" | PlayableMode;
export type DifficultyFilter = "mix" | "leicht" | "mittel" | "schwer";
export type ThemeMix = "random" | "manual";
export type TimerSeconds = 20 | 30 | 45 | 60;
export type RevealHoldMs = 500 | 1000 | 1500 | 2000;
export type MaxPlayers = 2 | 3 | 4;
export type BlockCount = 1 | 2 | 3 | 4 | 5 | 6;
export type QuestionsPerBlock = 1 | 2 | 3 | 4;
export type GameLength = "short" | "medium" | "long";

export interface RoomSettings {
  v: 1;
  themeMix: ThemeMix;
  themeIds: string[];
  modeFilter: ModeFilter;
  difficulty: DifficultyFilter;
  gameLength: GameLength;
  blocks: BlockCount;
  questionsPerBlock: QuestionsPerBlock;
  timerEnabled: boolean;
  timerSeconds: TimerSeconds;
  revealHoldMs: RevealHoldMs;
  maxPlayers: MaxPlayers;
  allowGuests: boolean;
  autoStart: boolean;
}

export const GAME_LENGTH_PRESETS: Record<
  GameLength,
  { blocks: BlockCount; questionsPerBlock: QuestionsPerBlock; minutes: 5 | 10 | 15 }
> = {
  short: { blocks: 3, questionsPerBlock: 2, minutes: 5 },
  medium: { blocks: 4, questionsPerBlock: 3, minutes: 10 },
  long: { blocks: 6, questionsPerBlock: 3, minutes: 15 },
};

export const GAME_LENGTH_OPTIONS: GameLength[] = ["short", "medium", "long"];

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  v: 1,
  themeMix: "random",
  themeIds: [],
  modeFilter: "all",
  difficulty: "mix",
  gameLength: "medium",
  blocks: GAME_LENGTH_PRESETS.medium.blocks,
  questionsPerBlock: GAME_LENGTH_PRESETS.medium.questionsPerBlock,
  timerEnabled: true,
  timerSeconds: 30,
  revealHoldMs: 2000,
  maxPlayers: 4,
  allowGuests: true,
  autoStart: false,
};

export const TIMER_SECONDS_OPTIONS: TimerSeconds[] = [20, 30, 45, 60];
export const REVEAL_HOLD_OPTIONS: RevealHoldMs[] = [500, 1000, 1500, 2000];

function asUnion<T extends number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function asStringUnion<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function inferGameLength(blocks: number, questionsPerBlock: number): GameLength {
  if (blocks >= 6 || blocks * questionsPerBlock >= 16) return "long";
  if (blocks <= 3 && questionsPerBlock <= 2) return "short";
  return "medium";
}

export function applyGameLength(
  length: GameLength,
): Pick<RoomSettings, "gameLength" | "blocks" | "questionsPerBlock"> {
  const preset = GAME_LENGTH_PRESETS[length];
  return {
    gameLength: length,
    blocks: preset.blocks,
    questionsPerBlock: preset.questionsPerBlock,
  };
}

/** Old 5/8/10/15 values were too frantic — map them onto the calmer scale. */
export function parseTimerSeconds(value: unknown): TimerSeconds {
  if (TIMER_SECONDS_OPTIONS.includes(value as TimerSeconds)) {
    return value as TimerSeconds;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 12) return 20;
    if (value <= 22) return 30;
    if (value <= 40) return 45;
    return 60;
  }
  return DEFAULT_ROOM_SETTINGS.timerSeconds;
}

export function parseRoomSettings(raw: unknown): RoomSettings {
  const src =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const themeIds = Array.isArray(src.themeIds)
    ? src.themeIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  const parsedBlocks = asUnion(src.blocks, [1, 2, 3, 4, 5, 6] as const, 4);
  const parsedQuestions = asUnion(src.questionsPerBlock, [1, 2, 3, 4] as const, 3);
  const gameLength = asStringUnion(
    src.gameLength,
    GAME_LENGTH_OPTIONS,
    inferGameLength(parsedBlocks, parsedQuestions),
  );
  const length = applyGameLength(gameLength);

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
    gameLength: length.gameLength,
    blocks: length.blocks,
    questionsPerBlock: length.questionsPerBlock,
    timerEnabled: true,
    timerSeconds: parseTimerSeconds(src.timerSeconds),
    revealHoldMs: asUnion(src.revealHoldMs, REVEAL_HOLD_OPTIONS, 2000),
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
  const length = applyGameLength(settings.gameLength);

  return {
    ...settings,
    v: 1,
    themeMix,
    themeIds,
    maxPlayers,
    timerEnabled: true,
    ...length,
  };
}

export function roundsForMode(
  mode: PlayableMode,
  questionsPerBlock: QuestionsPerBlock,
): number {
  void mode;
  return questionsPerBlock;
}

/** Snapshot written onto match_blocks.timer_seconds. Timer is always on. */
export function timerSecondsForBlock(settings: RoomSettings): number {
  return settings.timerSeconds;
}

/**
 * Duration for the Match-Timer bar. Always on — same bar for everyone via started_at.
 * `timer_seconds === 0` or missing on a legacy block falls back to the current default.
 */
export function questionTimerMsFromBlock(
  timerSeconds: number | null | undefined,
): number {
  if (typeof timerSeconds === "number" && timerSeconds > 0) {
    return timerSeconds * 1000;
  }
  return DEFAULT_ROOM_SETTINGS.timerSeconds * 1000;
}

export function startBlockedReason(settings: RoomSettings): "no_themes" | null {
  if (settings.themeMix === "manual" && settings.themeIds.length === 0) {
    return "no_themes";
  }
  return null;
}

export function settingsSummaryChips(
  settings: RoomSettings,
  themeNames: Record<string, string>,
  t: Messages,
): string[] {
  const chips: string[] = [];

  if (settings.themeMix === "random") {
    chips.push(t.lobby.chipThemesRandom);
  } else {
    const names = settings.themeIds
      .map((id) => themeNames[id])
      .filter(Boolean);
    chips.push(names.length ? names.join(", ") : t.lobby.chipThemesManual);
  }

  chips.push(
    settings.modeFilter === "all"
      ? t.lobby.chipAllModes
      : settings.modeFilter === "number_guess"
        ? t.lobby.chipModeGuess
        : settings.modeFilter === "pick_correct"
          ? t.lobby.chipModePick
          : settings.modeFilter === "find_lie"
            ? t.lobby.chipModeLie
            : t.lobby.chipModeOrder,
  );

  chips.push(
    settings.difficulty === "mix"
      ? t.lobby.diffMix
      : settings.difficulty === "leicht"
        ? t.lobby.diffEasy
        : settings.difficulty === "mittel"
          ? t.lobby.diffMid
          : t.lobby.diffHard,
  );

  chips.push(
    settings.gameLength === "short"
      ? t.lobby.chipLengthShort
      : settings.gameLength === "long"
        ? t.lobby.chipLengthLong
        : t.lobby.chipLengthMedium,
  );
  chips.push(interpolate(t.lobby.chipTimer, { n: settings.timerSeconds }));
  chips.push(interpolate(t.lobby.chipMax, { n: settings.maxPlayers }));
  chips.push(settings.allowGuests ? t.lobby.chipGuestsYes : t.lobby.chipGuestsNo);
  if (settings.autoStart) chips.push(t.lobby.chipAutoStart);

  return chips;
}
