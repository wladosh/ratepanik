import { describe, expect, it } from "vitest";
import { pickPromptsForBlock } from "./content";

describe("pickPromptsForBlock", () => {
  it("prefers the chosen theme and fills from extras", () => {
    const picked = pickPromptsForBlock(
      [{ id: "theme-a" }, { id: "theme-a-2" }],
      [{ id: "theme-a" }, { id: "other-1" }, { id: "other-2" }],
      3,
    );
    expect(picked.map((row) => row.id)).toEqual(["theme-a", "theme-a-2", "other-1"]);
  });
});
