"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";

export function PasswordField({
  value,
  onChange,
  placeholder,
  minLength,
  autoComplete = "current-password",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minLength?: number;
  autoComplete?: string;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className="w-full h-[48px] rounded-[var(--rp-radius-md)] border-2 px-4 pr-12 text-sm font-medium transition-all focus:outline-none"
        style={{
          borderColor: "var(--rp-border)",
          background: "var(--rp-bg-elevated)",
          color: "var(--rp-text)",
        }}
        onFocus={(event) => {
          event.currentTarget.style.borderColor = "var(--rp-focus-ring)";
          event.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 124, 255, 0.15)";
        }}
        onBlur={(event) => {
          event.currentTarget.style.borderColor = "var(--rp-border)";
          event.currentTarget.style.boxShadow = "none";
        }}
      />
      <button
        type="button"
        onClick={() => setVisible((on) => !on)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
        style={{ color: "var(--rp-text-secondary)" }}
        aria-label={visible ? t.login.hidePassword : t.login.showPassword}
      >
        {visible ? t.login.hidePassword : t.login.showPassword}
      </button>
    </div>
  );
}
