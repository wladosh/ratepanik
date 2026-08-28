import { describe, expect, it } from "vitest";
import { shuffleOrderItItems, shufflePickCorrectPayload, subsetPickCorrectPayload } from "./shuffle";

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

describe("subsetPickCorrectPayload", () => {
  const payload = {
    cards: ["A", "B", "C", "D", "E", "F", "G", "H"],
    correct_indices: [0, 2, 4, 6],
  };

  it("subsets 8 cards to 4 with a balanced 2+2 split", () => {
    const result = subsetPickCorrectPayload(payload, 4, "room:0:0");
    expect(result.cards).toHaveLength(4);
    expect(result.correct_indices).toHaveLength(2);
    const wrongCount = result.cards.length - result.correct_indices.length;
    expect(wrongCount).toBe(2);
  });

  it("subsets 8 cards to 6 with a balanced 3+3 split", () => {
    const result = subsetPickCorrectPayload(payload, 6, "room:0:0");
    expect(result.cards).toHaveLength(6);
    expect(result.correct_indices).toHaveLength(3);
    const wrongCount = result.cards.length - result.correct_indices.length;
    expect(wrongCount).toBe(3);
  });

  it("returns original size when target equals card count", () => {
    const result = subsetPickCorrectPayload(payload, 8, "room:0:0");
    expect(result.cards).toHaveLength(8);
    expect(result.correct_indices).toHaveLength(4);
  });

  it("is deterministic for the same seed", () => {
    const first = subsetPickCorrectPayload(payload, 4, "fixed-seed");
    const second = subsetPickCorrectPayload(payload, 4, "fixed-seed");
    expect(first).toEqual(second);
  });

  it("produces different subsets for different seeds", () => {
    const a = subsetPickCorrectPayload(payload, 4, "seed-a");
    const b = subsetPickCorrectPayload(payload, 4, "seed-b");
    expect(a.cards.join("|")).not.toBe(b.cards.join("|"));
  });

  it("only includes cards from the original payload", () => {
    const result = subsetPickCorrectPayload(payload, 4, "test");
    for (const card of result.cards) {
      expect(payload.cards).toContain(card);
    }
  });

  it("marks correct_indices correctly in the subset", () => {
    const result = subsetPickCorrectPayload(payload, 4, "verify");
    const originalCorrectCards = payload.correct_indices.map((i) => payload.cards[i]);
    for (const idx of result.correct_indices) {
      expect(originalCorrectCards).toContain(result.cards[idx]);
    }
  });

  it("handles prompts with fewer cards than target without crashing", () => {
    const small = { cards: ["X", "Y"], correct_indices: [0] };
    const result = subsetPickCorrectPayload(small, 6, "room:0:0");
    expect(result.cards.length).toBeLessThanOrEqual(2);
    expect(result.correct_indices.length).toBeLessThanOrEqual(1);
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
