import { describe, expect, it } from "vitest";
import { formatGermanGroupedInput, parseGermanDecimal } from "./parse-german-decimal";

describe("parseGermanDecimal", () => {
  it.each([
    ["12,5", 12.5],
    ["12.5", 12.5],
    ["1.234,56", 1234.56],
    ["1,234.56", 1234.56],
    ["1.234", 1234],
    ["1.23", 1.23],
    ["1.234.567", 1234567],
    ["1,234,567", 1234567],
    ["1 234,56", 1234.56],
    ["1\u202f234,56", 1234.56],
    ["-0,75", -0.75],
    ["+42", 42],
    ["  9000  ", 9000],
  ])("parses %s as %s", (input, expected) => {
    expect(parseGermanDecimal(input)).toBe(expected);
  });

  it.each([
    "",
    " ",
    "-",
    ".5",
    "12,",
    "12.",
    "1.23,45",
    "1,23.45",
    "1..234",
    "1,2,3",
    "12 34",
    "1 234.56",
    "1e3",
    "NaN",
    "∞",
    "--12",
  ])("rejects malformed input %j", (input) => {
    expect(parseGermanDecimal(input)).toBeNull();
  });
});

describe("formatGermanGroupedInput", () => {
  it.each([
    ["1", "1"],
    ["100", "100"],
    ["1000", "1.000"],
    ["10000000", "10.000.000"],
    ["1.0000000", "10.000.000"],
    ["10.000.000", "10.000.000"],
    ["12,5", "12,5"],
    ["12.", "12,"],
    ["12.5", "12,5"],
    ["-1000", "-1.000"],
    ["0,75", "0,75"],
    ["", ""],
  ])("formats %j as %j", (input, expected) => {
    expect(formatGermanGroupedInput(input)).toBe(expected);
  });
});
