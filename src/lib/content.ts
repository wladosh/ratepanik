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

export interface Prompt {
  id: string;
  theme_id: string;
  mode: "number_guess" | "pick_correct" | "find_lie" | "order_it";
  difficulty: "leicht" | "mittel" | "schwer";
  prompt: string;
  hint: string | null;
  payload: NumberGuessPayload | PickCorrectPayload | Record<string, unknown>;
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

export async function fetchPromptsForBlock(
  themeId: string,
  mode: string,
  count: number = 2
): Promise<Prompt[]> {
  const { data, error } = await supabase
    .from("prompts")
    .select("id, theme_id, mode, difficulty, prompt, hint, payload")
    .eq("theme_id", themeId)
    .eq("mode", mode);

  if (error) {
    console.error("Error fetching block prompts:", error);
    return [];
  }

  const prompts = (data ?? []) as Prompt[];
  const shuffled = [...prompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
