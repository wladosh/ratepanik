export const ACHIEVEMENT_IDS = [
  "first_game",
  "first_win",
  "first_room",
  "streak_3",
  "exact_hit",
  "exact_streak_3",
  "close_call",
  "wild_guess",
  "perfect_pick",
  "pick_streak_3",
  "almost",
  "panic_pick",
  "clutch",
  "rematch",
  "full_lobby",
  "night_owl",
  "games_10",
  "wins_5",
  "exact_10",
  "perfect_10",
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export type AchievementCopy = {
  de: string;
  en: string;
};

export type AchievementColors = {
  from: string;
  to: string;
  ink: string;
};

export type AchievementDefinition = {
  id: AchievementId;
  iconKey: string;
  title: AchievementCopy;
  description: AchievementCopy;
  colors: AchievementColors;
};

export const ACHIEVEMENT_CATALOG: readonly AchievementDefinition[] = [
  {
    id: "first_game",
    iconKey: "rp_badge_first_game",
    title: { de: "Erster Panik-Anfall", en: "First Panic Attack" },
    description: {
      de: "Du hast dein erstes Spiel überlebt.",
      en: "You survived your first game.",
    },
    colors: { from: "#FFB4A2", to: "#F56B52", ink: "#7A2E22" },
  },
  {
    id: "first_win",
    iconKey: "rp_badge_first_win",
    title: { de: "Erster Sieg", en: "First Win" },
    description: {
      de: "Jemand hat verloren. Du nicht.",
      en: "Someone lost. Not you.",
    },
    colors: { from: "#FFE28A", to: "#F3B928", ink: "#7A5410" },
  },
  {
    id: "first_room",
    iconKey: "rp_badge_first_room",
    title: { de: "Gastgeber", en: "Host" },
    description: {
      de: "Du hast einen Raum erstellt.",
      en: "You created a room.",
    },
    colors: { from: "#C9C0FF", to: "#8B7CFF", ink: "#3D2B6B" },
  },
  {
    id: "streak_3",
    iconKey: "rp_badge_streak_3",
    title: { de: "3-Tage-Streak", en: "3-Day Streak" },
    description: {
      de: "An 3 Tagen in Folge gespielt.",
      en: "Played on 3 days in a row.",
    },
    colors: { from: "#FFB087", to: "#FF6B3D", ink: "#7A2E14" },
  },
  {
    id: "exact_hit",
    iconKey: "rp_badge_exact_hit",
    title: { de: "Bullseye", en: "Bullseye" },
    description: {
      de: "Exakter Treffer bei einer Schätzfrage.",
      en: "Exact hit on a number guess.",
    },
    colors: { from: "#8EE4C8", to: "#3DCC8A", ink: "#1A5C40" },
  },
  {
    id: "exact_streak_3",
    iconKey: "rp_badge_exact_streak_3",
    title: { de: "Hellseher", en: "Clairvoyant" },
    description: {
      de: "3 exakte Schätz-Treffer in einer Session.",
      en: "3 exact guesses in one session.",
    },
    colors: { from: "#D8C8FF", to: "#9B6BFF", ink: "#3D2B6B" },
  },
  {
    id: "close_call",
    iconKey: "rp_badge_close_call",
    title: { de: "Knapp daneben ist auch… nah", en: "So Close" },
    description: {
      de: "Innerhalb von 5% der richtigen Zahl (ohne exakt).",
      en: "Within 5% of the right number — but not exact.",
    },
    colors: { from: "#FFE29A", to: "#FFB347", ink: "#7A4E12" },
  },
  {
    id: "wild_guess",
    iconKey: "rp_badge_wild_guess",
    title: { de: "Mutig", en: "Bold" },
    description: {
      de: "Deine Schätzung war um mehr als das 10-Fache daneben.",
      en: "Your guess was more than 10× off.",
    },
    colors: { from: "#FF9EC8", to: "#FF5C9A", ink: "#7A2048" },
  },
  {
    id: "perfect_pick",
    iconKey: "rp_badge_perfect_pick",
    title: { de: "Saubere Weste", en: "Clean Sheet" },
    description: {
      de: "Eine Pick-Correct-Runde mit 0 Fehlern.",
      en: "A pick-correct round with zero mistakes.",
    },
    colors: { from: "#E8F4FF", to: "#7EB6FF", ink: "#1E4A7A" },
  },
  {
    id: "pick_streak_3",
    iconKey: "rp_badge_pick_streak_3",
    title: { de: "Kartenscharf", en: "Sharp Cards" },
    description: {
      de: "3 perfekte Pick-Correct-Runden in einer Session.",
      en: "3 perfect pick-correct rounds in one session.",
    },
    colors: { from: "#FFD0E8", to: "#FF7AB6", ink: "#7A2450" },
  },
  {
    id: "almost",
    iconKey: "rp_badge_almost",
    title: { de: "Fast", en: "Almost" },
    description: {
      de: "Genau 3 von 4 richtigen bei Pick-Correct.",
      en: "Exactly 3 of 4 correct on pick-correct.",
    },
    colors: { from: "#FFF3C4", to: "#FFD66B", ink: "#7A5C10" },
  },
  {
    id: "panic_pick",
    iconKey: "rp_badge_panic_pick",
    title: { de: "Alles falsch", en: "All Wrong" },
    description: {
      de: "0 Richtige in einer Pick-Correct-Runde.",
      en: "Zero correct in a pick-correct round.",
    },
    colors: { from: "#FFB0C0", to: "#FF5C7A", ink: "#7A1E32" },
  },
  {
    id: "clutch",
    iconKey: "rp_badge_clutch",
    title: { de: "Clutch", en: "Clutch" },
    description: {
      de: "Von hinten auf Platz 1 in einer Runde.",
      en: "Came from behind to first place.",
    },
    colors: { from: "#FFE7A0", to: "#F5A623", ink: "#7A4E08" },
  },
  {
    id: "rematch",
    iconKey: "rp_badge_rematch",
    title: { de: "Nochmal!", en: "Again!" },
    description: {
      de: "Direkt nach einem Spiel ein Rematch gestartet.",
      en: "Started a rematch right after a game.",
    },
    colors: { from: "#C8F0E4", to: "#6FCFB2", ink: "#1A5C48" },
  },
  {
    id: "full_lobby",
    iconKey: "rp_badge_full_lobby",
    title: { de: "Volle Hütte", en: "Packed House" },
    description: {
      de: "Spiel mit maximaler Spieleranzahl gestartet.",
      en: "Started a game with a full lobby.",
    },
    colors: { from: "#E0D4FF", to: "#A78BFA", ink: "#3D2B6B" },
  },
  {
    id: "night_owl",
    iconKey: "rp_badge_night_owl",
    title: { de: "Nachtschicht", en: "Night Shift" },
    description: {
      de: "Spiel zwischen 00:00 und 05:00 beendet.",
      en: "Finished a game between midnight and 5am.",
    },
    colors: { from: "#B8C4FF", to: "#5B6BDB", ink: "#1E2460" },
  },
  {
    id: "games_10",
    iconKey: "rp_badge_games_10",
    title: { de: "Stammgast", en: "Regular" },
    description: {
      de: "10 Spiele beendet.",
      en: "Finished 10 games.",
    },
    colors: { from: "#FFD8C0", to: "#FF8A71", ink: "#7A2E1C" },
  },
  {
    id: "wins_5",
    iconKey: "rp_badge_wins_5",
    title: { de: "Gewohnheitstäter", en: "Repeat Offender" },
    description: {
      de: "5 Siege.",
      en: "Won 5 games.",
    },
    colors: { from: "#FFE9A8", to: "#E8B923", ink: "#6B4E0A" },
  },
  {
    id: "exact_10",
    iconKey: "rp_badge_exact_10",
    title: { de: "Zahlenflüsterer", en: "Number Whisperer" },
    description: {
      de: "10 exakte Schätz-Treffer insgesamt.",
      en: "10 exact number-guess hits in total.",
    },
    colors: { from: "#B8F0D8", to: "#2BB673", ink: "#145C38" },
  },
  {
    id: "perfect_10",
    iconKey: "rp_badge_perfect_10",
    title: { de: "Pick-Profi", en: "Pick Pro" },
    description: {
      de: "10 perfekte Pick-Correct-Runden insgesamt.",
      en: "10 perfect pick-correct rounds in total.",
    },
    colors: { from: "#E4D4FF", to: "#8B7CFF", ink: "#3D2B6B" },
  },
] as const;

export const ACHIEVEMENT_BY_ID: Record<AchievementId, AchievementDefinition> =
  Object.fromEntries(ACHIEVEMENT_CATALOG.map((item) => [item.id, item])) as Record<
    AchievementId,
    AchievementDefinition
  >;

export function isAchievementId(value: string): value is AchievementId {
  return Object.prototype.hasOwnProperty.call(ACHIEVEMENT_BY_ID, value);
}

export function achievementCopy(
  item: Pick<AchievementDefinition, "title" | "description">,
  locale: "de" | "en",
) {
  return {
    title: item.title[locale],
    description: item.description[locale],
  };
}
