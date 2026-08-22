"use client";

import { useState, useRef, useCallback } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameChecking, setNameChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserSupabase();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedName = displayName.trim();

  const handleDisplayNameChange = useCallback((value: string) => {
    setDisplayName(value);
    const t = value.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (t.length === 0) {
      setNameError(null);
      setNameAvailable(null);
      setNameChecking(false);
      return;
    }

    if (t.length < 3) {
      setNameError("Name zu kurz (min. 3 Zeichen)");
      setNameAvailable(null);
      setNameChecking(false);
      return;
    }

    setNameChecking(true);
    setNameError(null);
    setNameAvailable(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/username/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: t }),
        });
        const data = await res.json();
        setNameChecking(false);
        setNameAvailable(data.available);
        if (!data.available && data.error) {
          setNameError(data.error);
        }
      } catch {
        setNameChecking(false);
      }
    }, 400);
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (trimmedName.length < 3) {
      setNameError("Name zu kurz (min. 3 Zeichen)");
      return;
    }

    if (nameAvailable === false) {
      return;
    }

    setLoading(true);
    setError(null);

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: trimmedName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signupError) {
      const msg = signupError.message.toLowerCase();
      if (
        msg.includes("rate limit") ||
        msg.includes("over_email_send_rate_limit") ||
        msg.includes("429")
      ) {
        setError(
          "Zu viele Anmelde-Mails gerade. Bitte ~1 Stunde warten, Google nutzen, oder später nochmal."
        );
      } else {
        setError(signupError.message);
      }
      setLoading(false);
      return;
    }

    if (signupData.user) {
      const claimRes = await fetch("/api/username/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedName }),
      });
      const claimData = await claimRes.json();

      if (!claimData.ok) {
        setError(claimData.error ?? "Name konnte nicht reserviert werden");
        setLoading(false);
        return;
      }
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-5 py-8"
        style={{
          background: "var(--rp-bg-hero)",
          paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
        }}
      >
        <div className="w-full max-w-sm text-center space-y-5 animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(61, 204, 138, 0.12)" }}
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="var(--rp-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12a10 10 0 1 1-10-10" />
              <path d="M8 11.8 11 15l6.5-8" />
            </svg>
          </div>
          <h2
            className="text-2xl font-extrabold tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, var(--rp-purple) 0%, var(--rp-pink) 50%, var(--rp-peach) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Bestätigungs-E-Mail gesendet!
          </h2>
          <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
            Prüfe dein Postfach und klicke den Link, um dein Konto zu aktivieren.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-2 h-[48px] leading-[48px] w-full rounded-[var(--rp-radius-pill)] text-sm font-bold transition-all active:scale-[0.97]"
            style={{
              border: "2px solid var(--rp-purple-soft)",
              color: "var(--rp-purple)",
              background: "rgba(139, 124, 255, 0.06)",
            }}
          >
            Zurück zum Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-5 py-8"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm space-y-5 animate-fade-in">
        <div className="text-center">
          <h1
            className="text-4xl font-extrabold tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, var(--rp-purple) 0%, var(--rp-pink) 50%, var(--rp-peach) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Ratepanik
          </h1>
          <p className="mt-1" style={{ color: "var(--rp-text-secondary)" }}>
            Konto erstellen
          </p>
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{
              background: "rgba(255, 92, 122, 0.1)",
              border: "1px solid rgba(255, 92, 122, 0.2)",
              color: "var(--rp-danger)",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 h-[52px] rounded-[var(--rp-radius-md)] text-base font-bold transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: "var(--rp-bg-elevated)",
            color: "var(--rp-text)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Mit Google registrieren
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "var(--rp-border)" }} />
          <span className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>oder</span>
          <div className="flex-1 h-px" style={{ background: "var(--rp-border)" }} />
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="Anzeigename (min. 3 Zeichen)"
              required
              minLength={3}
              maxLength={20}
              className="w-full h-[48px] rounded-[var(--rp-radius-md)] border-2 px-5 pr-12 text-sm font-medium transition-all focus:outline-none"
              style={{
                borderColor: nameError
                  ? "var(--rp-danger)"
                  : nameAvailable
                    ? "var(--rp-success)"
                    : "var(--rp-border)",
                background: "var(--rp-bg-elevated)",
                color: "var(--rp-text)",
              }}
              onFocus={(e) => {
                if (!nameError) {
                  e.currentTarget.style.borderColor = "var(--rp-focus-ring)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(139, 124, 255, 0.15)";
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
                if (!nameError && !nameAvailable) {
                  e.currentTarget.style.borderColor = "var(--rp-border)";
                }
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {nameChecking && (
                <div
                  className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "var(--rp-purple)", borderTopColor: "transparent" }}
                />
              )}
              {!nameChecking && nameAvailable && (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-success)">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              {!nameChecking && nameError && trimmedName.length > 0 && (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-danger)">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              )}
            </div>
          </div>
          {nameError && (
            <p
              className="text-xs font-medium px-1"
              style={{ color: "var(--rp-danger)" }}
            >
              {nameError}
            </p>
          )}
          {nameAvailable && !nameError && (
            <p
              className="text-xs font-medium px-1"
              style={{ color: "var(--rp-success)" }}
            >
              Name verfügbar!
            </p>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            required
            className="w-full h-[48px] rounded-[var(--rp-radius-md)] border-2 px-4 text-sm font-medium transition-all focus:outline-none"
            style={{
              borderColor: "var(--rp-border)",
              background: "var(--rp-bg-elevated)",
              color: "var(--rp-text)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--rp-focus-ring)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 124, 255, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--rp-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort (min. 6 Zeichen)"
            required
            minLength={6}
            className="w-full h-[48px] rounded-[var(--rp-radius-md)] border-2 px-4 text-sm font-medium transition-all focus:outline-none"
            style={{
              borderColor: "var(--rp-border)",
              background: "var(--rp-bg-elevated)",
              color: "var(--rp-text)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--rp-focus-ring)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 124, 255, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--rp-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="submit"
            disabled={loading || nameAvailable === false || trimmedName.length < 3}
            className="w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40"
            style={{
              background:
                "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
            }}
          >
            Registrieren
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm font-medium underline transition-colors"
            style={{ color: "var(--rp-purple)" }}
          >
            Schon ein Konto? Anmelden
          </Link>
        </div>
      </div>
    </div>
  );
}
