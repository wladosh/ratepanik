"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { usernameCheckMessage } from "@/lib/match-ui";

interface SetUsernameScreenProps {
  onClaimed: () => void | Promise<unknown>;
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
  const { t } = useI18n();
  const prefillValid = defaultName.trim().length >= 3;
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(prefillValid);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = name.trim();

  useEffect(() => {
    const prefill = defaultName.trim();
    if (prefill.length < 3) return;

    const timer = setTimeout(async () => {
      const result = await checkUsername(prefill);
      setChecking(false);
      setAvailable(result.available);
      if (!result.available && result.error) {
        setError(usernameCheckMessage(t, result.error));
      }
    }, 300);

    return () => clearTimeout(timer);
    // Only run on mount — defaultName is the initial prefill value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      const next = value.trim();

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (next.length < 3) {
        setAvailable(null);
        setError(next.length > 0 ? t.signup.nameTooShort : null);
        setChecking(false);
        return;
      }

      setChecking(true);
      setError(null);
      setAvailable(null);

      debounceRef.current = setTimeout(async () => {
        const result = await checkUsername(next);
        setChecking(false);
        setAvailable(result.available);
        if (!result.available && result.error) {
          setError(usernameCheckMessage(t, result.error));
        }
      }, 400);
    },
    [checkUsername, t]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (trimmed.length < 3) {
      setError(t.signup.nameTooShort);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await claimUsername(trimmed);
      if (result.ok) {
        await onClaimed();
      } else {
        setError(result.error ?? "Fehler beim Speichern");
      }
    } catch {
      setError("Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-5"
      style={{
        background: "var(--rp-nb-cream)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm space-y-5 animate-fade-in">
        <div className="text-center">
          <h1 className="nb-heading text-3xl">
            Wähle deinen Namen
          </h1>
          <p className="mt-2 text-sm font-medium" style={{ color: "var(--rp-nb-text-secondary)" }}>
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
              className="nb-input w-full h-[52px] px-5 pr-12 text-lg"
              style={{
                borderColor: error
                  ? "var(--rp-nb-red)"
                  : available
                    ? "var(--rp-nb-green)"
                    : "var(--rp-nb-border-color)",
                background: "var(--rp-nb-white)",
                color: "var(--rp-nb-text)",
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {checking && (
                <div
                  className="w-5 h-5 border-3 border-t-transparent animate-spin"
                  style={{
                    borderColor: "var(--rp-nb-purple-deep)",
                    borderTopColor: "transparent",
                    borderRadius: "var(--rp-nb-radius)",
                  }}
                />
              )}
              {!checking && available && (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-nb-green)">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              {!checking && error && trimmed.length > 0 && (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-nb-red)">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              )}
            </div>
          </div>

          {error && (
            <p
              className="text-xs font-bold px-1"
              style={{ color: "var(--rp-nb-red)" }}
            >
              {error}
            </p>
          )}

          {available && !error && (
            <p
              className="text-xs font-bold px-1"
              style={{ color: "var(--rp-nb-green)" }}
            >
              Name verfügbar!
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !available || !!error || trimmed.length < 3}
            className="nb-btn w-full h-[54px] text-[17px] text-white"
            style={{
              background: "var(--rp-nb-peach)",
            }}
          >
            {submitting ? "Wird gespeichert..." : "Name bestätigen"}
          </button>
        </form>

        <p className="text-center text-xs font-medium" style={{ color: "var(--rp-nb-text-secondary)" }}>
          Du kannst deinen Namen später in den Einstellungen ändern.
        </p>
      </div>
    </div>
  );
}
