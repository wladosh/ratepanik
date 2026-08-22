"use client";

import { useState, useRef, useCallback } from "react";

interface SetUsernameScreenProps {
  onClaimed: () => void;
  claimUsername: (username: string) => Promise<{ ok: boolean; error?: string }>;
  checkUsername: (username: string) => Promise<{ available: boolean; error?: string | null }>;
  defaultName?: string;
}

export function SetUsernameScreen({
  onClaimed,
  claimUsername,
  checkUsername,
  defaultName = "",
}: SetUsernameScreenProps) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = name.trim();

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      const t = value.trim();

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (t.length < 3) {
        setAvailable(null);
        setError(t.length > 0 ? "Name zu kurz (min. 3 Zeichen)" : null);
        setChecking(false);
        return;
      }

      setChecking(true);
      setError(null);
      setAvailable(null);

      debounceRef.current = setTimeout(async () => {
        const result = await checkUsername(t);
        setChecking(false);
        setAvailable(result.available);
        if (!result.available && result.error) {
          setError(result.error);
        }
      }, 400);
    },
    [checkUsername]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (trimmed.length < 3) {
      setError("Name zu kurz (min. 3 Zeichen)");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await claimUsername(trimmed);

    if (result.ok) {
      onClaimed();
    } else {
      setError(result.error ?? "Fehler beim Speichern");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-5"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm space-y-5 animate-fade-in">
        <div className="text-center">
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, var(--rp-purple) 0%, var(--rp-pink) 50%, var(--rp-peach) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Wähle deinen Namen
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--rp-text-secondary)" }}>
            Dieser Name wird anderen Spielern angezeigt.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Dein Spielername"
              maxLength={20}
              minLength={3}
              autoFocus
              className="w-full h-[52px] rounded-2xl border-2 px-5 pr-12 text-lg font-bold transition-all focus:outline-none"
              style={{
                borderColor: error
                  ? "var(--rp-danger)"
                  : available
                    ? "var(--rp-success)"
                    : "var(--rp-border)",
                background: "var(--rp-bg-elevated)",
                color: "var(--rp-text)",
              }}
              onFocus={(e) => {
                if (!error) {
                  e.currentTarget.style.borderColor = "var(--rp-focus-ring)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(139, 124, 255, 0.15)";
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
                if (!error && !available) {
                  e.currentTarget.style.borderColor = "var(--rp-border)";
                }
              }}
            />
            {/* Status indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {checking && (
                <div
                  className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "var(--rp-purple)", borderTopColor: "transparent" }}
                />
              )}
              {!checking && available && (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-success)">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              {!checking && error && trimmed.length > 0 && (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-danger)">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              )}
            </div>
          </div>

          {error && (
            <p
              className="text-xs font-medium px-1"
              style={{ color: "var(--rp-danger)" }}
            >
              {error}
            </p>
          )}

          {available && !error && (
            <p
              className="text-xs font-medium px-1"
              style={{ color: "var(--rp-success)" }}
            >
              Name verfügbar!
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !available || !!error || trimmed.length < 3}
            className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40"
            style={{
              background:
                "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
            }}
          >
            {submitting ? "Wird gespeichert..." : "Name bestätigen"}
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: "var(--rp-text-secondary)" }}>
          Du kannst deinen Namen später in den Einstellungen ändern.
        </p>
      </div>
    </div>
  );
}
