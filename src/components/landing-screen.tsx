"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter } from "next/navigation";
import { LandingHero } from "@/components/landing-hero";

export function LandingScreen({ initialCode }: { initialCode?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const sanitized = initialCode
    ? initialCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
    : "";
  const [code, setCode] = useState(sanitized);
  const joinBtnRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code.length === 6) joinBtnRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleJoin() {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setError(t.landing.codeError);
      return;
    }
    setLoading(true);
    setError(null);
    router.replace(`/?join=${trimmed}`);
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-8"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <LandingHero />

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
              <h2 className="text-lg font-bold text-[var(--rp-text)]">{t.landing.guestTitle}</h2>
              <p className="text-sm text-[var(--rp-text-secondary)]">{t.landing.guestSubtitle}</p>
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
            placeholder="ABC123"
              maxLength={6}
              className="w-full h-[52px] rounded-2xl border-2 px-5 text-lg font-bold tracking-[0.18em] text-center text-[var(--rp-text)] placeholder:text-gray-400 placeholder:tracking-[0.12em] placeholder:font-medium transition-all focus:outline-none"
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
            ref={joinBtnRef}
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
            {loading ? t.landing.joining : t.landing.join}
          </button>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[var(--rp-border)]" />
          <span className="text-sm text-[var(--rp-text-secondary)] font-medium">{t.common.or}</span>
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
            {t.landing.register}
          </button>
          <button
            onClick={() => router.push(code.length === 6 ? `/auth/login?join=${code}` : "/auth/login")}
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
            {t.landing.login}
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
          <span>{t.landing.footer}</span>
        </div>
      </div>
    </div>
  );
}
