import { interpolate, type Messages } from "./i18n";

export function joinBlockedCopy(
  opts: {
    allowGuests: boolean;
    joiningAsGuest: boolean;
    playerCount: number;
    maxPlayers: number;
  },
  t: Messages,
): string | null {
  if (!opts.allowGuests && opts.joiningAsGuest) return t.game.guestsBlocked;
  if (opts.playerCount >= opts.maxPlayers) {
    return interpolate(t.game.roomFull, { n: opts.maxPlayers });
  }
  return null;
}

export type LeadKind = "you" | "them" | "tie" | "open";

/** Scores must already be sorted high → low. */
export function scoreboardLeadKind(sortedScores: number[], leaderIsMe: boolean): LeadKind {
  if (sortedScores.length === 0) return "open";
  const top = sortedScores[0] ?? 0;
  const second = sortedScores[1];
  const tied = second !== undefined && second === top;
  if (tied) return top === 0 ? "open" : "tie";
  return leaderIsMe ? "you" : "them";
}

export const SCOREBOARD_LEAD_COPY = {
  de: {
    you: "Du führst!",
    them: "Aktuell vorn",
    tie: "Gleichstand",
    open: "Noch alles offen",
  },
  en: {
    you: "You're ahead!",
    them: "Currently ahead",
    tie: "It's a tie",
    open: "Still wide open",
  },
} as const;

/** Competition ranks (1,1,3) from scores already sorted high → low. */
export function competitionRanks(sortedScores: number[]): number[] {
  const ranks: number[] = [];
  for (let i = 0; i < sortedScores.length; i++) {
    if (i === 0 || sortedScores[i] !== sortedScores[i - 1]) {
      ranks.push(i + 1);
    } else {
      ranks.push(ranks[i - 1] ?? 1);
    }
  }
  return ranks;
}

export function allScoresTied(scores: number[]): boolean {
  return scores.length > 1 && scores.every((score) => score === scores[0]);
}

/** Numeric place label. Rank 1–3 art lives in `PlaceBadge`. */
export function placeGlyph(rank: number): string {
  return String(rank);
}

export type FriendErrorKind =
  | "not_found"
  | "self"
  | "unavailable"
  | "empty"
  | "generic";

export function classifyFriendError(raw: string | undefined | null): FriendErrorKind {
  const text = (raw ?? "").toLowerCase();
  if (!text.trim()) return "generic";
  if (
    text.includes("schema cache") ||
    text.includes("could not find the function") ||
    text.includes("pgrst202") ||
    text.includes("pgrst")
  ) {
    return "unavailable";
  }
  if (text.includes("nicht gefunden") || text.includes("not found")) return "not_found";
  if (text.includes("selbst") || text.includes("yourself") || text.includes("self")) {
    return "self";
  }
  if (text.includes("fehlt") || text.includes("empty") || text.includes("blank")) {
    return "empty";
  }
  return "generic";
}

export const FRIEND_ERROR_COPY = {
  de: {
    not_found: "Spieler nicht gefunden.",
    self: "Das bist du selbst.",
    unavailable: "Freunde sind gerade nicht erreichbar. Versuch's gleich nochmal.",
    empty: "Name oder Code eingeben.",
    generic: "Anfrage hat nicht geklappt.",
  },
  en: {
    not_found: "Player not found.",
    self: "That's you.",
    unavailable: "Friends isn't available right now. Try again in a moment.",
    empty: "Enter a name or code.",
    generic: "That request didn’t work.",
  },
} as const;

export function friendErrorCopy(
  raw: string | undefined | null,
  locale: "de" | "en",
): string {
  const kind = classifyFriendError(raw);
  if (kind === "generic") {
    const text = (raw ?? "").trim();
    if (text && !/could not find|schema cache|pgrst|postgres/i.test(text)) {
      return text;
    }
  }
  return FRIEND_ERROR_COPY[locale][kind];
}

export function parseFriendCodePayload(data: unknown): string | null {
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed.length >= 4 ? trimmed : null;
  }
  if (!data || typeof data !== "object") return null;
  const code = (data as { friend_code?: unknown }).friend_code;
  if (typeof code === "string" && code.trim().length >= 4) return code.trim();
  return null;
}

export function usernameCheckMessage(
  t: Messages,
  code: string | null | undefined,
): string {
  switch (code) {
    case "too_short":
      return t.signup.nameTooShort;
    case "too_long":
      return t.signup.nameTooLong;
    case "taken":
      return t.signup.nameTaken;
    case "missing":
      return t.signup.nameMissing;
    default:
      return t.signup.checkFailed;
  }
}

export type UsernameCheckCode =
  | "missing"
  | "too_short"
  | "too_long"
  | "taken"
  | "check_failed";

export function usernameCheckCodeFromRpc(error: string | null | undefined): UsernameCheckCode | null {
  if (!error) return null;
  const text = error.toLowerCase();
  if (text.includes("zu kurz") || text.includes("too short")) return "too_short";
  if (text.includes("zu lang") || text.includes("too long")) return "too_long";
  if (text.includes("vergeben") || text.includes("taken") || text.includes("already")) {
    return "taken";
  }
  if (text.includes("kein name") || text.includes("missing")) return "missing";
  return "check_failed";
}
