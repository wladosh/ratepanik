"use client";

import { useCallback, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { SchleimiPreview } from "@/components/schleimi-preview";
import {
  STARTER_EYES_ID,
  STARTER_MOUTH_ID,
  STARTER_SHAPE_ID,
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
        background: "var(--rp-nb-cream)",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset))",
      }}
    >
      <div className="flex w-full max-w-sm animate-fade-in flex-col items-center">
        <h1 className="nb-heading text-center text-[28px]">
          Das ist Schleimi
        </h1>
        <p className="mt-2 text-center text-sm font-medium" style={{ color: "var(--rp-nb-text-secondary)" }}>
          Dein Hirn-Schleim. Neue Formen, Farben und Gesichter kommen aus der Hirnkiste.
        </p>

        <div
          className="nb-card mt-8 flex items-center justify-center p-4"
          style={{ background: "var(--rp-nb-lilac)" }}
        >
          <SchleimiPreview
            layers={{
              shape: toView(STARTER_SHAPE_ID),
              body_tint: toView(STARTER_TINT_ID),
              eyes: toView(STARTER_EYES_ID),
              mouth: toView(STARTER_MOUTH_ID),
            }}
            size={180}
          />
        </div>

        {saveState === "error" && (
          <p className="mt-4 text-center text-sm font-bold" style={{ color: "var(--rp-nb-red)" }}>
            Konnte nicht speichern. Nochmal?
          </p>
        )}

        <button
          type="button"
          onClick={() => void persistStarter()}
          disabled={saving}
          className="nb-btn mt-8 h-[54px] w-full text-[17px] text-white"
          style={{
            maxWidth: 300,
            background: "var(--rp-nb-peach)",
            opacity: saving ? 0.55 : 1,
          }}
        >
          {saving ? "Speichern…" : "Weiter"}
        </button>

        <button
          type="button"
          onClick={handleSpaeter}
          disabled={saving}
          className="mt-3 mb-6 text-sm font-bold uppercase"
          style={{
            color: "var(--rp-nb-text-secondary)",
            opacity: saving ? 0.4 : 1,
          }}
        >
          Später
        </button>
      </div>
    </div>
  );
}
