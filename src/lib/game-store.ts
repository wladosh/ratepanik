/** Default question countdown when a block has no timer snapshot (legacy). */
export const QUESTION_TIMER_MS = 8_000;

/** order_it needs longer — 4-item reorder is not playable in 5s. */
export const ORDER_IT_TIMER_MS = 20_000;

export const FIND_LIE_CORRECT_POINTS = 400;
export const ORDER_IT_POINTS_PER_SLOT = 100;

export type PlayableMode =
  | "number_guess"
  | "pick_correct"
  | "find_lie"
  | "order_it";
export type ModeFilter = "all" | PlayableMode;

export function questionTimerMsForMode(mode: string | undefined | null): number {
  return mode === "order_it" ? ORDER_IT_TIMER_MS : QUESTION_TIMER_MS;
}

export function modeLabelDe(mode: string | undefined | null): string {
  switch (mode) {
    case "number_guess":
      return "Zahlenraten";
    case "pick_correct":
      return "Passendes wählen";
    case "find_lie":
      return "Die Lüge";
    case "order_it":
      return "Reihenfolge";
    default:
      return mode ?? "";
  }
}

export function modeEmoji(mode: string | undefined | null): string {
  switch (mode) {
    case "number_guess":
      return "\u{1F522}";
    case "pick_correct":
      return "\u{1F0CF}";
    case "find_lie":
      return "\u{1F925}";
    case "order_it":
      return "\u{2195}\u{FE0F}";
    default:
      return "";
  }
}

/** First-place number_guess points. Each worse unique distance gets half, last group 0. */
export const NUMBER_GUESS_FIRST_POINTS = 400;

export function numberGuessCorrectFromPayload(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (key.toLowerCase() === "answer" && typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

/** Closeness group 0 is closest. Last group scores 0 unless everyone tied. */
export function numberGuessPointsForGroup(
  groupIndex: number,
  groupCount: number,
): number {
  if (groupCount <= 0 || groupIndex < 0 || groupIndex >= groupCount) return 0;
  if (groupCount === 1) return NUMBER_GUESS_FIRST_POINTS;
  if (groupIndex >= groupCount - 1) return 0;
  return Math.round(NUMBER_GUESS_FIRST_POINTS / 2 ** groupIndex);
}

/** Rank-based scoring for number_guess — 1st gets 400, next half, last 0. */
export function calculateNumberGuessPoints(
  rank: number,
  totalPlayers: number
): number {
  if (rank < 1 || rank > totalPlayers) return 0;
  return numberGuessPointsForGroup(rank - 1, totalPlayers);
}

/** Timeout and full-lobby scoring share this field so ranks stay comparable. */
export function numberGuessScoringPool(
  playerCount: number,
  answerCount: number,
): number {
  return Math.max(playerCount, answerCount);
}

export function scoreNumberGuessAnswers<
  T extends { id: string; numericAnswer: number | null },
>(
  answers: T[],
  correct: number,
  playerCount: number,
): (T & { distance: number; rank: number; points: number })[] {
  const sorted = answers
    .map((a) => ({
      ...a,
      distance: Math.abs((a.numericAnswer ?? 0) - correct),
      missing: a.numericAnswer == null,
    }))
    .sort((a, b) => {
      if (a.missing !== b.missing) return a.missing ? 1 : -1;
      return a.distance - b.distance;
    });

  const groupOf: number[] = [];
  let groupIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (prev.missing !== cur.missing || (!cur.missing && prev.distance !== cur.distance)) {
        groupIndex += 1;
      }
    }
    groupOf.push(groupIndex);
  }

  const answeredIds = new Set(
    answers.filter((a) => a.numericAnswer != null).map((a) => a.id),
  );
  const missingPlayers = Math.max(0, playerCount - answeredIds.size);
  const uniqueAnsweredGroups = new Set(
    sorted.map((row, i) => (row.missing ? -1 : groupOf[i])).filter((g) => g >= 0),
  ).size;
  const groupCount =
    uniqueAnsweredGroups + (missingPlayers > 0 || sorted.some((a) => a.missing) ? 1 : 0);

  const firstRankOfGroup: number[] = [];
  let nextRank = 1;
  let prevGroup = -1;
  const ranks: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const g = groupOf[i];
    if (g !== prevGroup) {
      firstRankOfGroup[g] = nextRank;
      prevGroup = g;
    }
    ranks.push(firstRankOfGroup[g]);
    nextRank += 1;
  }

  return sorted.map((row, i) => {
    const g = groupOf[i];
    const points = row.missing
      ? 0
      : numberGuessPointsForGroup(g, Math.max(groupCount, 1));
    return {
      ...row,
      rank: ranks[i],
      points,
    };
  });
}

/** Contribution-based scoring for pick_correct (§9.2) */
export function calculatePickCorrectPoints(
  correctFound: number,
  totalCorrect: number = 4
): number {
  if (totalCorrect <= 0) return 0;
  return Math.round((correctFound / totalCorrect) * 1000);
}

/** Binary scoring for find_lie — 400 if the lie was tapped. */
export function calculateFindLiePoints(choice: number, lieIndex: number): number {
  return choice === lieIndex ? FIND_LIE_CORRECT_POINTS : 0;
}

/** 100 points per item sitting in the correct rank slot (max 400 for 4 items). */
export function calculateOrderItPoints(
  playerOrder: number[],
  correctOrder: number[]
): number {
  const n = Math.min(playerOrder.length, correctOrder.length);
  let pts = 0;
  for (let i = 0; i < n; i++) {
    if (playerOrder[i] === correctOrder[i]) pts += ORDER_IT_POINTS_PER_SLOT;
  }
  return pts;
}

const ALL_PLAYABLE: PlayableMode[] = [
  "number_guess",
  "pick_correct",
  "find_lie",
  "order_it",
];

/** Mix of playable modes, or a single-mode filter. Count clamped 1–4. */
export function generateBlockModes(
  count: number = 4,
  filter: ModeFilter = "all",
): PlayableMode[] {
  const n = Math.min(4, Math.max(1, Math.round(count)));
  if (filter !== "all") {
    return Array.from({ length: n }, () => filter);
  }

  const pool = [...ALL_PLAYABLE];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
