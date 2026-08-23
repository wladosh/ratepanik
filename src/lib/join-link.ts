export function joinUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/?join=${code}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
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
  return (await copyText(url)) ? "copied" : "failed";
}

export async function copyJoinLink(code: string): Promise<boolean> {
  return copyText(joinUrl(code));
}
