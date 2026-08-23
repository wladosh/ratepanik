# Lobby-Settings (Host)

Plan of record for rich host lobby config before **Runde starten**.
PhoneShell only. Shared via `rooms.settings` + Realtime.

## Data model

`rooms.settings jsonb` (default `{}`). Clients parse with `parseRoomSettings()` and
fill **Standard** defaults. `rooms.total_blocks` is mirrored from `settings.blocks`
so the existing match engine keeps working.

| Key | Standard | Notes |
|-----|----------|--------|
| `themeMix` | `random` | `manual` → `themeIds[]` (German names from `themes`) |
| `themeIds` | `[]` | Ignored unless manual. At least 1 to start. |
| `modeFilter` | `all` | `number_guess` / `pick_correct`. `find_lie` / `order_it` UI stub, disabled. |
| `difficulty` | `mix` | Maps to `prompts.difficulty`. Mix = no filter. |
| `blocks` | `4` | Clamp 1–4 |
| `questionsPerBlock` | `2` | Clamp 1–4. Applies to `number_guess` rounds. `pick_correct` stays 1 prompt/block. |
| `timerSeconds` | `10` | 5 \| 8 \| 10 \| 15. Always on. Same bar for all via `started_at`. Snapshotted onto `match_blocks.timer_seconds` |
| `revealHoldMs` | `1000` | Internal pick-correct highlight delay (not a lobby control) |
| `maxPlayers` | `4` | 2–4. Cannot go below occupied seats. |
| `allowGuests` | `true` | Anonymous join rejected when false |
| `autoStart` | `false` | Host starts when `players.length === maxPlayers` (≥2) |

Host-only UPDATE of `settings` while `status = 'lobby'` (trigger). Other room
columns stay writable so the match engine is unchanged.

## UI wireflow (Lobby)

```
[Verlassen]
Raumcode + Kopieren
Status: warten / startklar
Spielerliste (compact)
────────────────────────
Einstellungen  (Host: editors / Gäste: read-only chips)
  Inhalt   Themenmix · Modi · Schwierigkeit
  Form     Blöcke · Fragen/Block
  Tempo    Fragedauer (immer an, collapsed by default)
  Raum     Max Spieler · Gäste · Start wenn voll
────────────────────────
Micro-hint
[Runde starten]  or  Warten auf Host…
```

- One primary CTA. Toggles persist immediately (Realtime).
- Setting blocks start collapsed; chevron expands.
- Defaults marked **Standard**.
- Guests see summary chips, not controls.

## Empty prompt pool

On **Runde starten**, count active prompts for each planned mode + theme pool +
difficulty. If any mode has **0** matches: do not start, toast:

> Mit dem Filter bleibt der Fragenkasten leer. Mach locker oder Fragemeister füttern.

Manual with 0 themes: start disabled.

In-block fallback: other themes **in the same pool**, never silently widen difficulty.

## Risks

- Prompt seed is thin per theme×mode×difficulty → Mix + Zufall is the safe default.
- Tightening `rooms` UPDATE globally would break match flow → settings-only trigger.
- Auto-start race: host-only `startGame`, one-shot ref, reset if preflight fails.
- Migration must land before createRoom writes `settings` or inserts fail.

## Rollout

1. Apply `20260823_010_room_lobby_settings.sql` (SQL editor if `db push` needs password).
2. Deploy app. Old rooms with `{}` parse as Standard.
3. Smoke: host edits, second client sees chips; guest-off join; timer 8s bar; filter empty.
