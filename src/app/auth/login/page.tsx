"use client";

import { useState, Suspense } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n, LoadingPulse } from "@/lib/i18n-context";
import { mapAuthError, type AuthErrorInfo } from "@/lib/auth-errors";
import { AuthErrorBanner } from "@/components/auth-error-banner";
import { PasswordField } from "@/components/password-field";

function LoginContent() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthErrorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join") ?? "";
  const supabase = createBrowserSupabase();

  const redirectAfterLogin = joinCode ? `/?join=${joinCode}` : "/";

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(mapAuthError(t, error));
      setLoading(false);
      return;
    }

    router.push(redirectAfterLogin);
    router.refresh();
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${joinCode ? `?next=${encodeURIComponent(`/?join=${joinCode}`)}` : ""}`,
      },
    });

    if (error) {
      setError(mapAuthError(t, error));
      setLoading(false);
    }
  }

  async function handleGuestLogin() {
    if (!joinCode) {
      router.push("/");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      setError(mapAuthError(t, error));
      setLoading(false);
      return;
    }

    router.push(redirectAfterLogin);
    router.refresh();
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-5 py-8"
      style={{
        background: "var(--rp-nb-cream)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1
            className="nb-heading text-4xl tracking-tight"
            style={{ color: "var(--rp-nb-purple-deep)" }}
          >
            RATEPANIK
          </h1>
          <p className="mt-1 font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
            {t.login.subtitle}
          </p>
        </div>

        {error && <AuthErrorBanner message={error.message} hint={error.hint} />}

        <div
          className="nb-card-lg w-full p-5 space-y-3"
        >
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <label className="block text-sm font-black uppercase tracking-wide" style={{ color: "var(--rp-nb-text)" }}>
              {t.login.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.login.email}
              required
              className="nb-input w-full h-[48px] px-4 text-sm"
            />
            <PasswordField
              value={password}
              onChange={setPassword}
              placeholder={t.login.password}
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="nb-btn w-full h-[52px] text-[17px] text-white"
              style={{
                background: "var(--rp-nb-peach)",
              }}
            >
              {t.login.submit}
            </button>
          </form>

          <div className="text-center pt-1">
            <Link
              href="/auth/signup"
              className="text-sm font-bold underline"
              style={{ color: "var(--rp-nb-purple-deep)" }}
            >
              {t.login.noAccount}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex-1 h-[3px]" style={{ background: "var(--rp-nb-black)" }} />
          <span className="text-xs font-black uppercase" style={{ color: "var(--rp-nb-text-secondary)" }}>{t.login.moreOptions}</span>
          <div className="flex-1 h-[3px]" style={{ background: "var(--rp-nb-black)" }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="nb-btn w-full flex items-center justify-center gap-3 h-[46px] text-sm"
          style={{
            background: "var(--rp-nb-white)",
            color: "var(--rp-nb-text)",
          }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {t.login.google}
        </button>

        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="nb-btn w-full h-[46px] text-sm"
          style={{
            background: "var(--rp-nb-lilac)",
            color: "var(--rp-nb-black)",
          }}
        >
          {t.login.guest}
        </button>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-sm font-bold"
            style={{ color: "var(--rp-nb-text-secondary)" }}
          >
            {t.login.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingPulse minFullScreen />}>
      <LoginContent />
    </Suspense>
  );
}
