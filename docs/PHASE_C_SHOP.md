# Phase C MVP — Schleimi Lootbox Shop

> **⚠️ Partially superseded (2026-08-28, Schleimi 2.0):** slots are now `shape` · `body_tint` · `eyes` · `mouth` · `background`; `face`/`hat`/`extra` were retired (faces decomposed into eyes+mouth, hat/extra refunded as HC) via `supabase/migrations/20260829_021_schleimi_v2_svg.sql`. Crates: `lootbox_basic` · `lootbox_form` · `lootbox_gesicht` · `lootbox_hintergrund`. Economy mechanics below (pricing, duplicates, RPC flow) still apply.

> Design spec for Phase C. Implementation: `supabase/migrations/20260823_016_phase_c_lootbox.sql` + Shop/Customize UI.

**Stand:** 2026-08-23 (design)
**Depends on:** Schleimi art pack (base + 44 slot cosmetics + 1 lootbox SKU)
**Does not depend on:** Level-Nutzen / Party-Rang, Gast-Progress-Merge

---

## 1. Product lock

| Decision | Choice |
|----------|--------|
| Mascot | One: **Schleimi**. Players equip **slots**, not finished avatars. |
| Shop SKU | One: `lootbox_basic`. No `default_01`–`06` sales. Do not expand the old grid. |
| Open model | **Buy → instant open** (one tap). No unopened-box inventory in MVP. |
| Duplicates | **Convert to Hirncoins consolation.** Do not stack / mark duplicates in inventory. |
| Rarities (UI DE) | Gewöhnlich · Selten · Legendär |
| Slots | `body_tint` · `face` · `hat` · `extra` |
| Guest | Login CTA. No HC, no inventory, no open. |

Out of scope: real money, extra box tiers, trading, crafting, pity, match-end box drops, expanding Phase B avatars.

---

## 2. What exists today (Phase B)

- Catalog is **static TS**, not a table: [`src/lib/shop-catalog.ts`](../src/lib/shop-catalog.ts) — 6 looks, prices 0 / 40 / 60 / 80 / 100 / 140 HC. Must stay in sync with `avatar_shop_price()`.
- Ownership: `user_cosmetics (user_id, item_id, acquired_at)` with **CHECK** `item_id IN (default_01…06)`. Mutations **RPC-only** (no INSERT RLS).
- Buy: `purchase_avatar(item_id)` — `SELECT … FOR UPDATE` on `profiles.hirncoins`, debit, insert row.
- Equip: `equip_avatar(item_id)` writes **`profiles.avatar_id`** (single look, not slots).
- Starter: trigger `grant_starter_avatar` inserts `default_01`. Onboarding: `grant_onboarding_avatar`.
- UI: [`shop-panel.tsx`](../src/components/shop-panel.tsx) 3×2 `AvatarTile` grid. Home avatar tap **opens Shop**, not a dresser.
- Earn rate ([`src/lib/match-rewards.ts`](../src/lib/match-rewards.ts)): **20 HC base + place bonus** → 4th **20**, 3rd **25**, 2nd **30**, 1st **40** per match. Lootbox PNG exists as teaser art only (`LOOT_BOX_RARE_128`); no open RPC.

---

## 3. Economy

### 3.1 Price

**`lootbox_basic` = 100 Hirncoins.**

Rationale: sits on the old mid-grid (Mint 80 / Mango 100). One box ≈ **3 first-place matches** or **5 participation matches**. Cheap enough to feel reachable after a party night; expensive enough that it is a sink, not spam.

Tune later by editing `lootbox_defs.price_hc` — do not hardcode in the client.

### 3.2 Open model (locked)

One tap on the shop card:

1. Client calls `open_lootbox('lootbox_basic')`.
2. Server checks auth, `active`, balance; **locks** the profile row; debit 100 HC; weighted roll; grant or consolation; audit row; return payload.
3. Client plays reveal **from the RPC result** (never roll locally, never animate a fake win then confirm).

`open_lootbox`’s `box_id` argument is the **def id** (`lootbox_basic`), not an owned instance. Unopened inventory is deferred (would need `user_lootboxes` + a consume-open RPC if match-end ever grants boxes).

### 3.3 Drop table

Weights live on `lootbox_defs` as integers summing to **100**. Roll `random() * 100` server-side.

| Rarity | Weight | UI copy |
|--------|--------|---------|
| `gewoehnlich` | **70** | 70 % Gewöhnlich |
| `selten` | **24** | 24 % Selten |
| `legendaer` | **6** | 6 % Legendär |

Within the rolled rarity: **uniform** among `cosmetic_items` where `rarity = rolled` AND `active`. Catalog size assumed from the art spec: 24 / 12 / 8 (44 total).

Per-item odds (44-item catalog):

- one Gewöhnlich ≈ **2.92 %**
- one Selten ≈ **2.00 %**
- one Legendär ≈ **0.75 %**

No pity in MVP. Document in shop small-print. Soft pity (e.g. guarantee Legendär after 20 dry opens) is a later column on the def, not a client counter.

### 3.4 Duplicates (locked): HC consolation

Inventory is unique `(user_id, item_id)`. If the rolled item is already owned:

| Rolled rarity | Consolation |
|---------------|-------------|
| Gewöhnlich | **15 HC** |
| Selten | **35 HC** |
| Legendär | **60 HC** |

Store these on `lootbox_defs` (`dupe_hc_gewoehnlich` etc.) so they can be tuned without a code deploy.

Net on a duplicate: player spent 100, got 15/35/60 back. Not a full refund (would break the sink). Late-collection: ~70 % of opens become 15 HC — acceptable for a no-real-money party game; revisit if it feels like a tax.

RPC still returns the rolled `item_id` + `duplicate: true` so the reveal can say **„Schon da — +15 Hirncoins“**.

---

## 4. Schema sketch

```
cosmetic_items
  id            text PK          -- e.g. hat_party_cone (English slug)
  slot          text NOT NULL    -- body_tint | face | hat | extra
  rarity        text NOT NULL    -- gewoehnlich | selten | legendaer
  name_de       text NOT NULL
  asset_path    text NOT NULL    -- /rp/schleimi/slot_hat__gewoehnlich__party_cone.png
  active        boolean NOT NULL DEFAULT true
  sort_order    int NOT NULL DEFAULT 0
  created_at    timestamptz NOT NULL DEFAULT now()
  CHECK (slot IN (...)), CHECK (rarity IN (...))

lootbox_defs
  id                      text PK     -- lootbox_basic
  price_hc                int NOT NULL CHECK (price_hc > 0)
  weight_gewoehnlich      int NOT NULL
  weight_selten           int NOT NULL
  weight_legendaer        int NOT NULL
  dupe_hc_gewoehnlich     int NOT NULL
  dupe_hc_selten          int NOT NULL
  dupe_hc_legendaer       int NOT NULL
  art_closed              text NOT NULL
  art_open                text NOT NULL
  active                  boolean NOT NULL DEFAULT true
  CHECK (weight_* sum = 100)

user_cosmetics                          -- ALTER existing
  user_id       uuid FK profiles ON DELETE CASCADE
  item_id       text                 -- DROP default_01–06 CHECK
  acquired_at   timestamptz NOT NULL DEFAULT now()
  source        text NOT NULL DEFAULT 'lootbox'
                              -- starter | lootbox | consolation_skip | legacy_avatar
  PK (user_id, item_id)
  FK item_id → cosmetic_items(id)   -- NOT valid for leftover default_* rows
                                    -- see migration: split or nullable FK

user_loadout
  user_id    uuid FK profiles ON DELETE CASCADE
  slot       text NOT NULL           -- same enum as cosmetic_items.slot
  item_id    text NULL               -- NULL = empty slot (hat/extra)
  updated_at timestamptz NOT NULL DEFAULT now()
  PK (user_id, slot)
  FK item_id → cosmetic_items(id)
  -- CHECK: if item_id NOT NULL, cosmetic_items.slot = user_loadout.slot
  -- (enforce in equip RPC; optional DEFERRABLE trigger)

lootbox_opens                           -- audit / support; not shown in UI
  id              uuid PK
  user_id         uuid NOT NULL
  def_id          text NOT NULL
  price_paid      int NOT NULL
  rolled_rarity   text NOT NULL
  rolled_item_id  text NOT NULL
  duplicate       boolean NOT NULL
  consolation_hc  int NOT NULL DEFAULT 0
  created_at      timestamptz NOT NULL DEFAULT now()
```

**`profiles.avatar_id`:** keep through MVP. Friends / lobby / home still read it until a Schleimi compositor ships. Dual-read on the client:

- If `user_loadout` has a `body_tint` (or any equipped Schleimi slot) → composite Schleimi.
- Else → `avatarSrc(avatar_id)` (legacy bust).

Do not delete `avatar_id` in this phase.

**Legacy `default_01`–`06` rows:** keep in `user_cosmetics` with `source = 'legacy_avatar'`. They are **not** in `cosmetic_items`, so a FK from `user_cosmetics.item_id` → `cosmetic_items` cannot be strict. Options (pick in migration):

1. **No FK** on `user_cosmetics.item_id`; RPCs validate against `cosmetic_items` for new grants. Simplest.
2. Move legacy rows to `user_legacy_avatars` and add the FK. Cleaner, more work.

Recommend **(1)** for MVP.

Indexes: `cosmetic_items (slot, rarity) WHERE active`; `lootbox_opens (user_id, created_at DESC)`; existing `user_cosmetics_user_idx`.

---

## 5. RPC contracts

All `SECURITY DEFINER`, `SET search_path = public`, `auth.uid()` required, **EXECUTE TO authenticated only**. Mutations stay RPC-only (no INSERT/UPDATE/DELETE policies on inventory/loadout/opens). Debit path: `SELECT hirncoins FROM profiles WHERE id = uid FOR UPDATE`.

### 5.1 `open_lootbox(box_id text) → jsonb`

Buy + roll + grant in one transaction. `box_id` = def id.

**Errors (same DE style as Phase B):** `Nicht angemeldet` · `Unbekannte Box` · `Box inaktiv` · `Nicht genug Hirncoins` · `Kein Profil` · `Katalog leer`.

**Success (new item):**

```json
{
  "ok": true,
  "duplicate": false,
  "item_id": "hat_party_cone",
  "slot": "hat",
  "rarity": "gewoehnlich",
  "name_de": "Partyhütchen",
  "asset_path": "/rp/schleimi/slot_hat__gewoehnlich__party_cone.png",
  "hirncoins": 420,
  "consolation_hc": 0
}
```

**Success (duplicate):** same shape with `"duplicate": true`, `"consolation_hc": 15`, `hirncoins` = balance after debit + consolation (net −85 on a gewöhnlich dupe).

Roll algorithm (server only):

1. Load def; abort if missing/inactive.
2. Debit `price_hc` (fail if `hirncoins < price`).
3. `r = floor(random() * 100)`; map 0–69 G, 70–93 S, 94–99 L (if weights 70/24/6).
4. `SELECT id FROM cosmetic_items WHERE rarity = r AND active ORDER BY random() LIMIT 1`.
5. If owned → add consolation, skip insert, `duplicate = true`.
6. Else insert `user_cosmetics (…, source = 'lootbox')`.
7. Insert `lootbox_opens`.
8. Return payload. **Never auto-equip.**

### 5.2 `equip_slot(slot text, item_id text) → jsonb`

- `item_id` null/empty → unequip that slot (allowed for `hat` and `extra`; **not** for `body_tint` / `face` — always clothed).
- Must own `item_id`. Must match `cosmetic_items.slot`.
- Upsert `user_loadout`.
- Return `{ ok, slot, item_id }`.

### 5.3 `get_loadout() → jsonb` (optional; or client SELECT)

Return the four slots + joined item rows. Client can instead:

```
select slot, item_id from user_loadout where user_id = auth.uid()
```

plus `cosmetic_items` (readable). Prefer **direct SELECT** under RLS to avoid an extra RPC.

### 5.4 Deprecated Phase B RPCs

| RPC | Phase C |
|-----|---------|
| `purchase_avatar` | Keep, return `{ ok: false, error: 'Shop umgestellt' }` so old clients don’t debit. |
| `equip_avatar` | Keep for one release so leftover UI doesn’t 500; stop calling from new Shop. |
| `grant_onboarding_avatar` | Retarget: ignore `item_id`, grant starter Schleimi loadout, set `avatar_onboarding_done`. |
| `avatar_shop_price` | Unused by new shop; leave or drop in a follow-up. |
| `grant_starter_avatar` trigger | Extend: also insert starter cosmetics + four `user_loadout` rows. |

### 5.5 Starter grant

On profile insert (and backfill for existing users):

| Slot | Item | Notes |
|------|------|--------|
| `body_tint` | `tint_peach` (Pfirsich) | Always equipped |
| `face` | `face_grin` (Grinser) | Always equipped |
| `hat` | `null` | Empty |
| `extra` | `null` | Empty |

`source = 'starter'`. Do **not** grant the rest of the Gewöhnlich set.

---

## 6. RLS

| Table | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|----------------------|
| `cosmetic_items` | `authenticated` (all rows, or `active` only via view) | none — seed/migration |
| `lootbox_defs` | `authenticated` (active defs; odds/price are public) | none |
| `user_cosmetics` | `auth.uid() = user_id` | none — RPC |
| `user_loadout` | **own** always; **others** readable by `authenticated` (lobby/friends must render Schleimi) | none — RPC |
| `lootbox_opens` | `auth.uid() = user_id` (optional; support can use service role) | none — RPC |
| `profiles.hirncoins` | unchanged: client cannot write; RPCs debit | existing trigger |

Anon/guest: no EXECUTE on `open_lootbox` / `equip_slot`. Shop UI never calls them.

**Do not** expose other people’s full `user_cosmetics` (collection is private). Equipped slots are public the same way `avatar_id` is today (`use-friends` already selects `avatar_id`).

---

## 7. UX (PhoneShell, 390-wide)

### 7.1 Shop (replace grid)

[`ShopPanel`](../src/components/shop-panel.tsx) becomes **one product**:

- Hirncoin balance row (keep).
- Card: `lootbox_closed` art, name **Hirnkiste**, **100**, odds teaser `70 % · 24 % · 6 %`.
- CTA: **Öffnen** (not Kaufen then Anziehen).
- Disabled + copy if `hirncoins < price`.
- Guest: existing EmptyCard + Anmelden (update copy: no Avatare).

### 7.2 Reveal (inside PhoneShell)

After RPC resolves, overlay on the shop (fixed, `ps-screen` bounds):

1. Closed box (~400 ms)
2. Open art + rarity flash (cream / purple / gold)
3. Item icon + `name_de` + rarity badge
4. If duplicate: consolation chip
5. Dismiss → shop; **Inventar** secondary button

No client-side roll. If RPC fails, no overlay.

### 7.3 Inventar / Schleimi Customize

Home **avatar tap** currently opens Shop — **retarget to Customize**. Hirncoin pill / Shop dashboard card still open Shop.

Customize panel:

- Center: layered preview (`body_tint` → `face` → `extra` → `hat`), 128–192 CSS px.
- Four slot tabs. Grid of **owned** items for that slot + empty tile for hat/extra.
- Rarity badge on every tile (DE label + color).
- Tap owned → `equip_slot`. Unequip only hat/extra.

Guest: login CTA.

### 7.4 Surfaces that still show a face

Home 48 px, lobby, friends 40 px, join stack ~36 px: composite at **128 source**, CSS-sized down. Until compositor exists, keep `avatarSrc(avatar_id)` so Phase C can ship data/shop before art wiring.

Onboarding grid: replace with “Das ist Schleimi” + **Weiter** (starter loadout). Optional: 3 starter tints later — not MVP.

---

## 8. Migration plan

Single migration `supabase/migrations/20260823_016_phase_c_lootbox.sql` (timestamp when implementing), then seed.

1. Create `cosmetic_items`, `lootbox_defs`, `user_loadout`, `lootbox_opens`.
2. Seed `cosmetic_items` from `MANIFEST.json` (script → SQL, same ids as art). Seed `lootbox_basic` weights/price/dupe HC/art paths.
3. `ALTER user_cosmetics`: drop `user_cosmetics_avatar_id` CHECK; add `source text NOT NULL DEFAULT 'legacy_avatar'`; backfill existing rows `legacy_avatar`.
4. RPCs: `open_lootbox`, `equip_slot`; stub `purchase_avatar`; extend starter trigger + backfill loadout for all `profiles`.
5. Grants + RLS as §6.
6. **Do not** drop `profiles.avatar_id` or delete `default_*` rows.

Catalog updates after art changes: new migration `INSERT … ON CONFLICT DO UPDATE` (or re-run seed). Client must not be the catalog owner (today’s `shop-catalog.ts` dual-write problem).

Apply locally (`supabase db reset` / `migration up`) before production. Remote apply only after MANIFEST files exist on the deployed `public/rp/schleimi/` path.

---

## 9. File touch list (implementation PR, not now)

**Do not implement in the art-only pack.**

| Area | Files |
|------|--------|
| Schema | `supabase/migrations/20260823_016_phase_c_lootbox.sql`; seed from MANIFEST |
| Types | [`src/lib/supabase.ts`](../src/lib/supabase.ts) (`DbCosmeticItem`, `DbUserLoadout`, extend `DbUserCosmetic`) |
| Data access | Replace [`src/lib/use-cosmetics.ts`](../src/lib/use-cosmetics.ts); retire buy/equip avatar helpers |
| Catalog | [`src/lib/shop-catalog.ts`](../src/lib/shop-catalog.ts) → lootbox def fetch or thin constants; [`src/lib/rp-assets.ts`](../src/lib/rp-assets.ts) Schleimi paths + compositor helper |
| Shop UX | [`src/components/shop-panel.tsx`](../src/components/shop-panel.tsx), new `lootbox-reveal.tsx`; stop using [`avatar-tile.tsx`](../src/components/avatar-tile.tsx) in shop |
| Customize | New `schleimi-customize-panel.tsx` (+ layer preview); [`home-panels.tsx`](../src/components/home-panels.tsx) panel id; [`home-screen.tsx`](../src/components/home-screen.tsx) avatar tap |
| Onboarding | [`avatar-onboarding-screen.tsx`](../src/components/avatar-onboarding-screen.tsx) |
| Display | `home-screen`, `friends-panel`, lobby, join cards — composite when loadout present |
| Copy | [`src/lib/i18n.ts`](../src/lib/i18n.ts) shop/inventar/rarity/odds |
| Dashboard teaser | [`home-dashboard-cards.tsx`](../src/components/home-dashboard-cards.tsx) — already uses lootbox art |
| Docs | This file; [`docs/PRODUCT.md`](PRODUCT.md) §4, §5.2–5.3, §12, §13; [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) shop bullet |
| Tests | RPC-oriented tests if a SQL test harness exists; client drop-table display tests |

**Leave alone:** match engine, `grant_match_rewards`, friends graph, `default_*` PNGs (temporary fallback).

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Art pack / MANIFEST not on `main` | Do not apply the catalog migration until files exist. Shop 404s otherwise. |
| Dual avatar era | Dual-read renderer. Keep `avatar_id`. Don’t force-migrate old looks into slots. |
| `user_cosmetics` CHECK + no FK | Drop CHECK first; validate new grants in RPC only. Legacy ids remain. |
| Duplicate tax after collecting G | Tune `dupe_hc_*`. Optional later: reroll unowned if any remain in that rarity. |
| No pity → dry Legendär | Show odds. Add pity on `lootbox_defs` if support tickets appear. |
| Old app tab still calls `purchase_avatar` | Stub the RPC; don’t delete until a release later. |
| Others’ Schleimi in lobby | `user_loadout` SELECT for `authenticated`, not only own. Inventory stays private. |
| Composite at 36–48 px | Thick shapes in art spec; 128 source. QA strip before wiring friends list. |
| Client-side “preview roll” | Forbidden. Reveal uses RPC payload only. |
| `FOR UPDATE` + HC trigger | Same pattern as `purchase_avatar`; don’t let the client UPDATE `hirncoins`. |
| Seed drift vs MANIFEST | Generate SQL from JSON in CI or a `scripts/` seed; ids must match `item.id`. |
| Onboarding still a 6-grid | Replace in the same UX PR or players will buy nothing and stay on busts. |

---

## 11. Done-when (implementation)

- Shop shows one Hirnkiste at 100 HC; one tap debit + server roll.
- Duplicates credit consolation; inventory stays unique.
- Customize equips per slot; guests see login only.
- `purchase_avatar` cannot buy `default_02`–`06` anymore.
- `lootbox_opens` row per open; weights not sent as the roll source from the client.
- PRODUCT.md Phase C unmarked HOLD for this slice only (Level-Nutzen still HOLD).
