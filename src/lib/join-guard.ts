/** iOS Camera / Safari previews load `/?join=` in a hidden or short-lived webview. */

export const JOIN_STABLE_VISIBLE_MS = 1000;

export function isLiveJoinViewport(doc?: {
  hidden?: boolean;
  visibilityState?: string;
  prerendering?: boolean;
} | null): boolean {
  if (!doc) return false;
  if (doc.hidden === true) return false;
  if (doc.visibilityState && doc.visibilityState !== "visible") return false;
  if (doc.prerendering === true) return false;
  return true;
}

export function waitForStableForeground(
  minVisibleMs: number = JOIN_STABLE_VISIBLE_MS,
  doc: {
    hidden?: boolean;
    visibilityState?: string;
    prerendering?: boolean;
    addEventListener: typeof document.addEventListener;
    removeEventListener: typeof document.removeEventListener;
  } = document,
): Promise<boolean> {
  return new Promise((resolve) => {
    let visibleSince: number | null = null;
    let settled = false;
    let interval = 0;

    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearInterval(interval);
      doc.removeEventListener("visibilitychange", onChange);
      doc.removeEventListener("prerenderingchange", onChange);
      resolve(ok);
    };

    const onChange = () => {
      if (!isLiveJoinViewport(doc)) {
        visibleSince = null;
        return;
      }
      if (visibleSince == null) visibleSince = Date.now();
      if (Date.now() - visibleSince >= minVisibleMs) settle(true);
    };

    interval = window.setInterval(onChange, 100);
    onChange();
  });
}

const inflightJoins = new Map<string, Promise<unknown>>();

export function joinAttemptKey(code: string, userId: string): string {
  return `${code.trim().toUpperCase()}:${userId}`;
}

/** One in-flight join per room+user so remounts (React Strict / iOS) share the insert. */
export function takeJoinInflight<T>(key: string, start: () => Promise<T>): Promise<T> {
  const existing = inflightJoins.get(key);
  if (existing) return existing as Promise<T>;

  const started = start();
  inflightJoins.set(key, started);
  void started.finally(() => {
    const later = globalThis.setTimeout(() => {
      if (inflightJoins.get(key) === started) inflightJoins.delete(key);
    }, 2500);
    later.unref?.();
  });
  return started;
}

export function resetJoinInflightForTests(): void {
  inflightJoins.clear();
}

const JOIN_SEAT_PREFIX = "ratepanik-join-seat:";

export function joinSeatKey(code: string): string {
  return `${JOIN_SEAT_PREFIX}${code.trim().toUpperCase()}`;
}

export function readJoinSeat(code: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const playerId = sessionStorage.getItem(joinSeatKey(code));
    return playerId || null;
  } catch {
    return null;
  }
}

export function writeJoinSeat(code: string, playerId: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(joinSeatKey(code), playerId);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearJoinSeat(code: string | null | undefined): void {
  if (!code || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(joinSeatKey(code));
  } catch {
    /* ignore */
  }
}
