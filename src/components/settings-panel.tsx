"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { LOCALES, type Locale } from "@/lib/i18n";
import { PanelShell } from "@/components/home-panel-shell";

export function SettingsPanel({ onBack }: { onBack: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const { isGuest, profile, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <PanelShell title={t.settings.title} onBack={onBack}>
      <div className="flex min-h-full flex-col">
        <section
          className="p-4 mb-3"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-md)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <h2
            className="text-sm font-extrabold mb-1"
            style={{ color: "var(--rp-text)" }}
          >
            {t.settings.language}
          </h2>
          <p
            className="text-xs leading-relaxed mb-3"
            style={{ color: "var(--rp-text-secondary)" }}
          >
            {t.settings.languageHint}
          </p>
          <div
            role="radiogroup"
            aria-label={t.settings.language}
            className="grid grid-cols-2 gap-1 p-1"
            style={{
              background: "rgba(42, 42, 74, 0.06)",
              borderRadius: 999,
            }}
          >
            {LOCALES.map((code: Locale) => {
              const selected = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setLocale(code)}
                  className="h-11 rounded-full text-sm font-bold transition-all"
                  style={{
                    background: selected ? "var(--rp-bg-elevated)" : "transparent",
                    color: selected ? "var(--rp-text)" : "var(--rp-text-secondary)",
                    boxShadow: selected ? "0 2px 8px rgba(42,42,74,0.10)" : "none",
                  }}
                >
                  {code === "de" ? t.settings.german : t.settings.english}
                </button>
              );
            })}
          </div>
        </section>

        <section
          className="p-4 mb-3"
          style={{
            background: "var(--rp-bg-elevated)",
            borderRadius: "var(--rp-radius-md)",
            boxShadow: "var(--rp-shadow-card)",
          }}
        >
          <h2
            className="text-sm font-extrabold mb-1"
            style={{ color: "var(--rp-text)" }}
          >
            {t.settings.account}
          </h2>
          {isGuest || !profile ? (
            <>
              <p className="text-sm font-semibold" style={{ color: "var(--rp-text)" }}>
                {t.settings.playingAsGuest}
              </p>
              <p
                className="text-xs leading-relaxed mt-1"
                style={{ color: "var(--rp-text-secondary)" }}
              >
                {t.settings.guestHint}
              </p>
            </>
          ) : (
            <>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--rp-text-secondary)" }}
              >
                {t.settings.signedInAs}
              </p>
              <p className="text-sm font-extrabold truncate" style={{ color: "var(--rp-text)" }}>
                {profile.username}
              </p>
            </>
          )}
        </section>

        <div className="mt-auto pt-8 pb-2">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="w-full h-12 rounded-[var(--rp-radius-pill)] text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-60"
            style={{
              color: "var(--rp-danger)",
              border: "1.5px solid rgba(255, 92, 122, 0.4)",
              background: "rgba(255, 92, 122, 0.06)",
            }}
          >
            {loggingOut ? t.settings.loggingOut : t.settings.logout}
          </button>
        </div>
      </div>
    </PanelShell>
  );
}
