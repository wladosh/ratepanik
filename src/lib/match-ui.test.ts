import { describe, expect, it } from "vitest";
import { messages } from "./i18n";
import {
  allScoresTied,
  classifyFriendError,
  competitionRanks,
  friendErrorCopy,
  joinBlockedCopy,
  parseFriendCodePayload,
  placeGlyph,
  scoreboardLeadKind,
  usernameCheckCodeFromRpc,
} from "./match-ui";

describe("scoreboardLeadKind", () => {
  it("does not call a 0–0 leader the winner", () => {
    expect(scoreboardLeadKind([0, 0], true)).toBe("open");
    expect(scoreboardLeadKind([0, 0], false)).toBe("open");
  });

  it("uses Gleichstand when scores tie above zero", () => {
    expect(scoreboardLeadKind([200, 200], true)).toBe("tie");
  });

  it("says you lead only with a unique top score", () => {
    expect(scoreboardLeadKind([400, 200], true)).toBe("you");
    expect(scoreboardLeadKind([400, 200], false)).toBe("them");
  });
});

describe("competitionRanks", () => {
  it("shares place 1 on a 0–0 finish", () => {
    expect(competitionRanks([0, 0])).toEqual([1, 1]);
  });

  it("uses 1,1,3 when two players tie for first", () => {
    expect(competitionRanks([400, 400, 100])).toEqual([1, 1, 3]);
  });
});

describe("allScoresTied", () => {
  it("is true for two zeros", () => {
    expect(allScoresTied([0, 0])).toBe(true);
    expect(allScoresTied([10, 0])).toBe(false);
    expect(allScoresTied([5])).toBe(false);
  });
});

describe("placeGlyph", () => {
  it("gives both tied leaders the first-place mark", () => {
    const ranks = competitionRanks([0, 0]);
    expect(ranks.map((rank) => placeGlyph(rank, "crown"))).toEqual(["👑", "👑"]);
    expect(ranks.map((rank) => placeGlyph(rank))).toEqual(["🥇", "🥇"]);
  });
});

describe("friend errors", () => {
  it("never forwards PostgREST schema-cache text", () => {
    const raw =
      "Could not find the function public.request_friend(identifier) in the schema cache";
    expect(classifyFriendError(raw)).toBe("unavailable");
    expect(friendErrorCopy(raw, "de")).not.toMatch(/schema cache|request_friend/i);
    expect(friendErrorCopy(raw, "en")).toMatch(/Friends isn't available/i);
  });

  it("maps missing player copy", () => {
    expect(friendErrorCopy("Spieler nicht gefunden", "en")).toBe("Player not found.");
  });
});

describe("parseFriendCodePayload", () => {
  it("reads jsonb { ok, friend_code }", () => {
    expect(parseFriendCodePayload({ ok: true, friend_code: "AB12CD" })).toBe("AB12CD");
  });

  it("ignores dotted placeholders", () => {
    expect(parseFriendCodePayload({ friend_code: "··" })).toBeNull();
  });
});

describe("usernameCheckCodeFromRpc", () => {
  it("maps taken names without leaking auth", () => {
    expect(usernameCheckCodeFromRpc("Name bereits vergeben")).toBe("taken");
    expect(usernameCheckCodeFromRpc("Nicht angemeldet")).toBe("check_failed");
  });
});

describe("joinBlockedCopy", () => {
  it("localizes a missing room-capacity message", () => {
    expect(
      joinBlockedCopy(
        { allowGuests: true, joiningAsGuest: true, playerCount: 4, maxPlayers: 4 },
        messages.en,
      ),
    ).toBe("Room is full (max 4 players)!");
    expect(
      joinBlockedCopy(
        { allowGuests: false, joiningAsGuest: true, playerCount: 1, maxPlayers: 4 },
        messages.de,
      ),
    ).toMatch(/keine Gäste/);
  });
});
