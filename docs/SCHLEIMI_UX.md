# Schleimi UX — PhoneShell

> Visual + copy spec only. Economy lives in [`docs/PHASE_C_SHOP.md`](PHASE_C_SHOP.md) and `open_lootbox`. **Do not roll rarity on the client.**
> Frame: **390×844** (desktop PhoneShell). Mobile: same layout, full bleed.
> Tone: peinlich-lustig, kurz, DE. No gore, no real-person jokes.

**Stand:** 2026-08-23

---

## 0. Slots (lock to MANIFEST)

IDs must match [`public/rp/schleimi/MANIFEST.json`](../public/rp/schleimi/MANIFEST.json):

| `slot` | Chip (DE) | Z-order (back → front) | Unequip? |
|--------|-----------|------------------------|----------|
| `body_tint` | Farbe | 1 | No |
| `face` | Gesicht | 2 | No |
| `extra` | Extra | 3 | Yes |
| `hat` | Hut | 4 | Yes |

Rarity IDs: `gewoehnlich` · `selten` · `legendaer`. UI labels always **Gewöhnlich / Selten / Legendär**.

Layer preview: `body_tint` → `face` → `extra` → `hat`. Missing PNG → rarity-tinted placeholder (never a broken-image icon).

---

## 1. Rarity color (contrast on pastel)

Pastel page (`--rp-bg` `#FFF8F5`, hero wash). Pills must not melt into cream.

| Rarity | Pill fill | Pill text | Soft wash (card / reveal) | Use |
|--------|-----------|-----------|---------------------------|-----|
| Gewöhnlich | `#6B7F9A` grey-blue | `#FFFFFF` | `#E8EEF4` | Common, calm, readable at 9px |
| Selten | `#C989FF` violet, 2px peach `#FF8A71` left cap | `#FFFFFF` | `#FDE8F4` | Peach + violet, still cute |
| Legendär | `#E8C547` gold | `#2A2A4A` ink | `#FFF6D6` | Gold fill + dark type (not white on yellow) |

Do not use cream-on-cream for Gewöhnlich. Do not use white type on gold. Focus ring stays `--rp-focus-ring` (`#8B7CFF`).

Tokens: [`src/lib/schleimi-ux.ts`](../src/lib/schleimi-ux.ts). Pill: [`src/components/rarity-badge.tsx`](../src/components/rarity-badge.tsx).

---

## 2. Shop (one card)

**Entry:** Home dashboard Shop · Hirncoin pill. Not the avatar (avatar → Customize).

**Chrome:** `PanelShell` title **Shop**. Horizontal padding **16**. Safe-area + notch already on the shell.

```
┌─────────────────────────────────┐  390
│ ←  Shop                         │  56 header
│ ┌──── balance bar ────────────┐ │
│ │ Hirncoins          🪙 420   │ │  48
│ └─────────────────────────────┘ │
│                                 │
│ ┌──────── Hirnkiste ──────────┐ │
│ │         [box art 160]       │ │
│ │      Hirnkiste              │ │
│ │      100  Hirncoins         │ │
│ │  Chancen                    │ │
│ │  70% G  ·  24% S  ·  6% L   │ │
│ │  [    Öffnen    ]           │ │  52 CTA
│ └─────────────────────────────┘ │
│ Meist banal. Manchmal goldig.   │  12px muted
└─────────────────────────────────┘
```

### 2.1 Card

- One SKU. Art: `lootbox.art_closed` / fallback existing loot-box PNG. Radius `--rp-radius-lg` (28).
- Title **Hirnkiste**. Price as number + word **Hirncoins** (icon 20px). Do not invent a second box.
- **Chancen** heading (11px bold, `--rp-text-secondary`), then three pills via `ChancenRow` (weights are **display-only**; Dev passes server `lootbox_defs`).

### 2.2 CTA

Buy-and-open is **one tap**. Not two steps.

| State | Label | Style |
|-------|--------|--------|
| Ready | **Öffnen** | Peach gradient pill, 52px height, full card width |
| First visit helper (under CTA, 11px) | Kaufen und sofort aufreißen. | Muted |
| Busy | **Wird geöffnet…** | Disabled, 50% opacity |
| Broke | **Öffnen** disabled + line **Zu peinlich leer. Spiel ein Match.** | Danger text, no second “Kaufen” that still opens |

Do not show a separate **Kaufen** button. “Kaufen” only appears in the helper line so it is obvious the tap spends Hirncoins.

### 2.3 Guest

EmptyCard + **Anmelden** (peach pill).

- Headline: **Gäste bleiben nacktschleimig.**
- Body: **Hirnkiste und Looks brauchen ein Konto. Hirncoins kommen aus Matches — nicht aus der Luft.**

### 2.4 Broke / error

RPC error string as-is under the card (server DE). No fake open animation if the RPC failed.

---

## 3. Reveal (inside PhoneShell)

**Container:** `position: absolute; inset: 0` on the Shop panel (the `ps-screen` is already `relative`). Never `position: fixed` on the desktop stage — that paints over the phone bezel.

Dim: `rgba(42,42,74,0.55)` + blur 8. Card max-width 100% − 40px, radius 28.

### 3.1 Three beats (first open only)

| Beat | Duration | Visual | Motion |
|------|----------|--------|--------|
| 1 Shake | 450ms | Closed box | `.rp-box-shake` (±8deg). `prefers-reduced-motion`: skip to beat 2 |
| 2 Rarity | 400ms | Open box + wash `RARITY_UX_SOFT[rarity]` + pill | Fade |
| 3 Item | until dismiss | Art 112, **name_de**, rarity pill | Fade |

Total first-run ~850ms before CTAs. **Do not start beats until `open_lootbox` returns.** No preview roll.

### 3.2 Skip after first

`localStorage` key `rp_schleimi_reveal_seen` (`"1"` after the first completed beat-3).

- Later opens: jump to beat 3 (item + name). No shake.
- During beat 1–2 (first time only): text button **Überspringen** (top-right of overlay).
- Reduced motion: same as skip (item immediately).

Helper: `shouldSkipReveal()` in `schleimi-ux.ts`. Presentational stage: [`schleimi-reveal-stage.tsx`](../src/components/schleimi-reveal-stage.tsx).

### 3.3 Duplicate vs new

| | Line under the name |
|--|---------------------|
| New | **Neu. Trag’s, solang dir nicht peinlich ist.** |
| Duplicate | **Schon da. Trost: +{n} Hirncoins.** |

Primary CTA **Anziehen** → Customize (same slot as the item). Secondary **Weiter shoppen** → dismiss.

---

## 4. Customize

**Entry:** Home avatar tap. Title **Schleimi**.

```
        [Schleimi stage 168]
     Farbe  Gesicht  Hut  Extra     ← 4 chips, slot ids
     [ 3-col tile grid, filtered ]
```

- Stage 168 CSS-px, centered. Layers per §0.
- Chips: height 40, pill. Active = `--rp-purple` + white type. Labels: **Farbe / Gesicht / Hut / Extra** (`SLOT_LABEL_DE`). `aria-pressed`.
- Grid: 3 columns, gap 12. Each owned tile: 72 art, rarity pill, `name_de` (10px, 2-line clamp). Equipped: 2px purple ring.
- Hat / Extra: first cell **Bloß** (unequip). Farbe / Gesicht: no empty cell.

Filter: `item.slot === activeSlot` **and owned**. Never show locked catalog items here (those live in the box).

---

## 5. Empty / duplicate / guest

| Surface | Condition | Copy |
|---------|-----------|------|
| Shop | Guest | §2.3 |
| Customize | Guest | Headline **Schleimi braucht Zuschauer.** Body **Als Gast bleibt der Schleim nackt. Anmelden, dann bleiben Hüte kleben.** CTA **Anmelden** |
| Customize | Slot owned-count 0 (shouldn’t happen for Farbe/Gesicht after starter) | **Noch leer. Die Hirnkiste ist schuld.** |
| Customize | Hut/Extra only “Bloß” | Fine; no extra empty-state card |
| Shop | Broke | §2.2 |
| Reveal | Duplicate | §3.3 |
| Any | Missing art | Placeholder blob/face/hat in the rarity wash — still show the pill |

---

## 6. Microcopy (DE, lock)

| Key | Copy |
|-----|------|
| Shop title | Shop |
| Box name | Hirnkiste |
| Chancen | Chancen |
| CTA | Öffnen |
| CTA busy | Wird geöffnet… |
| CTA helper | Kaufen und sofort aufreißen. |
| Broke | Zu peinlich leer. Spiel ein Match. |
| Fine print | Meist banal. Manchmal goldig. Kein Echtgeld. |
| Skip | Überspringen |
| New drop | Neu. Trag’s, solang dir nicht peinlich ist. |
| Duplicate | Schon da. Trost: +{n} Hirncoins. |
| Wear | Anziehen |
| Keep shopping | Weiter shoppen |
| Unequip | Bloß |
| Guest shop H | Gäste bleiben nacktschleimig. |
| Guest shop B | Hirnkiste und Looks brauchen ein Konto. Hirncoins kommen aus Matches — nicht aus der Luft. |
| Guest fit H | Schleimi braucht Zuschauer. |
| Guest fit B | Als Gast bleibt der Schleim nackt. Anmelden, dann bleiben Hüte kleben. |

English i18n may lag; **ship DE in the PhoneShell first.**

---

## 7. Motion & a11y

- Overlay `role="dialog"` `aria-modal="true"` `aria-labelledby` item name (beat 3) or “Hirnkiste”.
- CTA min height 44px. Chips 40px is OK (four-up).
- `prefers-reduced-motion: reduce` → no shake, no 850ms wait.
- Don’t announce each beat; one live region update on beat 3: `{rarity} — {name_de}`.

---

## 8. Dev mapping (existing)

| Spec | Code |
|------|------|
| Shop | [`shop-panel.tsx`](../src/components/shop-panel.tsx) — align copy/CTA/ChancenRow; keep RPC |
| Reveal | [`lootbox-reveal.tsx`](../src/components/lootbox-reveal.tsx) — swap innards to `SchleimiRevealStage` |
| Customize | [`schleimi-customize-panel.tsx`](../src/components/schleimi-customize-panel.tsx) |
| Preview | [`schleimi-preview.tsx`](../src/components/schleimi-preview.tsx) |
| Odds stub | [`chancen-row.tsx`](../src/components/chancen-row.tsx) |
| Tokens | [`schleimi-ux.ts`](../src/lib/schleimi-ux.ts) |

Out of scope here: prices, weights, RPCs, second SKU, Flutter.
