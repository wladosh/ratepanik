"use client";

import { useState, useRef, useCallback } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { mapAuthError, type AuthErrorInfo } from "@/lib/auth-errors";
import { AuthErrorBanner } from "@/components/auth-error-banner";
import { usernameCheckMessage } from "@/lib/match-ui";
import { PasswordField } from "@/components/password-field";

export default function SignupPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameChecking, setNameChecking] = useState(false);
  const [error, setError] = useState<AuthErrorInfo | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserSupabase();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedName = displayName.trim();

  const handleDisplayNameChange = useCallback((value: string) => {
    setDisplayName(value);
    const trimmed = value.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmed.length === 0) {
      setNameError(null);
      setNameAvailable(null);
      setNameChecking(false);
      return;
    }

    if (trimmed.length < 3) {
      setNameError(t.signup.nameTooShort);
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
          body: JSON.stringify({ username: trimmed }),
        });
        const data = await res.json();
        setNameChecking(false);
        setNameAvailable(data.available);
        if (!data.available && data.error) {
          setNameError(usernameCheckMessage(t, data.error));
        }
      } catch {
        setNameChecking(false);
      }
    }, 400);
  }, [t]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (trimmedName.length < 3) {
      setNameError(t.signup.nameTooShort);
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
      setError(mapAuthError(t, signupError));
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
        setError({ message: claimData.error ?? t.signup.claimFailed });
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
      setError(mapAuthError(t, error));
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-5 py-8"
        style={{
          background: "var(--rp-nb-cream)",
          paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
        }}
      >
        <div className="w-full max-w-sm text-center space-y-5 animate-fade-in">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center"
            style={{
              background: "var(--rp-nb-mint)",
              border: "var(--rp-nb-border)",
              borderRadius: "var(--rp-nb-radius)",
              boxShadow: "var(--rp-nb-shadow)",
            }}
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="var(--rp-nb-black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12a10 10 0 1 1-10-10" />
              <path d="M8 11.8 11 15l6.5-8" />
            </svg>
          </div>
          <h2 className="nb-heading text-2xl tracking-tight">
            {t.signup.confirmTitle}
          </h2>
          <p className="text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
            {t.signup.confirmBody}
          </p>
          <p className="text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
            {t.signup.confirmHint}
          </p>
          <Link
            href="/auth/login"
            className="nb-btn inline-block mt-2 h-[48px] leading-[48px] w-full text-sm"
            style={{
              background: "var(--rp-nb-lilac)",
              color: "var(--rp-nb-purple-deep)",
            }}
          >
            {t.signup.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-5 py-8"
      style={{
        background: "var(--rp-nb-cream)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm space-y-5 animate-fade-in">
        <div className="text-center">
          <h1
            className="nb-heading text-4xl tracking-tight"
            style={{ color: "var(--rp-nb-purple-deep)" }}
          >
            RATEPANIK
          </h1>
          <p className="mt-1 font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
            {t.signup.subtitle}
          </p>
        </div>

        {error && <AuthErrorBanner message={error.message} hint={error.hint} />}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="nb-btn w-full flex items-center justify-center gap-3 h-[52px] text-base"
          style={{
            background: "var(--rp-nb-white)",
            color: "var(--rp-nb-text)",
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
          {t.signup.google}
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-[3px]" style={{ background: "var(--rp-nb-black)" }} />
          <span className="text-sm font-black uppercase" style={{ color: "var(--rp-nb-text-secondary)" }}>{t.common.or}</span>
          <div className="flex-1 h-[3px]" style={{ background: "var(--rp-nb-black)" }} />
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder={t.signup.namePlaceholder}
              required
              minLength={3}
              maxLength={20}
              className="nb-input w-full h-[48px] px-5 pr-12 text-sm"
              style={{
                borderColor: nameError
                  ? "var(--rp-nb-red)"
                  : nameAvailable
                    ? "var(--rp-nb-green)"
                    : "var(--rp-nb-black)",
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {nameChecking && (
                <div
                  className="w-5 h-5 border-3 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "var(--rp-nb-purple-deep)", borderTopColor: "transparent" }}
                />
              )}
              {!nameChecking && nameAvailable && (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-nb-green)">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              {!nameChecking && nameError && trimmedName.length > 0 && (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-nb-red)">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              )}
            </div>
          </div>
          {nameError && (
            <p
              className="text-xs font-bold px-1"
              style={{ color: "var(--rp-nb-red)" }}
            >
              {nameError}
            </p>
          )}
          {nameAvailable && !nameError && (
            <p
              className="text-xs font-bold px-1"
              style={{ color: "var(--rp-nb-green)" }}
            >
              {t.signup.nameAvailable}
            </p>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.signup.email}
            required
            className="nb-input w-full h-[48px] px-4 text-sm"
          />
          <PasswordField
            value={password}
            onChange={setPassword}
            placeholder={t.signup.password}
            minLength={6}
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={
              loading ||
              nameAvailable !== true ||
              trimmedName.length < 3 ||
              email.trim().length === 0 ||
              password.length < 6
            }
            className="nb-btn w-full h-[54px] text-[17px] text-white"
            style={{
              background: "var(--rp-nb-peach)",
            }}
          >
            {t.signup.submit}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm font-bold underline"
            style={{ color: "var(--rp-nb-purple-deep)" }}
          >
            {t.signup.hasAccount}
          </Link>
        </div>
      </div>
    </div>
  );
}
