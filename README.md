# Ratepanik 🎉

**Das Party-Quiz, bei dem jede Sekunde zählt!**

Ratepanik is a German-language party quiz game designed for friends playing together on phones and laptops. This is the web prototype built with Next.js — a Flutter app will follow later.

## Game Flow

1. **Home Screen** — The host taps *Neues Spiel starten* and enters their name.
2. **Lobby** — A 4-character room code is generated. Other players can be added by name, or bots can be added for testing. At least 2 players are required.
3. **Quiz Round** — A German trivia question appears with 4 answer options and a 15-second countdown timer. Faster correct answers earn more points (up to 1 500 per round).
4. **Reveal** — The correct answer is highlighted, showing who answered what and the points earned.
5. **Scoreboard** — A podium-style leaderboard shows the current standings.
6. **Repeat** — Steps 3–5 repeat for 8 questions.
7. **Final Screen** — The winner is crowned with a trophy. Players can start a new round or create an entirely new game.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State**: React Context + `useReducer` (client-only, in-memory)
- **Questions**: Hardcoded pack of 30 German trivia questions

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To run a production build:

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (German lang, Inter font)
│   ├── page.tsx            # Entry point — wraps Game in GameProvider
│   └── globals.css         # Tailwind + custom animations
├── components/
│   ├── game.tsx            # Phase router
│   ├── home-screen.tsx     # Landing / create game
│   ├── lobby-screen.tsx    # Room code + player list
│   ├── question-screen.tsx # Question + timer + answer buttons
│   ├── reveal-screen.tsx   # Correct answer + point breakdown
│   ├── scoreboard-screen.tsx # Intermediate rankings
│   └── final-screen.tsx    # Winner celebration
└── lib/
    ├── game-context.tsx    # React Context + reducer
    ├── game-store.ts       # Pure state transitions & scoring logic
    └── questions.ts        # German trivia question pack
```

## Prototype Notes

- **No backend / multiplayer** — all state lives in the browser. Bots simulate other players so a single person can test the full flow.
- **No authentication** — jump straight in.
- **Mobile-first** — designed for phone screens, scales up to desktop.
- This prototype is intended for demo and playtesting purposes; a production version will use a Flutter client with a real-time backend.
