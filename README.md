# ratepanik
Party quiz game — web prototype (Next.js), later Flutter

## Docs

- [Produktplan (Product Doc)](docs/PRODUCT.md)
# Ratepanik 🎉

**Das Party-Quiz, bei dem jede Sekunde zählt!**

Ratepanik is a German-language multiplayer party quiz game. Players join a shared room from their own phones and compete to answer trivia questions quickly. Built with Next.js and Supabase Realtime.

## Game Flow

1. **Home Screen** — The host taps *Neues Spiel starten* and enters their name. Other players tap *Raum beitreten* and enter the 6-character room code + their name.
2. **Lobby** — The host sees the room code to share. Players appear live as they join. At least 2 players are required.
3. **Quiz Round** — A German trivia question appears with 4 answer options and a 15-second countdown timer. Faster correct answers earn more points (up to 1 500 per round).
4. **Reveal** — The correct answer is highlighted, showing who answered what and the points earned.
5. **Scoreboard** — A podium-style leaderboard shows the current standings.
6. **Repeat** — Steps 3–5 repeat for 8 questions.
7. **Final Screen** — The winner is crowned with a trophy. The host can start a new round or create an entirely new game.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend / Realtime**: [Supabase](https://supabase.com/) (Postgres, Realtime subscriptions)
- **State**: React Context driven by Supabase Realtime events
- **Questions**: Hardcoded pack of 30 German trivia questions

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with the required schema (see below)

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key (safe for the browser) |

Both values are available in your Supabase project dashboard under **Settings → API**.

### Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on one device to create a room, then open the same URL on another device (or phone on the same network) and join with the room code.

### Production Build

```bash
npm run build
npm start
```

## Supabase Schema

The following tables must exist in your Supabase project (with RLS enabled and permissive anon policies for the party prototype):

```sql
-- Rooms
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'lobby'
    check (status in ('lobby', 'playing', 'finished')),
  current_question_index int not null default 0,
  question_ids jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Players
create table players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id),
  display_name text not null,
  score int not null default 0,
  is_host boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Answers
create table answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id),
  player_id uuid not null references players(id),
  question_index int not null,
  choice_index int not null,
  is_correct boolean,
  answered_at timestamptz not null default now(),
  unique (room_id, player_id, question_index)
);
```

Realtime must be enabled for all three tables (Supabase Dashboard → Database → Replication).

## Multiplayer Architecture

- **Rooms** are created in Supabase with a unique 6-character join code.
- **Players** are rows in the `players` table, linked to a room.
- **Realtime subscriptions** on `rooms`, `players`, and `answers` keep all clients in sync.
- **Game flow** is driven by the host: starting the game writes `question_ids` and sets the room status to `playing`. Advancing questions increments `current_question_index`.
- **Answers** are written to the `answers` table as each player responds. Scores are calculated client-side (time-based) and updated on the player row.
- **Sub-phases** within a round (question → reveal → scoreboard) are managed locally on each client, triggered by answer counts and the host advancing the question index.
- **Session persistence** uses `sessionStorage` so a page refresh reconnects to the active room.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout (German lang, Inter font)
│   ├── page.tsx              # Entry point — wraps Game in GameProvider
│   └── globals.css           # Tailwind + custom animations
├── components/
│   ├── game.tsx              # Phase router + error toast
│   ├── home-screen.tsx       # Create room / join room
│   ├── lobby-screen.tsx      # Room code + live player list
│   ├── question-screen.tsx   # Question + timer + answer buttons
│   ├── reveal-screen.tsx     # Correct answer + point breakdown
│   ├── scoreboard-screen.tsx # Intermediate rankings
│   └── final-screen.tsx      # Winner celebration
└── lib/
    ├── supabase.ts           # Supabase client + DB types
    ├── game-context.tsx      # Multiplayer context (Realtime, actions, state)
    ├── game-store.ts         # Scoring logic
    └── questions.ts          # German trivia question pack
```

## Security Notes

- Only the **anon key** (public, read/write via RLS policies) is used in the browser. The `service_role` key is never exposed.
- RLS is enabled on all tables with permissive policies suitable for a party prototype.
- For a production deployment, add stricter RLS policies and consider authenticated sessions.
