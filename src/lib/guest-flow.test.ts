import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearMatchSession,
  guestMaySeeAppHome,
  isJoinCode,
  resolveGuestExitPath,
  saveMatchSession,
  shouldRestoreMatchOnBareHome,
  shouldSkipSessionRestore,
} from "./guest-flow";

describe("isJoinCode", () => {
  it("accepts six alphanumeric characters", () => {
    expect(isJoinCode("S7FQBK")).toBe(true);
    expect(isJoinCode("abc123")).toBe(true);
  });

  it("rejects missing or short codes", () => {
    expect(isJoinCode(undefined)).toBe(false);
    expect(isJoinCode("AB")).toBe(false);
    expect(isJoinCode("S7FQBK!")).toBe(false);
  });
});

describe("guest home access", () => {
  it("never lets a guest see the app home", () => {
    expect(guestMaySeeAppHome(true)).toBe(false);
    expect(guestMaySeeAppHome(false)).toBe(true);
  });
});

describe("guest exit", () => {
  it("defaults to login and only allows auth routes", () => {
    expect(resolveGuestExitPath()).toBe("/auth/login");
    expect(resolveGuestExitPath("/auth/signup")).toBe("/auth/signup");
    expect(resolveGuestExitPath("/")).toBe("/auth/login");
  });
});

describe("session restore", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) delete store[key];
      },
      key: () => null,
      length: 0,
    };
    clearMatchSession();
  });

  afterEach(() => {
    delete (globalThis as unknown as Record<string, unknown>).window;
    delete (globalThis as unknown as Record<string, unknown>).sessionStorage;
    for (const key of Object.keys(store)) delete store[key];
  });

  it("skips restore when a join code is present and no matching session", () => {
    expect(shouldSkipSessionRestore("S7FQBK")).toBe(true);
    expect(shouldSkipSessionRestore(undefined)).toBe(false);
  });

  it("keeps the session when the stored room code matches the join link", () => {
    saveMatchSession("room-123", "player-456", "S7FQBK");
    expect(shouldSkipSessionRestore("S7FQBK")).toBe(false);
    expect(shouldSkipSessionRestore("s7fqbk")).toBe(false);
  });

  it("skips restore when the stored session is for a different room", () => {
    saveMatchSession("room-123", "player-456", "ABCDEF");
    expect(shouldSkipSessionRestore("S7FQBK")).toBe(true);
  });

  it("allows restore on bare home so guests survive app-switch", () => {
    expect(shouldRestoreMatchOnBareHome(true)).toBe(true);
    expect(shouldRestoreMatchOnBareHome(false)).toBe(true);
  });
});
