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
        <section className="nb-card p-4 mb-3">
          <h2 className="text-sm font-black uppercase mb-1" style={{ color: "var(--rp-nb-text)" }}>
            {t.settings.language}
          </h2>
          <p className="text-xs leading-relaxed mb-3 font-semibold" style={{ color: "var(--rp-nb-text-secondary)" }}>
            {t.settings.languageHint}
          </p>
          <div
            role="radiogroup"
            aria-label={t.settings.language}
            className="grid grid-cols-2 gap-1 p-1"
            style={{
              background: "var(--rp-nb-cream)",
              border: "2px solid var(--rp-nb-black)",
              borderRadius: "var(--rp-nb-radius)",
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
                  className="h-11 text-sm font-black uppercase transition-all"
                  style={{
                    background: selected ? "var(--rp-nb-purple-deep)" : "transparent",
                    color: selected ? "var(--rp-nb-white)" : "var(--rp-nb-text-secondary)",
                    borderRadius: "var(--rp-nb-radius)",
                    boxShadow: selected ? "var(--rp-nb-shadow-sm)" : "none",
                    border: selected ? "2px solid var(--rp-nb-black)" : "2px solid transparent",
                  }}
                >
                  {code === "de" ? t.settings.german : t.settings.english}
                </button>
              );
            })}
          </div>
        </section>

        <section className="nb-card p-4 mb-3">
          <h2 className="text-sm font-black uppercase mb-1" style={{ color: "var(--rp-nb-text)" }}>
            {t.settings.account}
          </h2>
          {isGuest || !profile ? (
            <>
              <p className="text-sm font-bold" style={{ color: "var(--rp-nb-text)" }}>
                {t.settings.playingAsGuest}
              </p>
              <p className="text-xs leading-relaxed mt-1 font-semibold" style={{ color: "var(--rp-nb-text-secondary)" }}>
                {t.settings.guestHint}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
                {t.settings.signedInAs}
              </p>
              <p className="text-sm font-black truncate" style={{ color: "var(--rp-nb-text)" }}>
                {profile.username}
              </p>
            </>
          )}
        </section>

        <div className="mt-6 pt-2">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="nb-btn w-full h-12 text-sm"
            style={{
              color: "var(--rp-nb-white)",
              background: "var(--rp-nb-red)",
            }}
          >
            {loggingOut ? t.settings.loggingOut : t.settings.logout}
          </button>
        </div>
      </div>
    </PanelShell>
  );
}
