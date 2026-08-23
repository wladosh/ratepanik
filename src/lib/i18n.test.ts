import { describe, expect, it } from "vitest";
import { interpolate, messages, parseLocale } from "./i18n";

describe("parseLocale", () => {
  it("accepts english and defaults to german", () => {
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("de")).toBe("de");
    expect(parseLocale("fr")).toBe("de");
    expect(parseLocale(null)).toBe("de");
  });
});

describe("interpolate", () => {
  it("replaces named placeholders", () => {
    expect(interpolate("{n}/6 characters", { n: 4 })).toBe("4/6 characters");
    expect(interpolate("Level {level} · {games} games", { level: 3, games: 12 })).toBe(
      "Level 3 · 12 games",
    );
  });
});

describe("locale copy", () => {
  it("keeps signup confirm copy free of internals", () => {
    expect(messages.de.signup.confirmBody).not.toMatch(/Supabase|Testkonto/i);
    expect(messages.en.signup.confirmBody).not.toMatch(/Supabase|test account/i);
    expect(messages.en.signup.confirmHint).not.toMatch(/test account/i);
  });
});
