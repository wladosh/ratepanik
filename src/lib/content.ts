import { supabase } from "./supabase";

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
    .order("difficulty");

  if (error) {
    console.error("Error fetching prompts:", error);
    return [];
  }
  return (data ?? []) as Prompt[];
}

export async function fetchRandomThemeOptions(count: number = 2): Promise<Theme[]> {
  const themes = await fetchActiveThemes();
  if (themes.length <= count) return themes;

  const shuffled = [...themes].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Themes that have at least one active prompt for this mode. */
export async function fetchRandomThemeOptionsForMode(
  mode: string,
  count: number = 2
): Promise<Theme[]> {
  const { data: promptRows, error } = await supabase
    .from("prompts")
    .select("theme_id")
    .eq("mode", mode)
    .eq("active", true);

  if (error || !promptRows?.length) {
    return fetchRandomThemeOptions(count);
  }

  const themeIds = [...new Set(promptRows.map((r) => r.theme_id as string))];
  const { data: themes } = await supabase
    .from("themes")
    .select("id, slug, name_de")
    .in("id", themeIds);

  const pool = (themes ?? []) as Theme[];
  if (pool.length <= count) return pool;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function fetchPromptsForBlock(
  themeId: string,
  mode: string,
  count: number = 2
): Promise<Prompt[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select("id, theme_id, mode, difficulty, prompt, hint, payload")
    .eq("theme_id", themeId)
    .eq("mode", mode)
    .eq("active", true);

  if (error) {
    console.error("Error fetching block prompts:", error);
    return [];
  }

  const prompts = (data ?? []) as Prompt[];
  const shuffled = [...prompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
