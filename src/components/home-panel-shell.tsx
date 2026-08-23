"use client";

import { useI18n } from "@/lib/i18n-context";

export function BackButton({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center justify-center min-w-11 min-h-11 w-11 h-11 rounded-full transition-all active:scale-90"
      style={{
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 2px 8px rgba(42,42,74,0.10)",
      }}
      aria-label={t.common.back}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="var(--rp-text)"
        strokeWidth="2"
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
      className="flex flex-1 flex-col"
      style={{
        background: "var(--rp-bg-hero)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <BackButton onBack={onBack} />
        <h1
          className="text-lg font-extrabold"
          style={{ color: "var(--rp-text)" }}
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
      className="flex flex-col items-center text-center px-4 py-10"
      style={{
        background: "var(--rp-bg-elevated)",
        borderRadius: "var(--rp-radius-lg)",
        boxShadow: "var(--rp-shadow-card)",
      }}
    >
      {kicker && (
        <p
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: "var(--rp-purple)" }}
        >
          {kicker}
        </p>
      )}
      <h2
        className="text-xl font-extrabold mb-2"
        style={{ color: "var(--rp-text)" }}
      >
        {headline}
      </h2>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--rp-text-secondary)" }}
      >
        {body}
      </p>
    </div>
  );
}
