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
      setError(signupError.message);
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
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-6xl">📬</div>
          <h2 className="text-2xl font-bold text-white">Bestätigungs-E-Mail gesendet!</h2>
          <p className="text-white/80">
            Prüfe dein Postfach und klicke den Link, um dein Konto zu aktivieren.
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-4 text-white/80 underline hover:text-white transition-colors"
          >
            Zurück zum Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
            Ratepanik
          </h1>
          <p className="mt-2 text-white/80">Konto erstellen</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/20 border border-red-300/30 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-lg font-bold text-gray-800 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50"
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

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/30" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-transparent px-4 text-sm text-white/70">oder</span>
          </div>
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
              className="w-full rounded-2xl border-2 px-5 py-3.5 pr-12 text-white placeholder:text-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              style={{
                borderColor: nameError
                  ? "rgba(255,100,100,0.8)"
                  : nameAvailable
                    ? "rgba(100,255,150,0.8)"
                    : "rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.2)",
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {nameChecking && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {!nameChecking && nameAvailable && (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="rgba(100,255,150,0.9)">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              {!nameChecking && nameError && trimmedName.length > 0 && (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="rgba(255,100,100,0.9)">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              )}
            </div>
          </div>
          {nameError && (
            <p className="text-xs font-medium text-red-200 px-1">{nameError}</p>
          )}
          {nameAvailable && !nameError && (
            <p className="text-xs font-medium text-green-200 px-1">Name verfügbar!</p>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            required
            className="w-full rounded-2xl border-2 border-white/30 bg-white/20 px-5 py-3.5 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort (min. 6 Zeichen)"
            required
            minLength={6}
            className="w-full rounded-2xl border-2 border-white/30 bg-white/20 px-5 py-3.5 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
          />
          <button
            type="submit"
            disabled={loading || nameAvailable === false || trimmedName.length < 3}
            className="w-full rounded-2xl bg-purple-700 px-6 py-4 text-lg font-bold text-white shadow-xl transition-all hover:bg-purple-800 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            Registrieren
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-white/80 underline hover:text-white transition-colors"
          >
            Schon ein Konto? Anmelden
          </Link>
        </div>
      </div>
    </div>
  );
}
