"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("rate limit") ||
        msg.includes("over_email_send_rate_limit") ||
        msg.includes("429")
      ) {
        setError(
          "Zu viele Anmelde-Versuche gerade. Bitte ~1 Stunde warten oder später nochmal."
        );
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
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

  async function handleGuestLogin() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-5 py-8"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1
            className="text-4xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, var(--rp-purple) 0%, var(--rp-pink) 50%, var(--rp-peach) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Ratepanik
          </h1>
          <p className="mt-1" style={{ color: "var(--rp-text-secondary)" }}>
            Anmelden zum Spielen
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
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Mit Google anmelden
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "var(--rp-border)" }} />
          <span className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>oder</span>
          <div className="flex-1 h-px" style={{ background: "var(--rp-border)" }} />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
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
            placeholder="Passwort"
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
            disabled={loading}
            className="w-full h-[52px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, var(--rp-purple) 0%, var(--rp-purple-soft) 100%)",
            }}
          >
            Anmelden
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/auth/signup"
            className="text-sm font-medium underline transition-colors"
            style={{ color: "var(--rp-purple)" }}
          >
            Noch kein Konto? Registrieren
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "var(--rp-border)" }} />
          <span className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>oder</span>
          <div className="flex-1 h-px" style={{ background: "var(--rp-border)" }} />
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full h-[52px] rounded-[var(--rp-radius-pill)] text-base font-bold transition-all active:scale-[0.97] disabled:opacity-50"
          style={{
            border: "2px solid var(--rp-purple-soft)",
            color: "var(--rp-purple)",
            background: "rgba(139, 124, 255, 0.06)",
          }}
        >
          Als Gast beitreten
        </button>
        <p className="text-center text-xs" style={{ color: "var(--rp-text-secondary)" }}>
          G&auml;ste k&ouml;nnen nur Spielen beitreten, nicht selbst hosten.
        </p>
      </div>
    </div>
  );
}
