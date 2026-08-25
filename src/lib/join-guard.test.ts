import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearJoinSeat,
  isLiveJoinViewport,
  joinAttemptKey,
  joinSeatKey,
  readJoinSeat,
  resetJoinInflightForTests,
  takeJoinInflight,
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
