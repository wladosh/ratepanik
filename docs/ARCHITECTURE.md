# Ratepanik — Phase A Architecture

## Overview

Ratepanik is a real-time party quiz where 2–4 players compete across multiple mini-game
modes ("Spielmodi"). Phase A covers: authentication, match engine schema, and the
synchronization model for real-time multiplayer state.

---

## Key Concepts

| Term | Meaning |
|------|---------|
| **Spielmodus** | Mini-game type: `number_guess`, `pick_correct` (more in Phase B+) |
| **Thema** | Content category (e.g. Gaming, Geschichte) — orthogonal to mode |
| **Block** | One round-group within a match; a standard match has 4 blocks |
| **Prompt** | A single question/challenge scoped to a mode + theme |
| **Room** | A match instance; has a code, host, players, and blocks |

---

## Authentication Model

```
┌─────────────────────────────────────────────┐
│           Supabase Auth                      │
│                                              │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  │
│  │  Google   │  │  Email/PW │  │ Anonymous │  │
│  │  OAuth    │  │  (verify) │  │  (Guest)  │  │
│  └──────────┘  └───────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

- **Google OAuth**: Redirect flow via Supabase, callback at `/auth/callback`.
- **Email/Password**: Standard sign-up with email confirmation.
- **Guest (Anonymous)**: `signInAnonymously()` — can join rooms, cannot host.

### Host Gate Enforcement

Only users with `is_anonymous = false` may create (host) a room:

1. **Client-side**: `useAuth().canHost` controls whether the "Create Room" flow is
   accessible. Guests/unauthenticated users are redirected to `/auth/login`.
2. **Database-level**: `rooms.host_user_id` stores the Supabase Auth uid of the host.
   RLS or application logic verifies `auth.uid()` is non-anonymous before INSERT.

---

## Match State Synchronization

### Authoritative State

The **Supabase database** is the single source of truth. Key authoritative fields:

| Table | Field | What it controls |
|-------|-------|------------------|
| `rooms` | `status` | Match lifecycle: `lobby` → `playing` → `finished` |
| `rooms` | `current_block_index` | Which block is active |
| `rooms` | `current_question_index` | Which prompt within the active block |
| `match_blocks` | `is_complete`, `started_at` | Block-level progress |
| `answers` | all columns | Individual player submissions |
| `players` | `score` | Running total |
| `match_scores` | per-block totals | Block summary for results screen |

### Realtime Subscriptions

Clients subscribe to **Postgres Changes** via a single Supabase Realtime channel
per room:

```
channel: room-{room_id}
  ├── postgres_changes: rooms       (filter: id=eq.{room_id})
  ├── postgres_changes: players     (filter: room_id=eq.{room_id})
  ├── postgres_changes: answers     (filter: room_id=eq.{room_id})
  └── postgres_changes: match_blocks (filter: room_id=eq.{room_id})
```

All clients react to the same stream → UI stays in sync without polling.

### Host vs. Clients — Responsibility Matrix

| Action | Who | Mechanism |
|--------|-----|-----------|
| Create room + blocks | Host only | INSERT rooms, match_blocks |
| Start match | Host only | UPDATE rooms.status → 'playing' |
| Advance prompt within block | Host only | UPDATE rooms.current_question_index |
| Advance to next block | Host only | UPDATE rooms.current_block_index |
| End match | Host only | UPDATE rooms.status → 'finished' |
| Submit answer | Each player | INSERT answers (own player_id) |

The host is the **single writer** for progression fields. Other clients cannot
advance the game — they only read and react.

### Client Phase Derivation

Each client derives its UI screen from the Realtime-pushed DB state:

```
room.status == 'lobby'     → LobbyScreen
room.status == 'playing'   →
  all players answered?    → RevealScreen (auto-reveal)
  my answer submitted?     → WaitingScreen
  otherwise                → QuestionScreen
room.status == 'finished'  → FinalScreen (results without full Q&A)
```

### Conflict Resolution

- **Duplicate answers**: UNIQUE constraint prevents double-submission per prompt/player.
- **Race on advance**: Only host writes progression; non-host writes are rejected by RLS.
- **Stale subscriptions**: On reconnect, clients re-fetch full state (session recovery
  via `sessionStorage`).

---

## Schema Relationships

```
rooms
  ├── players[]           (room_id FK)
  ├── match_blocks[]      (room_id FK, ordered by block_index)
  │     └── prompts[]     (via prompt_ids uuid[] → prompts.id)
  ├── answers[]           (room_id FK)
  └── match_scores[]      (room_id FK, per-player per-block)

themes
  └── prompts[]           (theme_id FK)
```

---

## Scoring

### `pick_correct` mode
- Correct answer: 1000 base + up to 500 time bonus (linear decay over time limit)
- Wrong answer: 0 points
- Formula: `1000 + 500 × max(0, 1 − answer_time_ms / time_limit_ms)`

### `number_guess` mode
- Max: 1500 points (exact match)
- Linear decay: `1500 × (1 − |answer − correct| / (tolerance × 2))`
- Beyond 2× tolerance from correct: 0 points

Per-block scores are aggregated in `match_scores` for the results screen.
The results screen shows total/block scores but **not** the full questions/answers
(per product spec).

---

## Phase A Scope Boundaries

**Included:**
- Auth (Google, Email/PW, Guest) + host gate
- Schema: mode blocks, themes, prompts, scoring
- Realtime sync model (Postgres Changes)
- Results screen (scores only, no full Q&A replay)

**Excluded (Phase B/C):**
- Progression / Leveling
- Loot / Rewards
- Additional game modes beyond `number_guess` and `pick_correct`
- Content seeding (Fragemeister fills `themes`/`prompts` after owner approval)

---

## Assumptions (PRODUCT.md not found)

- No PRODUCT.md exists on any branch; rules followed from the task briefing.
- Existing `ratepanik_multiplayer_schema` (rooms/players/answers + RLS) is respected.
  This migration only ADDS columns/tables — never drops existing ones.
- Supabase project has Anonymous Auth enabled (for guest flow).
- Google OAuth provider configured in Supabase Dashboard → Auth → Providers.
- 2–4 players per room (enforced at application level, not schema constraint).
