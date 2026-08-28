import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  guestMaySeeAppHome,
  isJoinCode,
  resolveGuestExitPath,
  shouldRestoreMatchOnBareHome,
  shouldSkipSessionRestore,
  saveMatchSession,
  clearMatchSession,
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
    // Mock window + sessionStorage for Node test environment
    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { sessionStorage: unknown }).sessionStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
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

  it("does NOT skip restore when stored session matches the join code", () => {
    saveMatchSession("room-123", "player-456", "S7FQBK");
    expect(shouldSkipSessionRestore("S7FQBK")).toBe(false);
    expect(shouldSkipSessionRestore("s7fqbk")).toBe(false);
  });

  it("skips restore when stored session is for a different room code", () => {
    saveMatchSession("room-123", "player-456", "ABCDEF");
    expect(shouldSkipSessionRestore("S7FQBK")).toBe(true);
  });

  it("allows restore on bare home for all users", () => {
    expect(shouldRestoreMatchOnBareHome()).toBe(true);
  });
});
