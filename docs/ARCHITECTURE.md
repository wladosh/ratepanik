# Ratepanik — Phase A Architecture

> Source of truth: `docs/PRODUCT.md` (PR #3) — especially §2 Begriffe, §3 Auth,
> §7 Lobby, §8 Match-Ablauf, §9 Spielmodi, §12 Phase A.

## Overview

Ratepanik is a real-time party quiz for 2–4 players competing across 4 mini-game
mode blocks per match. Phase A covers: authentication, lobby, match engine with
`number_guess` and `pick_correct` modes, theme selection, rank-based scoring, and
results (without Q&A spoilers).

---

## Key Concepts (§2 Begriffe)

| Begriff | Bedeutung |
|---------|-----------|
| **Spielmodus** | Mini-game type — HOW a round is played (`number_guess`, `pick_correct`) |
| **Thema** | Content category — WHAT you're quizzed on (Gaming, Geschichte, …) |
| **Block** | One mode-segment within a match; standard match = 4 blocks |
| **Prompt** | A single question/challenge scoped to mode + theme |
| **Match** | Complete game session: lobby → 4 blocks → results |
| **Room** | A match instance with code, host, and players |

Do NOT mix: "Wissenschaft" = **Thema**; "Zahlenraten" = **Spielmodus**.

---

## Authentication (§3)

| Method | Flow |
|--------|------|
| Google OAuth | Supabase redirect → `/auth/callback` |
| Email/Password | Sign-up with email confirmation |
| Guest (Anonymous) | `signInAnonymously()` — session-only, no persistence |

### Rights (§3.2)

| Action | Guest | Registered |
|--------|-------|------------|
| Join match | ✅ | ✅ |
| **Host** (create lobby) | ❌ | ✅ |
| Keep XP/Währung/Achievements | ❌ | ✅ |

### Host Gate

`rooms.host_user_id` stores the Supabase Auth uid. Client enforces via `useAuth().canHost`
(true only when `is_anonymous = false`). DB can additionally enforce via RLS on INSERT.

---

## Lobby (§7)

- Min 2, max 4 players
- Only registered users can host (create)
- Host starts when ≥ 2 players joined
- Match type MVP: **Standard** (4 blocks)

---

## Match Flow (§8)

```
Lobby → [Block 1] → [Block 2] → [Block 3] → [Block 4] → Results
         ↑                                                    │
         └──── each block: theme pick → mode rounds ──────────┘
```

1. **4 blocks** = 4 different Spielmodi (random, avoid repeat if possible)
2. **Before quiz-like blocks**: A player picks a **Thema** from 2 random options
3. After 4 blocks → **Results screen** (scores/ranking only, NO full Q&A — anti-spoiler)
4. Post-match: XP + Währung awarded (Phase B)
5. Tie = shared win

### Theme Selection Phase

Before blocks that need a theme (quiz-like modes), the game:
1. Sets `rooms.theme_vote_active = true`
2. Stores 2 random theme IDs in `match_blocks.theme_options`
3. Designated player (or host) picks one
4. Selected theme stored in `match_blocks.theme_id`
5. `rooms.theme_vote_active = false`, block begins

---

## Spielmodi — Phase A (§9)

### 9.1 Zahlenraten (`number_guess`)

- A numeric question is shown (from `prompts` with mode=`number_guess`)
- Each player submits a guess (`answers.numeric_answer`)
- Scoring: **absolute distance** from correct answer → **ranked** (closest=1st)
- Points by rank: `(total_players - rank) × 100` (last place = 0)
- **2 rounds per block** (`match_blocks.rounds_total = 2`)
- Achievement "exakter Treffer" — Phase B (schema has `distance` column ready)

### 9.2 Passendes wählen (`pick_correct`)

- Theme chosen from 2 options before this block starts
- 8 cards shown (4 correct, 4 wrong) — stored in `prompts.payload.cards` + `correct_indices`
- Players **take turns** tapping cards (tracked in `pick_correct_turns`)
- Continue until all 4 correct cards found
- Points: contribution-based (how many correct cards YOU found)

---

## Match State Synchronization

### Single Source of Truth: Database

| Table | Key Fields | Controls |
|-------|-----------|----------|
| `rooms` | `status`, `current_block_index`, `current_question_index`, `theme_vote_active` | Match lifecycle + progression |
| `match_blocks` | `mode`, `theme_id`, `current_round`, `is_complete` | Block state |
| `answers` | `numeric_answer`, `distance`, `rank`, `points_awarded` | Per-player per-round |
| `pick_correct_turns` | `card_index`, `is_correct`, `turn_order` | Turn-by-turn card taps |
| `match_scores` | `rank`, `total_points` | Per-block summary |

### Realtime Subscriptions

All clients subscribe via one Supabase Realtime channel per room:

```
channel: room-{room_id}
  ├── postgres_changes: rooms             (id=eq.{room_id})
  ├── postgres_changes: players           (room_id=eq.{room_id})
  ├── postgres_changes: answers           (room_id=eq.{room_id})
  ├── postgres_changes: match_blocks      (room_id=eq.{room_id})
  └── postgres_changes: pick_correct_turns (room_id=eq.{room_id})
```

### Host vs. Clients

| Action | Who | DB write |
|--------|-----|----------|
| Create room + generate blocks | Host | INSERT rooms, match_blocks |
| Start match | Host | UPDATE rooms.status → 'playing' |
| Offer theme options | Host/Engine | UPDATE match_blocks.theme_options |
| Select theme | Designated player | UPDATE match_blocks.theme_id |
| Advance round within block | Host | UPDATE match_blocks.current_round |
| Advance to next block | Host | UPDATE rooms.current_block_index |
| End match | Host | UPDATE rooms.status → 'finished' |
| Submit guess (number_guess) | Each player | INSERT answers |
| Tap card (pick_correct) | Active player | INSERT pick_correct_turns |

**Host = single writer** for progression. Other clients react to Realtime pushes.

### Client Phase Derivation

```
room.status == 'lobby'                  → LobbyScreen
room.theme_vote_active == true          → ThemePickScreen (2 options)
room.status == 'playing' + block state  →
  number_guess: QuestionScreen / RankRevealScreen
  pick_correct: CardGridScreen (whose turn?)
room.status == 'finished'               → ResultsScreen (rank only, no Q&A)
```

### Conflict Resolution

- Duplicate answers: UNIQUE on `(room_id, player_id, block_index, round_index)`
- Turn enforcement (pick_correct): app logic checks `turn_order` sequence
- Only host writes progression → non-host writes rejected
- Reconnect: full state re-fetch from DB + session recovery

---

## Schema Overview

```
rooms
  ├── players[]              (room_id)
  ├── match_blocks[]         (room_id, block_index 0..3)
  │     ├── theme_options[]  (2 random theme IDs offered)
  │     └── prompt_ids[]     (ordered prompts for this block)
  ├── answers[]              (room_id, per-player per-round)
  ├── pick_correct_turns[]   (room_id, turn-by-turn card taps)
  └── match_scores[]         (room_id, per-player per-block)

themes (8 seeded rows)
  └── prompts[]              (theme_id, mode, payload jsonb)
```

### Approved Themes (§10)

| Slug | Name (DE) |
|------|-----------|
| `gaming` | Gaming |
| `geschichte` | Geschichte |
| `wissenschaft-natur` | Wissenschaft & Natur |
| `sport` | Sport |
| `musik` | Musik |
| `film-serie` | Film & Serie |
| `reise-orte` | Reise & Orte |
| `alltag-peinlich` | Alltag & Peinlich |

### Prompt Payload Shapes

```jsonc
// number_guess
{ "answer": 384400, "unit": "km", "plausibility_note": "Erde–Mond Distanz" }

// pick_correct (8 cards, 4 correct — 0-based indices)
{ "cards": ["A","B","C","D","E","F","G","H"], "correct_indices": [0,2,5,7] }

// find_lie (future)
{ "statements": ["...","...","...","..."], "lie_index": 2 }

// order_it (future)
{ "items": ["A","B","C","D"], "correct_order": [2,0,3,1], "order_axis": "chronologisch" }
```

---

## Scoring (§9)

### `number_guess`
- Absolute distance: `|player_answer - correct_answer|`
- Players ranked by distance (closest = rank 1)
- Points: `(total_players - rank) × 100`
- Last place: 0 points
- 2 rounds per block → block score = sum of both rounds

### `pick_correct`
- Contribution-based: points ∝ how many of the 4 correct cards YOU found
- Formula: `(correct_found / 4) × 1000`

### Results Screen (§8)
- Shows final ranking + per-block scores
- Does **NOT** show full questions/answers (anti-spoiler for replay)
- Tie = shared win (geteilter Sieg)

---

## Phase A Scope (§12)

**Included:**
- Auth (Google, Email/PW, Guest) + host gate
- Lobby: 2–4 players, host starts at ≥2
- Match engine: 4 blocks, modes `number_guess` + `pick_correct`
- Theme pick from 2 random options before quiz-like blocks
- Rank-based scoring (no absolute point formulas for number_guess)
- Results without Q&A spoilers
- Content schema (themes seeded, prompts empty for Fragemeister)

**Schema allows but NOT built (Phase C):**
- Lootboxen / Cosmetics shop
- Additional modes (`find_lie`, `order_it` — schema supports them)

**Built after Phase A:**
- XP / Level / Hirncoins / Achievements (Phase B)
- Freunde: request/accept via username or friend_code, last-seen presence, invite by copying `/?join=CODE` (no chat)

---

## Technical Notes

- `mode` is stored as `text` (not Postgres enum) for forward compatibility
- `prompts.payload` is `jsonb` — validated at application level per mode
- Realtime uses Postgres Changes (not Broadcast) for consistency
- PR #2's `rooms`/`players`/`answers` tables are preserved; this migration only ADDs columns
- No force-push to main; draft PR only
