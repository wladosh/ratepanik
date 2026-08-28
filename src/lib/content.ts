import { supabase } from "./supabase";
import {
  roundsForMode,
  timerSecondsForBlock,
  type DifficultyFilter,
  type RoomSettings,
} from "./room-settings";
import {
  modesForFilter,
  timerSecondsForPlayMode,
  type PlayableMode,
} from "./game-store";

export interface Theme {
  id: string;
  slug: string;
  name_de: string;
}

export interface NumberGuessPayload {
  answer: number;
  unit?: string;
  plausibility_note?: string;
}

export interface PickCorrectPayload {
  cards: string[];
  correct_indices: number[];
}

export interface FindLiePayload {
  statements: string[];
  lie_index: number;
}

export interface OrderItPayload {
  items: string[];
  correct_order: number[];
  order_axis?: string;
}

const PROMPT_COLUMNS = "id, theme_id, mode, difficulty, prompt, payload";

export interface Prompt {
  id: string;
  theme_id: string;
  mode: "number_guess" | "pick_correct" | "find_lie" | "order_it";
  difficulty: "leicht" | "mittel" | "schwer";
  prompt: string;
  payload:
    | NumberGuessPayload
    | PickCorrectPayload
    | FindLiePayload
    | OrderItPayload
    | Record<string, unknown>;
}

export async function fetchActiveThemes(): Promise<Theme[]> {
  const { data, error } = await supabase
    .from("themes")
    .select("id, slug, name_de")
    .eq("active", true)
    .order("name_de");

  if (error) {
    console.error("Error fetching themes:", error);
    return [];
  }
  return data ?? [];
}

export async function fetchPromptsByThemeAndMode(
  themeId: string,
  mode: string
): Promise<Prompt[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select(PROMPT_COLUMNS)
    .eq("theme_id", themeId)
    .eq("mode", mode)
    .eq("active", true)
    .order("difficulty");

  if (error) {
    console.error("Error fetching prompts:", error);
    return [];
  }
  return (data ?? []) as Prompt[];
}

export async function fetchRandomThemeOptions(
  count: number = 2,
  allowedIds?: string[],
): Promise<Theme[]> {
  const themes = await fetchActiveThemes();
  const pool =
    allowedIds && allowedIds.length > 0
      ? themes.filter((t) => allowedIds.includes(t.id))
      : themes;
  if (pool.length <= count) return pool;

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Themes that have at least one active prompt in the allowed modes. */
export async function fetchRandomThemeOptionsForModes(
  modes: readonly PlayableMode[],
  count: number = 2,
  allowedIds?: string[],
): Promise<Theme[]> {
  let promptQuery = supabase.from("prompts").select("theme_id").eq("active", true);
  if (modes.length === 1) {
    promptQuery = promptQuery.eq("mode", modes[0]);
  } else if (modes.length > 1) {
    promptQuery = promptQuery.in("mode", [...modes]);
  }

  const { data: promptRows, error } = await promptQuery;

  if (error || !promptRows?.length) {
    return fetchRandomThemeOptions(count, allowedIds);
  }

  const themeIds = [...new Set(promptRows.map((r) => r.theme_id as string))];
  const { data: themes } = await supabase
    .from("themes")
    .select("id, slug, name_de")
    .in("id", themeIds);

  let pool = (themes ?? []) as Theme[];
  if (allowedIds && allowedIds.length > 0) {
    pool = pool.filter((t) => allowedIds.includes(t.id));
  }
  if (pool.length <= count) return pool;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function fetchPromptsForBlock(
  themeId: string,
  modes: readonly PlayableMode[],
  count: number = 2,
  difficulty: DifficultyFilter = "mix",
  allowedIds?: string[],
): Promise<Prompt[]> {
  const primary = await queryPromptsForModes({ themeId, modes, difficulty });
  const picked = pickPromptsAcrossModes(primary, count);
  if (picked.length >= count) return picked;

  const taken = new Set(picked.map((prompt) => prompt.id));
  const extras = (await queryPromptsForModes({ modes, difficulty, themeIds: allowedIds })).filter(
    (prompt) => prompt.theme_id !== themeId && !taken.has(prompt.id),
  );

  return [...picked, ...pickPromptsAcrossModes(extras, count - picked.length)];
}

export function pickPromptsForBlock<T extends { id: string }>(
  primary: T[],
  extras: T[],
  count: number,
): T[] {
  const seen = new Set<string>();
  const selected: T[] = [];
  for (const pool of [primary, extras]) {
    for (const prompt of pool) {
      if (seen.has(prompt.id)) continue;
      seen.add(prompt.id);
      selected.push(prompt);
      if (selected.length >= count) return selected;
    }
  }
  return selected;
}

/**
 * Pick `count` prompts with a random play type each round.
 * Each slot samples uniformly among modes that still have unused prompts, so a
 * category block is not locked to Schätzen / Lüge / Passend for every question.
 */
export function pickPromptsAcrossModes<T extends { id: string; mode: string }>(
  prompts: T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  const remaining = [...prompts];
  const selected: T[] = [];

  while (selected.length < count && remaining.length > 0) {
    const modes = [...new Set(remaining.map((prompt) => prompt.mode))];
    const mode = modes[Math.floor(random() * modes.length)];
    if (!mode) break;
    const pool = remaining.filter((prompt) => prompt.mode === mode);
    const pick = pool[Math.floor(random() * pool.length)];
    if (!pick) break;
    selected.push(pick);
    const index = remaining.findIndex((prompt) => prompt.id === pick.id);
    if (index >= 0) remaining.splice(index, 1);
  }

  return selected;
}

async function queryPromptsForModes(opts: {
  modes: readonly PlayableMode[];
  difficulty: DifficultyFilter;
  themeId?: string;
  themeIds?: string[];
}): Promise<Prompt[]> {
  if (opts.modes.length === 0) return [];

  let query = supabase.from("prompts").select(PROMPT_COLUMNS).eq("active", true);

  if (opts.modes.length === 1) {
    query = query.eq("mode", opts.modes[0]);
  } else {
    query = query.in("mode", [...opts.modes]);
  }

  if (opts.themeId) {
    query = query.eq("theme_id", opts.themeId);
  } else if (opts.themeIds && opts.themeIds.length > 0) {
    query = query.in("theme_id", opts.themeIds);
  }

  if (opts.difficulty !== "mix") {
    query = query.eq("difficulty", opts.difficulty);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching block prompts:", error);
    return [];
  }
  return (data ?? []) as Prompt[];
}

export async function countPromptsForFilter(opts: {
  mode: PlayableMode;
  themeIds?: string[];
  difficulty: DifficultyFilter;
}): Promise<number> {
  let query = supabase
    .from("prompts")
    .select("id", { count: "exact", head: true })
    .eq("mode", opts.mode)
    .eq("active", true);

  if (opts.themeIds && opts.themeIds.length > 0) {
    query = query.in("theme_id", opts.themeIds);
  }
  if (opts.difficulty !== "mix") {
    query = query.eq("difficulty", opts.difficulty);
  }

  const { count, error } = await query;
  if (error) {
    console.error("Error counting prompts:", error);
    return 0;
  }
  return count ?? 0;
}

export async function emptyPromptPoolReason(
  settings: RoomSettings,
): Promise<"empty_pool" | null> {
  const modes = modesForFilter(settings.modeFilter);
  const themeIds =
    settings.themeMix === "manual" ? settings.themeIds : undefined;

  if (settings.modeFilter !== "all") {
    const n = await countPromptsForFilter({
      mode: modes[0],
      themeIds,
      difficulty: settings.difficulty,
    });
    return n === 0 ? "empty_pool" : null;
  }

  for (const mode of modes) {
    const n = await countPromptsForFilter({
      mode,
      themeIds,
      difficulty: settings.difficulty,
    });
    if (n > 0) return null;
  }
  return "empty_pool";
}

export function allowedThemeIds(settings: RoomSettings): string[] | undefined {
  if (settings.themeMix === "manual" && settings.themeIds.length > 0) {
    return settings.themeIds;
  }
  return undefined;
}

export function blockFieldsForPrompts(fetched: Prompt[], settings: RoomSettings) {
  const first = fetched[0];
  const lobbySeconds = timerSecondsForBlock(settings);
  if (!first) {
    return {
      prompt_ids: [] as string[],
      rounds_total: 1,
      mode: modesForFilter(settings.modeFilter)[0] ?? "number_guess",
      timer_seconds: lobbySeconds,
    };
  }
  return {
    prompt_ids: fetched.map((p) => p.id),
    rounds_total: Math.max(1, fetched.length),
    mode: first.mode,
    timer_seconds: timerSecondsForPlayMode(first.mode, lobbySeconds),
  };
}

/** Assign theme options (or auto-pick when the pool has one theme). */
export async function prepareBlockTheme(
  blockId: string,
  settings: RoomSettings,
): Promise<"vote" | "auto" | "empty"> {
  const modes = modesForFilter(settings.modeFilter);
  const allowed = allowedThemeIds(settings);
  const themes = await fetchRandomThemeOptionsForModes(modes, 2, allowed);
  if (themes.length === 0) return "empty";

  if (themes.length === 1) {
    const count = roundsForMode(modes[0], settings.questionsPerBlock);
    const fetched = await fetchPromptsForBlock(
      themes[0].id,
      modes,
      count,
      settings.difficulty,
      allowed,
    );
    if (fetched.length === 0) return "empty";
    const { error } = await supabase
      .from("match_blocks")
      .update({
        theme_options: [themes[0].id],
        theme_id: themes[0].id,
        ...blockFieldsForPrompts(fetched, settings),
      })
      .eq("id", blockId);
    if (error) {
      console.error("prepareBlockTheme auto:", error);
      return "empty";
    }
    return "auto";
  }

  const { error } = await supabase
    .from("match_blocks")
    .update({ theme_options: themes.map((t) => t.id) })
    .eq("id", blockId);
  if (error) {
    console.error("prepareBlockTheme vote:", error);
    return "empty";
  }
  return "vote";
}


