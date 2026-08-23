import { describe, expect, it } from "vitest";
import { reorderItems } from "./order-it-reorder";

describe("reorderItems", () => {
  it("moves an item forward and backward", () => {
    expect(reorderItems(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(reorderItems(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("returns the same array when indexes do not move", () => {
    const items = ["a", "b", "c"];
    expect(reorderItems(items, 1, 1)).toBe(items);
    expect(reorderItems(items, -1, 0)).toBe(items);
    expect(reorderItems(items, 0, 9)).toBe(items);
  });
});
