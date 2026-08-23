"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LOCALE_STORAGE_KEY,
  messages,
  parseLocale,
  type Locale,
  type Messages,
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");

  useEffect(() => {
    const stored = parseLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
    setLocaleState(stored);
    document.documentElement.lang = stored;
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t: messages[locale] }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}

export function LoadingPulse({ minFullScreen = false }: { minFullScreen?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={`flex items-center justify-center ${minFullScreen ? "min-h-dvh" : "flex-1"}`}
      style={{ background: "var(--rp-bg-hero)" }}
    >
      <div className="text-lg font-medium animate-pulse" style={{ color: "var(--rp-text-secondary)" }}>
        {t.common.loading}
      </div>
    </div>
  );
}
