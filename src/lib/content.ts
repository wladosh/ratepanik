import { supabase } from "./supabase";
import { roundsForMode, type DifficultyFilter, type RoomSettings } from "./room-settings";
import type { PlayableMode } from "./game-store";

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

export interface Prompt {
  id: string;
  theme_id: string;
  mode: "number_guess" | "pick_correct" | "find_lie" | "order_it";
  difficulty: "leicht" | "mittel" | "schwer";
  prompt: string;
  hint: string | null;
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
    .select("id, theme_id, mode, difficulty, prompt, hint, payload")
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

/** Themes that have at least one active prompt for this mode. */
export async function fetchRandomThemeOptionsForMode(
  mode: string,
  count: number = 2,
  allowedIds?: string[],
): Promise<Theme[]> {
  const { data: promptRows, error } = await supabase
    .from("prompts")
    .select("theme_id")
    .eq("mode", mode)
    .eq("active", true);

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
  mode: string,
  count: number = 2,
  difficulty: DifficultyFilter = "mix",
): Promise<Prompt[]> {
  let query = supabase
    .from("prompts")
    .select("id, theme_id, mode, difficulty, prompt, hint, payload")
    .eq("theme_id", themeId)
    .eq("mode", mode)
    .eq("active", true);

  if (difficulty !== "mix") {
    query = query.eq("difficulty", difficulty);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching block prompts:", error);
    return [];
  }

  const prompts = (data ?? []) as Prompt[];
  const shuffled = [...prompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
  modes: PlayableMode[],
): Promise<string | null> {
  const uniqueModes = Array.from(new Set(modes));
  const themeIds =
    settings.themeMix === "manual" ? settings.themeIds : undefined;

  for (const mode of uniqueModes) {
    const n = await countPromptsForFilter({
      mode,
      themeIds,
      difficulty: settings.difficulty,
    });
    if (n === 0) {
      return "Mit dem Filter bleibt der Fragenkasten leer. Mach locker oder Fragemeister füttern.";
    }
  }
  return null;
}

export function allowedThemeIds(settings: RoomSettings): string[] | undefined {
  if (settings.themeMix === "manual" && settings.themeIds.length > 0) {
    return settings.themeIds;
  }
  return undefined;
}

/** Assign theme options (or auto-pick when the pool has one theme). */
export async function prepareBlockTheme(
  blockId: string,
  mode: PlayableMode,
  settings: RoomSettings,
): Promise<"vote" | "auto" | "empty"> {
  const allowed = allowedThemeIds(settings);
  const themes = await fetchRandomThemeOptionsForMode(mode, 2, allowed);
  if (themes.length === 0) return "empty";

  if (themes.length === 1) {
    const count = roundsForMode(mode, settings.questionsPerBlock);
    const fetched = await fetchPromptsForBlock(
      themes[0].id,
      mode,
      count,
      settings.difficulty,
    );
    if (fetched.length === 0) return "empty";
    const { error } = await supabase
      .from("match_blocks")
      .update({
        theme_options: [themes[0].id],
        theme_id: themes[0].id,
        prompt_ids: fetched.map((p) => p.id),
        started_at: new Date().toISOString(),
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


