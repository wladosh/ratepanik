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
  } else if (GERMAN_GROUPED.test(unsigned)) {
    // 1.234 and 1.234.567 are thousands groups. A true decimal uses a comma
    // (1,234) or a single point with 1–2 digits (12.5).
    normalized = unsigned.replaceAll(".", "").replace(",", ".");
  } else if (DECIMAL_POINT.test(unsigned)) {
    normalized = unsigned;
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

const INPUT_KEEP = /[^\d.,+\-]/g;

function groupThousands(digits: string): string {
  if (!digits) return "";
  const chars = digits.split("");
  const parts: string[] = [];
  for (let i = chars.length; i > 0; i -= 3) {
    parts.unshift(chars.slice(Math.max(0, i - 3), i).join(""));
  }
  return parts.join(".");
}

/**
 * Live display for the guess field: 10000000 → 10.000.000.
 * A comma (or a single point with 1–2 decimals) stays the decimal mark.
 */
export function formatGermanGroupedInput(raw: string): string {
  const cleaned = raw.replace(INPUT_KEEP, "");
  const sign = cleaned.startsWith("-") ? "-" : "";
  let body = cleaned;
  if (body.startsWith("+") || body.startsWith("-")) body = body.slice(1);
  body = body.replace(/[+\-]/g, "");

  const commaAt = body.indexOf(",");
  const lastDot = body.lastIndexOf(".");
  const dotCount = body.split(".").length - 1;

  let intDigits: string;
  let fraction: string | null = null;
  let keepTrailingSep = false;

  if (commaAt >= 0) {
    intDigits = body.slice(0, commaAt).replace(/\D/g, "");
    fraction = body.slice(commaAt + 1).replace(/\D/g, "");
    keepTrailingSep = fraction.length === 0 && body.endsWith(",");
  } else if (dotCount === 1 && lastDot >= 0) {
    const after = body.slice(lastDot + 1).replace(/\D/g, "");
    if (after.length <= 2) {
      intDigits = body.slice(0, lastDot).replace(/\D/g, "");
      fraction = after;
      keepTrailingSep = after.length === 0 && body.endsWith(".");
    } else {
      intDigits = body.replace(/\D/g, "");
    }
  } else {
    intDigits = body.replace(/\D/g, "");
  }

  intDigits = intDigits.replace(/^0+(?=\d)/, "");
  const grouped = groupThousands(intDigits);
  if (fraction !== null) {
    return `${sign}${grouped},${keepTrailingSep ? "" : fraction}`;
  }
  return `${sign}${grouped}`;
}

export function countContentChars(value: string, until: number): number {
  let count = 0;
  const end = Math.min(until, value.length);
  for (let i = 0; i < end; i++) {
    if (value[i] !== ".") count += 1;
  }
  return count;
}

export function caretAfterContentChars(
  formatted: string,
  contentCharsBefore: number,
): number {
  if (contentCharsBefore <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] === ".") continue;
    seen += 1;
    if (seen >= contentCharsBefore) return i + 1;
  }
  return formatted.length;
}
