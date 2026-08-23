import { describe, expect, it } from "vitest";
import { messages } from "./i18n";
import { mapAuthError } from "./auth-errors";

const de = messages.de;

describe("mapAuthError", () => {
  it("maps email confirm rate limit to DE copy plus bypass hint", () => {
    const info = mapAuthError(de, {
      code: "over_email_send_rate_limit",
      message: "email rate limit exceeded",
      status: 429,
    });
    expect(info.message).toBe(de.auth.rateLimit);
    expect(info.hint).toBe(de.auth.bypassHint);
    expect(info.message).toMatch(/2/);
    expect(info.hint).toMatch(/Google/);
  });

  it("maps unconfirmed email without suggesting an immediate resend", () => {
    const info = mapAuthError(de, {
      code: "email_not_confirmed",
      message: "Email not confirmed",
    });
    expect(info.message).toBe(de.auth.emailNotConfirmed);
    expect(info.hint).toBe(de.auth.emailNotConfirmedHint);
  });

  it("maps already-registered to login / Google / test account", () => {
    const info = mapAuthError(de, {
      message: "User already registered",
    });
    expect(info.message).toBe(de.auth.alreadyRegistered);
    expect(info.hint).toBe(de.auth.alreadyRegisteredHint);
  });

  it("maps invalid credentials without a bypass hint", () => {
    const info = mapAuthError(de, {
      code: "invalid_credentials",
      message: "Invalid login credentials",
    });
    expect(info.message).toBe(de.auth.invalidCredentials);
    expect(info.hint).toBeUndefined();
  });

  it("never returns raw English API text", () => {
    const info = mapAuthError(de, { message: "Unexpected failure from GoTrue" });
    expect(info.message).toBe(de.auth.generic);
    expect(info.message).not.toMatch(/GoTrue|Unexpected/);
    expect(info.hint).toBe(de.auth.bypassHint);
  });
});
