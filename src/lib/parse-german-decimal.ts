const PLAIN_NUMBER = /^\d+$/;
const DECIMAL_COMMA = /^\d+,\d+$/;
const DECIMAL_POINT = /^\d+\.\d+$/;
const GERMAN_GROUPED = /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/;
const INTERNATIONAL_GROUPED = /^\d{1,3}(?:,\d{3})+\.\d+$/;
const MULTI_COMMA_GROUPED = /^\d{1,3}(?:,\d{3}){2,}$/;
const SPACE_GROUPED = /^\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:,\d+)?$/;

/**
 * Parses a human-entered decimal while accepting common German notation.
 *
 * The accepted forms are intentionally narrow: decimal comma or point,
 * German thousands groups, international groups with a point decimal, and
 * grouped spaces. Exponents, partial values, and malformed groups are rejected.
 */
export function parseGermanDecimal(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const sign = trimmed[0] === "-" || trimmed[0] === "+" ? trimmed[0] : "";
  const unsigned = sign ? trimmed.slice(1) : trimmed;
  if (!unsigned) return null;

  let normalized: string | null = null;

  if (PLAIN_NUMBER.test(unsigned)) {
    normalized = unsigned;
  } else if (DECIMAL_POINT.test(unsigned)) {
    // A single point follows the input hint and is treated as a decimal mark.
    // German thousands remain supported when multiple groups are present or
    // when a comma supplies the decimal part (for example 1.234,56).
    normalized = unsigned;
  } else if (GERMAN_GROUPED.test(unsigned)) {
    normalized = unsigned.replaceAll(".", "").replace(",", ".");
  } else if (INTERNATIONAL_GROUPED.test(unsigned)) {
    normalized = unsigned.replaceAll(",", "");
  } else if (MULTI_COMMA_GROUPED.test(unsigned)) {
    normalized = unsigned.replaceAll(",", "");
  } else if (SPACE_GROUPED.test(unsigned)) {
    normalized = unsigned.replace(/[ \u00a0\u202f]/g, "").replace(",", ".");
  } else if (DECIMAL_COMMA.test(unsigned)) {
    normalized = unsigned.replace(",", ".");
  }

  if (normalized === null) return null;

  const value = Number(`${sign}${normalized}`);
  return Number.isFinite(value) ? value : null;
}
