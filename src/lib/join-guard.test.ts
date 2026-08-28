import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearJoinSeat,
  findExistingSeat,
  isLiveJoinViewport,
  joinAttemptKey,
  joinSeatKey,
  readJoinSeat,
  readStoredPlayerId,
  resetJoinInflightForTests,
  resolveJoinUid,
  takeJoinInflight,
  waitForStableForeground,
  writeJoinSeat,
} from "./join-guard";

describe("isLiveJoinViewport", () => {
  it("rejects hidden and prerendered documents", () => {
    expect(isLiveJoinViewport(null)).toBe(false);
    expect(isLiveJoinViewport({ hidden: true, visibilityState: "visible" })).toBe(false);
    expect(isLiveJoinViewport({ hidden: false, visibilityState: "hidden" })).toBe(false);
    expect(
      isLiveJoinViewport({ hidden: false, visibilityState: "visible", prerendering: true }),
    ).toBe(false);
  });

  it("accepts a visible, non-prerendered page", () => {
    expect(isLiveJoinViewport({ hidden: false, visibilityState: "visible" })).toBe(true);
  });
});

describe("joinAttemptKey", () => {
  it("normalizes the room code", () => {
    expect(joinAttemptKey(" ab12cd ", "user-1")).toBe("AB12CD:user-1");
  });
});

describe("resolveJoinUid", () => {
  it("never invents a uid and prefers the context user", () => {
    expect(resolveJoinUid(null, null)).toBeNull();
    expect(resolveJoinUid(undefined, undefined)).toBeNull();
    expect(resolveJoinUid(null, "auth-1")).toBe("auth-1");
    expect(resolveJoinUid("ctx-1", "auth-1")).toBe("ctx-1");
  });
});

describe("findExistingSeat", () => {
  const players = [
    { id: "p-other", user_id: "u-other" },
    { id: "p-me", user_id: "u-me" },
  ];

  it("prefers the seat already tied to this auth user", () => {
    expect(findExistingSeat(players, "u-me", "p-other")?.id).toBe("p-me");
  });

  it("falls back to the remembered player id from this tab", () => {
    expect(findExistingSeat(players, "u-new", "p-other")?.id).toBe("p-other");
  });

  it("returns null when this user has no seat", () => {
    expect(findExistingSeat(players, "u-new", "missing")).toBeNull();
    expect(findExistingSeat([], "u-me", "p-me")).toBeNull();
  });
});

describe("readStoredPlayerId", () => {
  it("reads a player id from the match session blob", () => {
    expect(readStoredPlayerId(JSON.stringify({ roomId: "r", playerId: "p-1" }))).toBe("p-1");
    expect(readStoredPlayerId("{")).toBeNull();
    expect(readStoredPlayerId(null)).toBeNull();
  });
});

describe("takeJoinInflight", () => {
  afterEach(() => {
    resetJoinInflightForTests();
  });

  it("reuses the same promise for a concurrent remount", async () => {
    let starts = 0;
    const start = () => {
      starts += 1;
      return Promise.resolve("seat");
    };

    const [a, b] = await Promise.all([
      takeJoinInflight("ROOM:u1", start),
      takeJoinInflight("ROOM:u1", start),
    ]);

    expect(starts).toBe(1);
    expect(a).toBe("seat");
    expect(b).toBe("seat");
  });
});

describe("join seat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("remembers the player id for a room code", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });

    expect(joinSeatKey("s7fqbk")).toBe("ratepanik-join-seat:S7FQBK");
    writeJoinSeat("s7fqbk", "player-1");
    expect(readJoinSeat("S7FQBK")).toBe("player-1");
    clearJoinSeat("s7fqbk");
    expect(readJoinSeat("S7FQBK")).toBeNull();
  });
});

describe("waitForStableForeground", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function mockDoc(state: { hidden: boolean; visibilityState: string; prerendering?: boolean }) {
    const listeners = new Map<string, Set<() => void>>();
    return {
      ...state,
      addEventListener: (type: string, fn: () => void) => {
        const set = listeners.get(type) ?? new Set();
        set.add(fn);
        listeners.set(type, set);
      },
      removeEventListener: (type: string, fn: () => void) => {
        listeners.get(type)?.delete(fn);
      },
      emit(type: string) {
        for (const fn of listeners.get(type) ?? []) fn();
      },
    };
  }

  it("resolves true after the page stays visible long enough", async () => {
    vi.useFakeTimers();
    const doc = mockDoc({ hidden: false, visibilityState: "visible" });
    const pending = waitForStableForeground(1000, doc);
    await vi.advanceTimersByTimeAsync(999);
    let done = false;
    void pending.then(() => {
      done = true;
    });
    await Promise.resolve();
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toBe(true);
  });

  it("resolves false when aborted (preview webview discarded)", async () => {
    vi.useFakeTimers();
    const doc = mockDoc({ hidden: false, visibilityState: "visible" });
    const controller = new AbortController();
    const pending = waitForStableForeground(1000, doc, controller.signal);
    controller.abort();
    expect(await pending).toBe(false);
  });
});
