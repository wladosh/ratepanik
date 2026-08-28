"use client";

import { useI18n } from "@/lib/i18n-context";

export function BackButton({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onBack}
      className="nb-btn flex items-center justify-center min-w-11 min-h-11 w-11 h-11"
      style={{
        background: "var(--rp-nb-white)",
      }}
      aria-label={t.common.back}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="var(--rp-nb-black)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}

export function PanelShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex flex-1 flex-col"
      style={{
        background: "var(--rp-nb-cream)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <header className="relative flex items-center px-4 py-3">
        <BackButton onBack={onBack} />
        <h1
          className="nb-heading pointer-events-none absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-center text-lg"
        >
          {title}
        </h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-8">{children}</div>
    </div>
  );
}

export function EmptyCard({
  kicker,
  headline,
  body,
}: {
  kicker?: string;
  headline: string;
  body: string;
}) {
  return (
    <div
      className="nb-card flex flex-col items-center text-center px-4 py-10"
    >
      {kicker && (
        <p className="nb-kicker mb-2">
          {kicker}
        </p>
      )}
      <h2 className="nb-heading text-xl mb-2">
        {headline}
      </h2>
      <p
        className="text-sm leading-relaxed font-semibold"
        style={{ color: "var(--rp-nb-text-secondary)" }}
      >
        {body}
      </p>
    </div>
  );
}
