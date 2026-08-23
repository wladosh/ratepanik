export function joinUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/?join=${code}`;
}

export async function shareOrCopyJoinLink(
  code: string
): Promise<"shared" | "copied" | "failed"> {
  const url = joinUrl(code);
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: "Ratepanik",
        text: `Spiel mit mir auf Ratepanik! Code: ${code}`,
        url,
      });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "failed";
      }
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

export async function copyJoinLink(code: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(joinUrl(code));
    return true;
  } catch {
    return false;
  }
}
