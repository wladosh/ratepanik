# find_lie / order_it seed v1

German party-quiz pack for the two extra playable modes. **JSON is the source pack**; SQL is generated from it.

Does **not** deactivate existing `number_guess` / `pick_correct` (or the 4 live `find_lie` / `order_it` rows). No lootboxes.

## Counts (this batch)

64 prompts: 32 `find_lie` + 32 `order_it`. ≥4 per theme per mode.

| Thema | find_lie | order_it | leicht | mittel | schwer | Summe |
|-------|----------|----------|--------|--------|--------|-------|
| gaming | 4 | 4 | 3 | 3 | 2 | 8 |
| geschichte | 4 | 4 | 3 | 3 | 2 | 8 |
| wissenschaft-natur | 4 | 4 | 3 | 3 | 2 | 8 |
| sport | 4 | 4 | 3 | 3 | 2 | 8 |
| musik | 4 | 4 | 4 | 3 | 1 | 8 |
| film-serie | 4 | 4 | 4 | 3 | 1 | 8 |
| reise-orte | 4 | 4 | 3 | 4 | 1 | 8 |
| essen-trinken | — | — | — | — | — | — |
| tiere | — | — | — | — | — | — |
| **total** | **32** | **32** | **26** | **26** | **12** | **64** |

Difficulty mix: **40.6% leicht / 40.6% mittel / 18.8% schwer** (target ~40 / 40 / 20).

After apply, lobby mode-filter **Lüge** / **Reihenfolge** can draw from 8 themes (plus the 4 older seed rows).

## Files

| File | Role |
|------|------|
| `content/seed-find-lie-order-it-v1.json` | Pack (`theme_slug`, `mode`, `difficulty`, `prompt`, `hint`, `active`, `payload`) |
| `supabase/migrations/20260823_015_seed_find_lie_order_it.sql` | Idempotent `INSERT` (resolves `theme_id` via slug, `active = true`) |
| `supabase/seed/prompts_find_lie_order_it_v1.sql` | Same SQL, for running like `prompts_v1.sql` |
| `scripts/build-find-lie-order-it-seed.mjs` | Authoring + validation (`lie_index` 0–3, `correct_order` permutation) |

Payload shapes match `src/lib/content.ts`:

- `find_lie`: `{ statements: [4 strings], lie_index: 0–3 }`
- `order_it`: `{ items: [4 strings], correct_order: permutation of 0–3, order_axis: string }`

## Apply on Supabase project `uwbhgveknypqvrwazleq`

**A — Dashboard (simplest)**  
1. Open [SQL Editor](https://supabase.com/dashboard/project/uwbhgveknypqvrwazleq/sql/new) for project **Ratepanik** (`uwbhgveknypqvrwazleq`).  
2. Paste `supabase/migrations/20260823_015_seed_find_lie_order_it.sql`.  
3. Run. Idempotent (`ON CONFLICT (id) DO NOTHING`). Raises if a theme slug is missing (expects 64 rows).

**B — CLI** (needs db password / linked project):

```bash
# if the CLI is linked to uwbhgveknypqvrwazleq
npx supabase db query -f supabase/migrations/20260823_015_seed_find_lie_order_it.sql --linked
```

Or `npx supabase db push` to apply pending migrations.

**C — Sanity query after apply**

```sql
SELECT t.slug, p.mode, p.difficulty, count(*)
FROM prompts p
JOIN themes t ON t.id = p.theme_id
WHERE p.mode IN ('find_lie', 'order_it') AND p.active
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;
```

You should see the 64 new rows (ids `015e0823-4a15-4000-8000-…`) **plus** the 4 existing v1 rows.

## Rebuild after edits

```bash
node scripts/build-find-lie-order-it-seed.mjs
```

Regenerates JSON + both SQL files; fails if `lie_index` / `correct_order` are invalid.
