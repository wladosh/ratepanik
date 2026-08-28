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
        className="nb-input w-full h-[48px] px-4 pr-12 text-sm"
      />
      <button
        type="button"
        onClick={() => setVisible((on) => !on)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black uppercase"
        style={{ color: "var(--rp-nb-text-secondary)" }}
        aria-label={visible ? t.login.hidePassword : t.login.showPassword}
      >
        {visible ? t.login.hidePassword : t.login.showPassword}
      </button>
    </div>
  );
}
