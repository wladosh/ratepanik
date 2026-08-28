import { describe, expect, it } from "vitest";
import { pickPromptsAcrossModes, pickPromptsForBlock } from "./content";

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

describe("pickPromptsAcrossModes", () => {
  it("picks a random play type each slot from remaining prompts", () => {
    const prompts = [
      { id: "g1", mode: "number_guess" },
      { id: "g2", mode: "number_guess" },
      { id: "p1", mode: "pick_correct" },
      { id: "l1", mode: "find_lie" },
    ];
    const seq = [0, 0, 0.99, 0, 0.5, 0];
    let i = 0;
    const picked = pickPromptsAcrossModes(prompts, 3, () => seq[i++] ?? 0);
    expect(picked.map((row) => row.id)).toEqual(["g1", "l1", "p1"]);
  });

  it("stays on one type when the lobby pool only has that type", () => {
    const prompts = [
      { id: "g1", mode: "number_guess" },
      { id: "g2", mode: "number_guess" },
      { id: "g3", mode: "number_guess" },
    ];
    const picked = pickPromptsAcrossModes(prompts, 3, () => 0);
    expect(picked.map((row) => row.mode)).toEqual([
      "number_guess",
      "number_guess",
      "number_guess",
    ]);
  });

  it("does not repeat a prompt id", () => {
    const prompts = [
      { id: "a", mode: "number_guess" },
      { id: "b", mode: "pick_correct" },
    ];
    const picked = pickPromptsAcrossModes(prompts, 4, () => 0);
    expect(picked.map((row) => row.id).sort()).toEqual(["a", "b"]);
  });
});
