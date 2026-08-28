const MATCH_SESSION_KEY = "ratepanik-session";

export function isJoinCode(value: string | null | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9]{6}$/.test(value));
}

/** Guests never land on the signed-in home dashboard. */
export function guestMaySeeAppHome(isGuest: boolean): boolean {
  return !isGuest;
}

export function resolveGuestExitPath(next?: string): string {
  if (next === "/auth/signup" || next === "/auth/login") return next;
  return "/auth/login";
}

/**
 * A join link wins over a leftover match session ONLY when it targets a
 * different room. If the stored session already belongs to the same room code,
 * we keep it so the guest can resume without losing their player row.
 */
export function shouldSkipSessionRestore(joinCode: string | undefined): boolean {
  if (!isJoinCode(joinCode)) return false;
  const stored = readMatchSession();
  if (stored && stored.roomCode === joinCode.toUpperCase()) return false;
  return true;
}

/**
 * Guests with an active session can also restore on bare `/` —
 * otherwise tab-switching drops them into the destructive GuestExitToLogin.
 */
export function shouldRestoreMatchOnBareHome(): boolean {
  return true;
}

export function readMatchSession(): { roomId: string; playerId: string; roomCode: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(sessionStorage.getItem(MATCH_SESSION_KEY) || "{}") as {
      roomId?: unknown;
      playerId?: unknown;
      roomCode?: unknown;
    };
    if (typeof raw.roomId !== "string" || !raw.roomId) return null;
    return {
      roomId: raw.roomId,
      playerId: typeof raw.playerId === "string" ? raw.playerId : "",
      roomCode: typeof raw.roomCode === "string" ? raw.roomCode : "",
    };
  } catch {
    return null;
  }
}

export function hasActiveGameSession(): boolean {
  return readMatchSession() !== null;
}

export function clearMatchSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(MATCH_SESSION_KEY);
}

export function saveMatchSession(roomId: string, playerId: string, roomCode: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    MATCH_SESSION_KEY,
    JSON.stringify({ roomId, playerId, roomCode }),
  );
}

export function displayNameForJoin(user: {
  user_metadata?: { display_name?: string; full_name?: string };
  email?: string | null;
} | null): string | null {
  return (
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    null
  );
}
