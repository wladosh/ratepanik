import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/use-profile";

const PROFILE_COLUMNS_CORE =
  "id, username, xp, level, hirncoins, avatar_id, avatar_onboarding_done, created_at, updated_at";

const PROFILE_COLUMN_ATTEMPTS = [
  `${PROFILE_COLUMNS_CORE}, current_streak, friend_code, last_seen_at`,
  `${PROFILE_COLUMNS_CORE}, current_streak`,
  PROFILE_COLUMNS_CORE,
] as const;

/**
 * Calendar-day play streak (`profiles.current_streak`), same counter as
 * `streak_3`. `null` means the value is not stored or could not be loaded —
 * UI must show "Bald", never a fake 0.
 */
export function dailyPlayStreakDays(
  profile: Profile | null | undefined,
): number | null {
  if (profile == null || typeof profile.current_streak !== "number") {
    return null;
  }
  return profile.current_streak;
}

export function dailyPlayStreakCopy(days: number | null): string {
  if (days === null) return "Kalendertage in Folge — noch nicht gespeichert.";
  if (days <= 0) return "Nach einem Match zählt der erste Tag.";
  if (days < 3) return "Spiele an 3 Tagen in Folge für den Streak-Erfolg.";
  return "Kalendertage in Folge gespielt.";
}

export function parseDailyPlayRpc(data: unknown): {
  ok: boolean;
  streak: number | null;
} {
  let raw: unknown = data;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return { ok: false, streak: null };
    }
  }
  if (!raw || typeof raw !== "object") {
    return { ok: false, streak: null };
  }
  const rec = raw as Record<string, unknown>;
  const streak = typeof rec.streak === "number" ? rec.streak : null;
  return { ok: rec.ok === true, streak };
}

export async function loadProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  for (const columns of PROFILE_COLUMN_ATTEMPTS) {
    const { data, error } = await supabase
      .from("profiles")
      .select(columns)
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) return data as unknown as Profile;
  }
  return null;
}
