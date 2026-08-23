# Schleimi asset bible (MVP)

Style lead for the **Schleimi** mascot pack. Original character only. Not a reskin of the old human bust avatars. No copyrighted characters, no real-person likeness, no gore.

## Character

**Schleimi** is a cute, brainy slime blob: round, glossy, a little too proud of knowing the answer. Vibe is a German living-room party quiz — *peinlich-lustig*, not corporate mascot, not horror goo. Think pretzel crumbs on the coffee table, party cone still on after midnight, someone shouting “das wusste ich!”. Personality lives in props and faces, not in a human body.

## Silhouette

- Round blob, **~70% of the 1024 canvas width**, sitting **slightly low** so hats have air above.
- Simple crown / top plane — hats sit cleanly, no spikes or ears on the base.
- **Faceless base:** no eyes, mouth, or blush painted on the body. Face is always a slot overlay.
- Default body file: `schleimi_base.png` (peach starter tint, same silhouette as every `body_tint`).

## Proportions & line weight

Thick shapes only. Outline equivalent **~14px at 1024** so the blob still reads at **128px** shop/preview and **48px** header avatars. Soft pastel 3D-ish blobs (rounded volume, one highlight, one contact shadow). Not photoreal. Not thin lineart. Not cel-shaded anime. If a stroke would vanish at 48px, it is too thin.

## Palette — Peinlich-Pastell (locked)

| Role | Hex |
| --- | --- |
| Peach (body A / B) | `#FF8A71` / `#F56B52` |
| Purple | `#8B7CFF` |
| Mint | `#6FCFB2` |
| Sky | `#7EB6FF` |
| Pink | `#FF7AB6` |
| Yellow | `#FFD66B` |
| Ink (outline) | `#2A2A4A` |
| Cream (UI ground) | `#FFF8F5` |

Accents stay inside this set. Legendary gold trim uses `#F5A623` (rarity, not a body fill unless the tint *is* gold).

## PhoneShell size rules

UI canvas is **390×844**. Avatars render **40–48px**. Shop tiles **88px**. Art **must read at 64–128px**. High contrast vs cream `#FFF8F5`. No tiny details, text, sparkles, or filigree that vanish at header size. Test every master at 48px before export.

## 1024 anchor grid

Transparent PNG, square **1024×1024**. Shared canvas for every slot so layers stack 1:1.

- Blob body: **~70% width**, centered horizontally, **bottom-weighted**.
- **Top ~18% empty** for hats (cone, crown, halo, pretzel).
- **Face plate:** center of the blob (eyes/mouth live here).
- **Extras:** around mid-face (glasses, blush, horn, plaster) — not on the hat plane.
- **No drop shadow baked into overlays.** Soft contact shadow is OK on **base / body_tint only**.

## Z-order (back → front)

1. `body_tint` **or** `schleimi_base`
2. `face`
3. `extra`
4. `hat`

**`body_tint` replaces the base body** — same silhouette, no face, no hat. Do not composite a tint *over* the peach base. Face / extra / hat are transparent overlays on the same 1024 canvas. Empty pixels must stay empty.

## Rarity

| ID | UI label | Color |
| --- | --- | --- |
| `gewoehnlich` | Gewöhnlich | Cream fill, lavender outline |
| `selten` | Selten | Purple `#8B7CFF` |
| `legendaer` | Legendär | Gold `#F5A623` |

Legendary may be shiny, glitch, or gold-leaf — **stays cute**. No skulls, no blood, no uncanny human faces.

## Export & naming

- Masters: **1024 PNG** (sRGB, alpha).
- Game sizes: same stem + `_256.png` / `_128.png`.
- Files: `slot_<slot>__<rarity>__<slug>.png`
  - Example: `slot_hat__gewoehnlich__party_cone.png`
- Item ids: `<slotPrefix>_<slug>` — e.g. `hat_party_cone`, `face_grin`, `tint_peach`, `extra_round_glasses`.
- Slots: `body_tint` \| `face` \| `hat` \| `extra`. Prefixes: `tint_` / `face_` / `hat_` / `extra_`.

## Do / don’t

**DO**

- Thick, readable shapes; one idea per item.
- German party props: pretzel, party cone, paper boat, shower cap, plaster, party horn.
- Keep overlays registered to the 1024 grid (hats in the top band, faces on the plate).

**DON’T**

- Photoreal slime, subsurface scatter, or photo textures.
- Human faces or busts. Schleimi is a blob.
- Reuse `rp_loot_box_*` (or any old loot-box) art.
- Tiny filigree, micro-patterns, or 1px sparkles.

## Lootbox SKU

One SKU: **`lootbox_basic`**.

| File | Role |
| --- | --- |
| `lootbox_closed.png` | Closed chest |
| `lootbox_open.png` | Open chest (same camera, lid up) |

Peach / purple **slime-world chest** — a gooey treasure box that belongs next to Schleimi, not a wooden RPG crate and not the old `rp_loot_box_*` assets. Same palette, same ~14px-at-1024 weight, readable at 88px shop tile.
