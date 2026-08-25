import { describe, expect, it } from "vitest";
import {
  guestMaySeeAppHome,
  isJoinCode,
  resolveGuestExitPath,
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
  it("skips restore when a join code is present", () => {
    expect(shouldSkipSessionRestore("S7FQBK")).toBe(true);
    expect(shouldSkipSessionRestore(undefined)).toBe(false);
  });

  it("does not restore a leftover match for guests on bare home", () => {
    expect(shouldRestoreMatchOnBareHome(true)).toBe(false);
    expect(shouldRestoreMatchOnBareHome(false)).toBe(true);
  });
});
