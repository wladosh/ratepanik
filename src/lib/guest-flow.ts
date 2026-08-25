const MATCH_SESSION_KEY = "ratepanik-session";

export function isJoinCode(value: string | null | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9]{6}$/.test(value));
}

/** Guests never land on the signed-in home dashboard. */
export function guestMaySeeAppHome(isGuest: boolean): boolean {
  return !isGuest;
}

/** Account holders keep their claimed username; only guests can rename in the lobby. */
export function guestMayRenameInLobby(isGuest: boolean): boolean {
  return isGuest;
}

export function resolveGuestExitPath(next?: string): string {
  if (next === "/auth/signup" || next === "/auth/login") return next;
  return "/auth/login";
}

/** A join link wins over a leftover match session so QR scans don't flash the old room. */
export function shouldSkipSessionRestore(joinCode: string | undefined): boolean {
  return isJoinCode(joinCode);
}

/** Guests restore only through `/?join=CODE`. A bare `/` is an exit, not home. */
export function shouldRestoreMatchOnBareHome(isGuest: boolean): boolean {
  return !isGuest;
}

export function readMatchSession(): { roomId: string; playerId: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(sessionStorage.getItem(MATCH_SESSION_KEY) || "{}") as {
      roomId?: unknown;
      playerId?: unknown;
    };
    if (typeof raw.roomId !== "string" || !raw.roomId) return null;
    return {
      roomId: raw.roomId,
      playerId: typeof raw.playerId === "string" ? raw.playerId : "",
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
