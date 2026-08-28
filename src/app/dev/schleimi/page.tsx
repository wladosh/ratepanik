"use client";

/**
 * Dev-only QA grid for the parametric Schleimi system.
 * Renders every part and a matrix of combinations so misaligned anchors
 * are immediately visible. Not linked anywhere; 404s in production.
 */

import { notFound } from "next/navigation";
import { SCHLEIMI_ITEMS, type CosmeticSlot } from "@/lib/schleimi-catalog";
import { catalogItemView } from "@/lib/schleimi-layers";
import { CosmeticTileArt, SchleimiPreview } from "@/components/schleimi-preview";

const bySlot = (slot: CosmeticSlot) => SCHLEIMI_ITEMS.filter((item) => item.slot === slot);

function layersOf(shape: string, tint: string, eyes: string, mouth: string, bg?: string) {
  return {
    shape: catalogItemView(shape),
    body_tint: catalogItemView(tint),
    eyes: catalogItemView(eyes),
    mouth: catalogItemView(mouth),
    background: bg ? catalogItemView(bg) : null,
  };
}

export default function SchleimiQaPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const shapes = bySlot("shape");
  const tints = bySlot("body_tint");
  const eyes = bySlot("eyes");
  const mouths = bySlot("mouth");
  const bgs = bySlot("background");

  return (
    <main style={{ padding: 24, background: "#FDF6EC", minHeight: "100vh" }}>
      <h1 style={{ fontWeight: 900, fontSize: 24 }}>Schleimi QA</h1>

      <h2 style={{ fontWeight: 800, marginTop: 24 }}>Tiles (shop/customize)</h2>
      {[shapes, tints, eyes, mouths, bgs].map((group, i) => (
        <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
          {group.map((item) => (
            <div key={item.id} style={{ textAlign: "center", width: 76 }}>
              <CosmeticTileArt item={{ ...item, asset_path: "" }} size={72} />
              <div style={{ fontSize: 9, fontWeight: 700 }}>{item.name_de}</div>
            </div>
          ))}
        </div>
      ))}

      <h2 style={{ fontWeight: 800, marginTop: 32 }}>Every shape × every tint</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {shapes.map((shape) =>
          tints.map((tint) => (
            <SchleimiPreview
              key={`${shape.id}-${tint.id}`}
              layers={layersOf(shape.id, tint.id, "eyes_dots", "mouth_grin")}
              size={72}
            />
          )),
        )}
      </div>

      <h2 style={{ fontWeight: 800, marginTop: 32 }}>Every shape × every face part</h2>
      {shapes.map((shape) => (
        <div key={shape.id} style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800 }}>{shape.name_de}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {eyes.map((eye, i) => (
              <SchleimiPreview
                key={eye.id}
                layers={layersOf(
                  shape.id,
                  tints[i % tints.length].id,
                  eye.id,
                  mouths[i % mouths.length].id,
                  bgs[i % bgs.length].id,
                )}
                size={90}
              />
            ))}
          </div>
        </div>
      ))}

      <h2 style={{ fontWeight: 800, marginTop: 32 }}>Small sizes (28 / 40 / 52)</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {[28, 40, 52].map((size) =>
          shapes.slice(0, 4).map((shape) => (
            <SchleimiPreview
              key={`${size}-${shape.id}`}
              layers={layersOf(shape.id, "tint_sky", "eyes_happy", "mouth_smile", "bg_sunset")}
              size={size}
            />
          )),
        )}
      </div>
    </main>
  );
}
