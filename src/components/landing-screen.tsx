"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function LandingScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setError("Code muss genau 6 Zeichen haben.");
      return;
    }
    setLoading(true);
    setError(null);

    if (!isAuthenticated) {
      const { createBrowserSupabase } = await import("@/lib/supabase/client");
      const supabase = createBrowserSupabase();
      const { error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        setError("Verbindungsfehler. Bitte versuche es erneut.");
        setLoading(false);
        return;
      }
    }

    router.push(`/?join=${trimmed}`);
    router.refresh();
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
      style={{ background: "var(--rp-bg-hero)" }}
    >
      {/* Confetti decoration dots */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[10%] left-[8%] w-2 h-2 rounded-full bg-[var(--rp-purple-soft)] opacity-60" />
        <div className="absolute top-[15%] right-[12%] w-3 h-3 rounded-full bg-[var(--rp-pink)] opacity-40" />
        <div className="absolute top-[22%] left-[20%] w-1.5 h-1.5 rounded-full bg-[var(--rp-yellow)] opacity-50" />
        <div className="absolute top-[18%] right-[25%] w-2 h-2 rounded-full bg-[var(--rp-mint)] opacity-50" />
        <div className="absolute top-[8%] left-[45%] w-2.5 h-2.5 rounded-full bg-[var(--rp-peach)] opacity-40" />
        <div className="absolute top-[25%] right-[8%] w-1.5 h-4 rounded-full bg-[var(--rp-sky)] opacity-40 rotate-45" />
        <div className="absolute top-[12%] left-[30%] w-1.5 h-4 rounded-full bg-[var(--rp-peach)] opacity-30 -rotate-12" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Trophy — freestanding on gradient */}
        <div className="mb-4">
          <Image
            src="/rp/rp_trophy_gold_512.png"
            alt="Ratepanik Trophy"
            width={88}
            height={88}
            className="drop-shadow-[0_8px_24px_rgba(255,214,107,0.4)]"
            priority
          />
        </div>

        {/* Logo */}
        <h1
          className="text-[2.75rem] leading-tight font-extrabold text-center tracking-tight"
          style={{
            background: "linear-gradient(135deg, var(--rp-purple) 0%, var(--rp-pink) 50%, var(--rp-peach) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Ratepanik
        </h1>

        {/* Tagline */}
        <p className="mt-1 mb-8 text-[var(--rp-text-secondary)] text-base font-medium text-center">
          Wer falsch liegt, lebt gefährlich.
        </p>

        {/* Guest join card */}
        <div
          className="w-full p-6 mb-6"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-lg)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #FFE0D6 0%, #FFD0D0 100%)" }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="var(--rp-peach)">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--rp-text)]">Als Gast beitreten</h2>
              <p className="text-sm text-[var(--rp-text-secondary)]">Du hast einen Raum-Code?</p>
            </div>
          </div>

          <div className="mt-4 relative">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="C O D E"
              maxLength={6}
              className="w-full h-[52px] rounded-2xl border-2 px-5 text-lg font-bold tracking-[0.25em] text-center text-[var(--rp-text)] placeholder:text-gray-300 placeholder:tracking-[0.3em] placeholder:font-medium transition-all focus:outline-none"
              style={{
                borderColor: error ? "var(--rp-danger)" : "var(--rp-border)",
                background: "#FAFAFA",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--rp-focus-ring)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 124, 255, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? "var(--rp-danger)" : "var(--rp-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--rp-text-secondary)]">
              {code.length}/6
            </span>
          </div>

          {error && (
            <p className="mt-2 text-xs text-[var(--rp-danger)] font-medium">{error}</p>
          )}

          <button
            onClick={handleJoin}
            disabled={loading || code.length !== 6}
            className="mt-4 w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 disabled:shadow-none"
            style={{
              background: (loading || code.length !== 6)
                ? "var(--rp-peach)"
                : "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
              boxShadow: code.length === 6 ? "0 4px 16px rgba(255, 138, 113, 0.35)" : "none",
            }}
          >
            {loading ? "Tritt bei…" : "Beitreten"}
          </button>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[var(--rp-border)]" />
          <span className="text-sm text-[var(--rp-text-secondary)] font-medium">oder</span>
          <div className="flex-1 h-px bg-[var(--rp-border)]" />
        </div>

        {/* Register + Login buttons */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => router.push("/auth/signup")}
            className="h-[52px] flex items-center justify-center gap-2 rounded-[var(--rp-radius-pill)] text-base font-bold transition-all active:scale-[0.97]"
            style={{
              background: "var(--rp-purple-soft)",
              color: "#4A3ABA",
            }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Registrieren
          </button>
          <button
            onClick={() => router.push("/auth/login")}
            className="h-[52px] flex items-center justify-center gap-2 rounded-[var(--rp-radius-pill)] text-base font-bold transition-all active:scale-[0.97] border-2"
            style={{
              borderColor: "var(--rp-purple)",
              color: "var(--rp-purple)",
              background: "transparent",
            }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
            </svg>
            Anmelden
          </button>
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-2 text-sm text-[var(--rp-text-secondary)]">
          <span
            className="w-5 h-5 flex items-center justify-center rounded-full text-white text-xs"
            style={{ background: "var(--rp-success)" }}
          >
            ✓
          </span>
          <span>Als Gast brauchst du nur den Code vom Host.</span>
        </div>
      </div>
    </div>
  );
}
