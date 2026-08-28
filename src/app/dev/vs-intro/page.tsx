"use client";

/**
 * Dev-only loop of the fight-night VS intro (2p face-off / 4p roster).
 * Not linked anywhere; 404s in production.
 */

import { useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { guestLayers } from "@/lib/schleimi-layers";
import { SchleimiPreview } from "@/components/schleimi-preview";
import { VsIntroStage, type VsIntroFighter } from "@/components/vs-intro-screen";

const NAMES = ["Nia", "Kai", "Momo", "Luz"] as const;

function mockFighters(count: 2 | 4, size: number): VsIntroFighter[] {
  return NAMES.slice(0, count).map((name, index) => ({
    id: `dev-${name}`,
    displayName: name,
    role: index === 0 ? "you" : index === 1 ? "host" : "player",
    mascot: (
      <SchleimiPreview layers={guestLayers(`vs-dev-${name}`)} size={size} label={name} />
    ),
  }));
}

export default function VsIntroQaPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <VsIntroQa />;
}

function VsIntroQa() {
  const [count, setCount] = useState<2 | 4>(2);
  const [replay, setReplay] = useState(0);
  const size = count === 2 ? 150 : 82;
  const fighters = useMemo(() => mockFighters(count, size), [count, size]);

  return (
    <main
      className="min-h-dvh flex flex-1 flex-col"
      style={{ background: "var(--rp-nb-cream)" }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 12,
          paddingTop: "max(12px, calc(var(--ps-notch-inset, 0px) + 8px))",
          justifyContent: "center",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <button type="button" className="nb-btn" onClick={() => setCount(2)}>
          2p face-off
        </button>
        <button type="button" className="nb-btn" onClick={() => setCount(4)}>
          4p roster
        </button>
        <button type="button" className="nb-btn" onClick={() => setReplay((n) => n + 1)}>
          Replay
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <VsIntroStage
          key={`${count}-${replay}`}
          fighters={fighters}
          kicker="Es geht los"
          title="Versus"
          youLabel="Das bist du"
          hostLabel="Host"
          playerLabel="Spieler"
        />
      </div>
    </main>
  );
}
