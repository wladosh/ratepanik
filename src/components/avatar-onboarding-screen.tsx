"use client";

import { useState, useCallback } from "react";
import { AVATAR_IDS, avatarSrc, type AvatarId } from "@/lib/rp-assets";
import { createBrowserSupabase } from "@/lib/supabase/client";

interface AvatarOnboardingScreenProps {
  userId: string;
  onDone: () => void;
}

type SaveState = "idle" | "saving" | "error";

export function AvatarOnboardingScreen({
  userId,
  onDone,
}: AvatarOnboardingScreenProps) {
  const [selected, setSelected] = useState<AvatarId | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const saving = saveState === "saving";

  const persistAvatar = useCallback(
    async (avatarId: AvatarId) => {
      setSaveState("saving");
      try {
        const supabase = createBrowserSupabase();
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_id: avatarId })
          .eq("id", userId);

        if (error) throw error;

        localStorage.setItem(`rp_avatar_onboarding_${userId}`, "done");
        onDone();
      } catch {
        setSaveState("error");
      }
    },
    [userId, onDone],
  );

  function handleWeiter() {
    if (!selected || saving) return;
    persistAvatar(selected);
  }

  function handleSpaeter() {
    if (saving) return;
    const supabase = createBrowserSupabase();
    supabase
      .from("profiles")
      .update({ avatar_id: "default_01" })
      .eq("id", userId)
      .then(() => {});
    localStorage.setItem(`rp_avatar_onboarding_${userId}`, "skipped");
    onDone();
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-5"
      style={{
        background: "var(--rp-bg)",
        paddingTop:
          "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="w-full max-w-sm animate-fade-in flex flex-col items-center">
        {/* Title */}
        <h1
          className="text-center font-extrabold tracking-tight"
          style={{
            fontSize: 28,
            lineHeight: 1.15,
            color: "var(--rp-text)",
          }}
        >
          Wähle deinen Avatar
        </h1>

        <p
          className="mt-2 text-center text-sm"
          style={{ color: "var(--rp-text-secondary)" }}
        >
          Du kannst später mehr freischalten.
        </p>

        {/* Avatar grid — 3 × 2 */}
        <div
          className="mt-8 grid gap-4"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            width: "100%",
            maxWidth: 300,
            opacity: saving ? 0.5 : 1,
            pointerEvents: saving ? "none" : "auto",
            transition: "opacity 200ms ease",
          }}
        >
          {AVATAR_IDS.map((id) => {
            const isSelected = selected === id;
            return (
              <button
                key={id}
                type="button"
                aria-label={`Avatar ${id}`}
                aria-pressed={isSelected}
                onClick={() => { setSaveState("idle"); setSelected(id); }}
                className="relative mx-auto flex items-center justify-center"
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  padding: 3,
                  background: isSelected
                    ? "var(--rp-purple)"
                    : "transparent",
                  transition: "background 200ms ease, transform 150ms ease",
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                }}
              >
                {/* Inner circle with avatar image */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: avatarBg(id),
                    border: isSelected
                      ? "2px solid #fff"
                      : "2px solid transparent",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarSrc(id, 256)}
                    alt={`Avatar ${id}`}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>

                {/* Checkmark badge */}
                {isSelected && (
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
                    aria-hidden="true"
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
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {saveState === "error" && (
          <p
            className="mt-4 text-center text-sm font-medium"
            style={{ color: "var(--rp-danger)" }}
          >
            Konnte nicht speichern. Nochmal?
          </p>
        )}

        {/* CTA — Weiter */}
        <button
          type="button"
          onClick={handleWeiter}
          disabled={!selected || saving}
          className="mt-8 w-full h-[54px] rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97]"
          style={{
            maxWidth: 300,
            background:
              "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
            opacity: !selected || saving ? 0.5 : 1,
          }}
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Speichern…
            </span>
          ) : (
            "Weiter"
          )}
        </button>

        {/* Skip — Später */}
        <button
          type="button"
          onClick={handleSpaeter}
          disabled={saving}
          className="mt-3 mb-6 text-sm font-medium transition-opacity"
          style={{
            color: "var(--rp-text-secondary)",
            opacity: saving ? 0.4 : 1,
          }}
        >
          Später
        </button>
      </div>
    </div>
  );
}

function avatarBg(id: AvatarId): string {
  const bgs: Record<AvatarId, string> = {
    default_01: "#FFF0E8",
    default_02: "#EDE6FF",
    default_03: "#FFE8F0",
    default_04: "#E8F5E8",
    default_05: "#FFF5E8",
    default_06: "#E0EEFF",
  };
  return bgs[id];
}
