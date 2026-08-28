"use client";

import { AVATAR_BG, avatarSrc, type AvatarId } from "@/lib/rp-assets";
import { useI18n } from "@/lib/i18n-context";

export type AvatarTileState = "locked" | "owned" | "equipped" | "selected";

interface AvatarTileProps {
  id: AvatarId;
  state: AvatarTileState;
  name?: string;
  price?: number;
  disabled?: boolean;
  onClick: () => void;
}

export function AvatarTile({
  id,
  state,
  name,
  price,
  disabled,
  onClick,
}: AvatarTileProps) {
  const ring =
    state === "equipped" || state === "selected" ? "var(--rp-nb-purple-deep)" : "transparent";
  const { t } = useI18n();

  return (
    <button
      type="button"
      aria-label={name ?? `Avatar ${id}`}
      aria-pressed={state === "equipped" || state === "selected"}
      disabled={disabled}
      onClick={onClick}
      className="relative mx-auto flex flex-col items-center gap-1.5"
    >
      <span
        className="relative flex items-center justify-center"
        style={{
          width: 88,
          height: 88,
          borderRadius: "var(--rp-nb-radius)",
          padding: 3,
          border: state === "equipped" || state === "selected"
            ? "3px solid var(--rp-nb-purple-deep)"
            : "3px solid var(--rp-nb-border-color)",
          boxShadow: state === "equipped" || state === "selected"
            ? "var(--rp-nb-shadow)"
            : "var(--rp-nb-shadow-sm)",
          background: ring,
          opacity: state === "locked" ? 0.72 : 1,
          transition: "transform 100ms ease, box-shadow 100ms ease",
          transform: state === "equipped" || state === "selected" ? "scale(1.05)" : "scale(1)",
        }}
      >
        <span
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "var(--rp-nb-radius-sm)",
            overflow: "hidden",
            background: AVATAR_BG[id],
            border: "2px solid var(--rp-nb-border-color)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarSrc(id, 256)}
            alt=""
            width={128}
            height={128}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </span>
        {state === "locked" && (
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "rgba(26, 26, 46, 0.4)",
              borderRadius: "var(--rp-nb-radius)",
            }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="#fff">
              <path d="M17 8h-1V6a4 4 0 10-8 0v2H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V10a2 2 0 00-2-2zm-6 0V6a2 2 0 114 0v2h-4z" />
            </svg>
          </span>
        )}
        {(state === "equipped" || state === "selected") && (
          <span
            className="absolute flex items-center justify-center"
            style={{
              width: 22,
              height: 22,
              borderRadius: "var(--rp-nb-radius-sm)",
              background: "var(--rp-nb-purple-deep)",
              border: "2px solid var(--rp-nb-border-color)",
              bottom: 2,
              right: 2,
            }}
            aria-hidden
          >
            <svg
              viewBox="0 0 24 24"
              width={12}
              height={12}
              fill="none"
              stroke="#fff"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </span>
      {name && (
        <span
          className="text-[10px] font-black leading-tight uppercase"
          style={{ color: "var(--rp-nb-text)" }}
        >
          {name}
        </span>
      )}
      {state === "locked" && price != null && price > 0 && (
        <span
          className="text-[10px] font-bold"
          style={{ color: "var(--rp-nb-text-secondary)" }}
        >
          Kaufen · {price} HC
        </span>
      )}
      {state === "equipped" && (
        <span className="text-[10px] font-bold uppercase" style={{ color: "var(--rp-nb-purple-deep)" }}>
          Angezogen
        </span>
      )}
      {state === "owned" && (
        <span className="text-[10px] font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
          {t.cosmetics.equip}
        </span>
      )}
    </button>
  );
}
