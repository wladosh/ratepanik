"use client";

import { AVATAR_BG, avatarSrc, type AvatarId } from "@/lib/rp-assets";

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
    state === "equipped" || state === "selected" ? "var(--rp-purple)" : "transparent";

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
          borderRadius: "50%",
          padding: 3,
          background: ring,
          opacity: state === "locked" ? 0.72 : 1,
          transition: "background 200ms ease, transform 150ms ease",
          transform: state === "equipped" || state === "selected" ? "scale(1.05)" : "scale(1)",
        }}
      >
        <span
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
            background: AVATAR_BG[id],
            border: state === "equipped" || state === "selected" ? "2px solid #fff" : "2px solid transparent",
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
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ background: "rgba(42,42,74,0.28)" }}
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
              borderRadius: "50%",
              background: "var(--rp-purple)",
              border: "2px solid #fff",
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
          className="text-[10px] font-bold leading-tight"
          style={{ color: "var(--rp-text)" }}
        >
          {name}
        </span>
      )}
      {state === "locked" && price != null && price > 0 && (
        <span
          className="text-[10px] font-semibold"
          style={{ color: "var(--rp-text-secondary)" }}
        >
          {price} HC
        </span>
      )}
      {state === "equipped" && (
        <span className="text-[10px] font-semibold" style={{ color: "var(--rp-purple)" }}>
          Angezogen
        </span>
      )}
      {state === "owned" && (
        <span className="text-[10px] font-semibold" style={{ color: "var(--rp-text-secondary)" }}>
          Anziehen
        </span>
      )}
    </button>
  );
}
