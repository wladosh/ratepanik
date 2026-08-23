"use client";

import { useState, useCallback } from "react";
import { AVATAR_IDS, type AvatarId } from "@/lib/rp-assets";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { AvatarTile } from "@/components/avatar-tile";

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
        const { data, error } = await supabase.rpc("grant_onboarding_avatar", {
          item_id: avatarId,
        });

        if (error) throw error;
        if (data && typeof data === "object" && "ok" in data && !data.ok) {
          throw new Error((data as { error?: string }).error ?? "save failed");
        }

        onDone();
      } catch {
        setSaveState("error");
      }
    },
    [onDone],
  );

  function handleWeiter() {
    if (!selected || saving) return;
    persistAvatar(selected);
  }

  function handleSpaeter() {
    if (saving) return;
    const supabase = createBrowserSupabase();
    supabase
      .rpc("update_own_profile", {
        new_avatar_id: "default_01",
        new_avatar_onboarding_done: false,
      })
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
          {AVATAR_IDS.map((id) => (
            <AvatarTile
              key={id}
              id={id}
              state={selected === id ? "selected" : "owned"}
              disabled={saving}
              onClick={() => {
                setSaveState("idle");
                setSelected(id);
              }}
            />
          ))}
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
