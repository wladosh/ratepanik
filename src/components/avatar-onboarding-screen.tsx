"use client";

import { useCallback, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { SchleimiPreview } from "@/components/schleimi-preview";
import {
  STARTER_FACE_ID,
  STARTER_TINT_ID,
  catalogById,
  cosmeticAssetPath,
} from "@/lib/schleimi-catalog";
import type { CosmeticItemView } from "@/lib/use-cosmetics";

interface AvatarOnboardingScreenProps {
  userId: string;
  onDone: () => void;
}

type SaveState = "idle" | "saving" | "error";

function toView(id: string): CosmeticItemView | null {
  const item = catalogById().get(id);
  if (!item) return null;
  return {
    id: item.id,
    slot: item.slot,
    rarity: item.rarity,
    name_de: item.name_de,
    asset_path: cosmeticAssetPath(item),
    sort_order: item.sort_order,
  };
}

export function AvatarOnboardingScreen({
  userId,
  onDone,
}: AvatarOnboardingScreenProps) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saving = saveState === "saving";

  const persistStarter = useCallback(async () => {
    setSaveState("saving");
    try {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.rpc("grant_onboarding_avatar", {
        item_id: STARTER_TINT_ID,
      });
      if (error) throw error;
      if (data && typeof data === "object" && "ok" in data && !data.ok) {
        throw new Error((data as { error?: string }).error ?? "save failed");
      }
      onDone();
    } catch {
      setSaveState("error");
    }
  }, [onDone]);

  function handleSpaeter() {
    if (saving) return;
    localStorage.setItem(`rp_avatar_onboarding_${userId}`, "skipped");
    onDone();
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-5"
      style={{
        background: "var(--rp-bg)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="flex w-full max-w-sm animate-fade-in flex-col items-center">
        <h1
          className="text-center font-extrabold tracking-tight"
          style={{ fontSize: 28, lineHeight: 1.15, color: "var(--rp-text)" }}
        >
          Das ist Schleimi
        </h1>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          Dein Hirn-Schleim. Hüte und Gesichter kommen aus der Hirnkiste.
        </p>

        <div className="mt-8">
          <SchleimiPreview
            layers={{
              body_tint: toView(STARTER_TINT_ID),
              face: toView(STARTER_FACE_ID),
            }}
            size={180}
          />
        </div>

        {saveState === "error" && (
          <p className="mt-4 text-center text-sm font-medium" style={{ color: "var(--rp-danger)" }}>
            Konnte nicht speichern. Nochmal?
          </p>
        )}

        <button
          type="button"
          onClick={() => void persistStarter()}
          disabled={saving}
          className="mt-8 h-[54px] w-full rounded-[var(--rp-radius-pill)] text-[17px] font-bold text-white transition-all active:scale-[0.97]"
          style={{
            maxWidth: 300,
            background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? "Speichern…" : "Weiter"}
        </button>

        <button
          type="button"
          onClick={handleSpaeter}
          disabled={saving}
          className="mt-3 mb-6 text-sm font-medium"
          style={{ color: "var(--rp-text-secondary)", opacity: saving ? 0.4 : 1 }}
        >
          Später
        </button>
      </div>
    </div>
  );
}
