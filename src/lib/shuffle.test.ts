import { describe, expect, it } from "vitest";
import { shuffleOrderItItems, shufflePickCorrectPayload } from "./shuffle";

describe("shufflePickCorrectPayload", () => {
  const payload = {
    cards: ["A", "B", "C", "D", "E", "F", "G", "H"],
    correct_indices: [0, 2, 4, 6],
  };

  it("keeps the same correct labels under a new layout", () => {
    const shuffled = shufflePickCorrectPayload(payload, "room:block:0:prompt");
    const correctLabels = shuffled.correct_indices.map((index) => shuffled.cards[index]);
    expect(correctLabels.sort()).toEqual(["A", "C", "E", "G"]);
    expect(shuffled.cards).toHaveLength(8);
  });

  it("is deterministic for the same seed and moves left-column answers", () => {
    const first = shufflePickCorrectPayload(payload, "shared-seed");
    const second = shufflePickCorrectPayload(payload, "shared-seed");
    expect(first).toEqual(second);
    expect([...first.correct_indices].sort((a, b) => a - b).join(",")).not.toBe("0,2,4,6");
  });

  it("changes order when the seed changes", () => {
    const a = shufflePickCorrectPayload(payload, "block-a");
    const b = shufflePickCorrectPayload(payload, "block-b");
    expect(a.cards.join("|")).not.toBe(b.cards.join("|"));
  });
});

describe("shuffleOrderItItems", () => {
  it("swaps the first two items when a shuffle would leave the correct order", () => {
    const entries = shuffleOrderItItems(
      ["one", "two", "three", "four"],
      [0, 1, 2, 3],
      () => 0.999999,
    );
    expect(entries.map((entry) => entry.orig)).toEqual([1, 0, 2, 3]);
  });
});
