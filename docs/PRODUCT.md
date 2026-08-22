# Ratepanik — Produktplan

> Lebendes Dokument. Quelle der Wahrheit für Vision, Spielablauf und Scope.
> Repo: https://github.com/wladosh/ratepanik  
> Supabase: Org **Ratepanik**, Projekt **Ratepanik** (`uwbhgveknypqvrwazleq`)  
> Owner: Wladislaw · Koordination: Stabschef · Umsetzung: Dev · Content: Fragemeister · UI: UX

**Stand:** 2026-08-22  
**Status:** Vision v1 — freigegeben zum Planen; Kategorien brauchen Wladislaws OK bevor Content massenhaft angelegt wird.

---

## 1. Pitch

Ratepanik ist ein **Party-Quiz für 2–4 Freunde** im Browser (später Flutter). Pro Match wechseln mehrere **Spielmodi** (Mini-Games). Dazwischen wählt ein Spieler ein **Thema**. Nach dem Match gibt's XP, Ingame-Währung, Cosmetics und Achievements — leicht süchtig machende Progression à la GeoGuessr, aber als Partyspiel.

---

## 2. Begriffe (bitte so verwenden)

| Begriff | Bedeutung | Beispiele |
|--------|-----------|-----------|
| **Spielmodus** (Mini-Game) | Die *Art*, wie eine Runde gespielt wird | Zahlenraten, Passendes wählen, … |
| **Thema** | Content-Bereich / Kategorie für Quiz-Inhalte | Gaming, Geschichte, Wissenschaft |
| **Unterthema** | Speziellere Facette eines Themas (optional) | 90er-Musik, Fußball WM |
| **Match** | Eine komplette Partie mit mehreren Spielmodus-Blöcken | 4 Blöcke → Sieger |
| **Lobby** | Warteraum vor dem Match | Code, Spielerliste, Start |
| **Avatar / Cosmetic** | Optische Items für den Avatar | Hut, Outfit, Farbe |
| **Währung** | Ingame-Geld (Name TBD) | Lootbox-Käufe |
| **Achievement / Badge** | Errungenschaft, oft live während des Matches | „Exakter Treffer bei Zahlenraten" |

Nicht vermischen: „Wissenschaft" ist ein **Thema**, „Zahlenraten" ist ein **Spielmodus**.

---

## 3. Accounts & Einstieg

### 3.1 Auth
- **Google Login**
- **E-Mail + Passwort**
- **Gast spielen** (ohne Konto)

### 3.2 Rechte
| Aktion | Gast | Registriert |
|--------|------|-------------|
| Match beitreten | ✅ | ✅ |
| Lobby **erstellen** (Host) | ❌ | ✅ |
| XP / Währung / Cosmetics / Achievements behalten | ❌ (nur Session) | ✅ |
| Freunde hinzufügen | ❌ | ✅ |
| Avatar dauerhaft speichern | ❌ | ✅ |

### 3.3 Nach Registrierung
1. Kurzer Onboarding-Flow: **Avatar erstellen** (wenige Optionen: z. B. Basis-Körper, 2–3 Frisuren, 2–3 Oberteile, Farbe).
2. Danach **Hauptmenü**.

---

## 4. Hauptmenü (registriert)

Sichtbar / erreichbar:
- Level (Start: **1**) + XP-Fortschritt
- Avatar-Vorschau
- Währungsstand (Name TBD)
- **Spiel erstellen** / **Spiel beitreten**
- Freunde
- Lootbox-Shop / Inventar / Cosmetics anziehen
- Achievements-Übersicht (später)

---

## 5. Progression & Monetisierung (Ingame, kein Echtgeld-Pflicht)

### 5.1 Level & XP
- Spielen gibt XP; Gewinner mehr als Verlierer; alle registrierten Teilnehmer etwas.
- **Offen:** Was Level *bringen* soll. Progress ist gewollt — Nutzen später festlegen, XP-Kurve trotzdem früh einbauen.

### 5.2 Währung (Name TBD)
Vorschläge: **Paniktaler**, **Hirncoins**, **Ratechips**, **Nerven**.
Verdienen: Match-Ende (Sieg > Platz 2 > …). Ausgeben: **Lootboxen**.

### 5.3 Lootboxen & Cosmetics
- Kauf mit Ingame-Währung.
- Cosmetics Common → Legendary, am Avatar anziehbar.
- Asset-Agent später; bis dahin Platzhalter ok.

### 5.4 Achievements
Beispiele: exakter Zahlenraten-Treffer; erster Match-Sieg; 3 Matches mit Freunden; Passendes-wählen ohne Fehler; Streak exakter Treffer.
**UX:** Badge sofort nach Trigger mit Animation; am Ende zusätzlich listen.

---

## 6. Freunde & Social
Freunde hinzufügen; Lobby per Raumcode (MVP); später Freundes-Invites.

---

## 7. Lobby
Nur Registrierte hosten. Min 2, max 4. Host startet bei ≥2. Match-Typ MVP: **Standard**.

---

## 8. Match-Ablauf (Standard)
4 Blöcke = 4 Spielmodi. Zufällige Modi ohne Wiederholung wenn möglich. Vor quiz-artigen Blöcken: Spieler wählt Thema aus 2 Zufallsoptionen. Nach 4 Blöcken Ergebnis → XP/Währung → Menü.
Ergebnis ohne volle Fragen/Antworten (Anti-Spoiler). Default Gleichstand: geteilter Sieg.

---

## 9. Spielmodi

### 9.1 Zahlenraten (`number_guess`)
Numerische Wahrheit; Abstand absolut; Punkte nach Rang (Vorschlag letzter 0); 2 Runden/Block; Achievement exakter Treffer.

### 9.2 Passendes wählen (`pick_correct`)
Thema wählen (2 Optionen); 8 Karten (4 richtig/4 falsch); abwechselnd tippen bis 4 Richtige gefunden.

### 9.3 Weitere (Ideen, Spec nötig)
Schnellste Wahrheit; Reihenfolge sortieren; Blitz-Tippen; Emoji/Bild später; Schätzen vs Durchschnitt.

---

## 10. Themen & Content
Starter-Set braucht User-OK: Gaming, Geschichte, Wissenschaft, Sport, Musik, Film & Serie, Geographie, Everyday/Allgemeinwissen.
Supabase: themes/subthemes/prompts je Spielmodus. Prozess: Themen vorschlagen → OK → Seed. Kein Chaos-Dump.

---

## 11. Tech Ist
Next.js App Router; Supabase rooms/players/answers + Realtime (PR #2). Auth/Progression/Engine noch offen. Flutter später.

---

## 12. MVP-Phasen
**A Core:** Auth, Host-Regel, Lobby 2–4, Engine Zahlenraten+Passendes wählen, Ergebnis, Themenwahl, Content-Seed.
**B Progression:** XP/Level, Währung, Achievements live, Avatar starter.
**C Collect/Social:** Lootboxen, Cosmetics, Freunde, mehr Modi.

---

## 13. Offene Entscheidungen
Währungsname; Level-Nutzen; Themen-Freigabe; Punkttabellen; 2 weitere Modi; Gast-Progress mergen?

## 14. Agent-Rollen
Stabschef, Dev, Fragemeister, UX, Asset später.

## 15. Nicht-Ziele
Echtgeld-Gacha, Solo, >4 Spieler, Voice, unmoderierte UGC.

*Änderungen: Stabschef nach Absprache mit Wladislaw.*
