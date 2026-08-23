-- Seed: prompts v1
-- Idempotent: uses ON CONFLICT on primary key (id) to avoid duplicates.
-- These prompts are already live in Supabase; this file versions them in the repo.
--
-- To re-run safely: psql -f supabase/seed/prompts_v1.sql
-- Or via Supabase CLI: supabase db execute --file supabase/seed/prompts_v1.sql

-- ============================================================
-- number_guess prompts (13 active)
-- ============================================================

INSERT INTO prompts (id, theme_id, mode, difficulty, prompt, hint, payload, active) VALUES
-- Gaming: Pokémon Gen 1
('59e831f2-7504-467b-b38e-5f931073f56e',
 (SELECT id FROM themes WHERE slug = 'gaming'),
 'number_guess', 'leicht',
 'Wie viele Pokémon gab es in der ersten Generation (Kanto)?',
 'Eine runde Zahl, die fast jeder Gamer kennt.',
 '{"answer": 151, "unit": null, "plausibility_note": "Offizielle Gen-1-Pokedex-Größe (Bulbasaur-Mew)."}',
 true),

-- Gaming: Nintendo Switch release year
('f0889d41-6993-4944-a854-9887f67a44bb',
 (SELECT id FROM themes WHERE slug = 'gaming'),
 'number_guess', 'leicht',
 'In welchem Jahr erschien die Nintendo Switch?',
 'Kurz vor dem Ende der 2010er-Jahre.',
 '{"answer": 2017, "unit": null, "plausibility_note": "Weltweiter Launch am 3. März 2017."}',
 true),

-- Gaming: Joy-Con count
('47e9f9a7-1445-494c-b5d5-33f7e3431995',
 (SELECT id FROM themes WHERE slug = 'gaming'),
 'number_guess', 'leicht',
 'Wie viele Joy-Con gehören standardmäßig zu einem Nintendo-Switch-Set (links + rechts)?',
 'Links und rechts — mehr braucht''s nicht.',
 '{"answer": 2, "unit": null, "plausibility_note": "Ein linker und ein rechter Joy-Con."}',
 true),

-- Gaming: Super Mario 64 stars
('08ce6519-0e42-42da-8762-0f77764f5e2d',
 (SELECT id FROM themes WHERE slug = 'gaming'),
 'number_guess', 'mittel',
 'Wie viele Power Stars gibt es insgesamt in Super Mario 64 (N64-Original)?',
 'Eine runde Hunderter-Zahl plus etwas.',
 '{"answer": 120, "unit": null, "plausibility_note": "Klassiker-Ziel: 120 Sterne im N64-Original."}',
 true),

-- Gaming: Pokémon types
('96f048a7-7473-4059-9e55-fec6f39521b9',
 (SELECT id FROM themes WHERE slug = 'gaming'),
 'number_guess', 'mittel',
 'Wie viele Pokémon-Typen gibt es (inkl. Fee-Typ ab Generation 6)?',
 'Eine Zahl knapp unter 20.',
 '{"answer": 18, "unit": null, "plausibility_note": "17 Typen bis Gen 5, plus Fee = 18."}',
 true),

-- Gaming: GTA 1 release year
('425ec627-0cd3-48d5-ac68-2523ee1bdb69',
 (SELECT id FROM themes WHERE slug = 'gaming'),
 'number_guess', 'schwer',
 'In welchem Jahr erschien das allererste Grand-Theft-Auto-Spiel?',
 'Späte 90er, noch vor GTA III.',
 '{"answer": 1997, "unit": null, "plausibility_note": "GTA (1997) von DMA Design / BMG Interactive."}',
 true),

-- Geschichte: Berliner Mauer
('c4504e91-d7d8-48f9-9423-d2c359d30cb6',
 (SELECT id FROM themes WHERE slug = 'geschichte'),
 'number_guess', 'leicht',
 'In welchem Jahr fiel die Berliner Mauer?',
 'Ende der 80er.',
 '{"answer": 1989, "unit": null, "plausibility_note": "Historisches Datum, 9. November 1989."}',
 true),

-- Wissenschaft & Natur: Knochen
('49a1db2d-599c-450f-9e2f-09ebc21a60da',
 (SELECT id FROM themes WHERE slug = 'wissenschaft-natur'),
 'number_guess', 'mittel',
 'Wie viele Knochen hat ein erwachsener Mensch ungefähr?',
 'Etwas über 200.',
 '{"answer": 206, "unit": null, "plausibility_note": "Anatomie-Standardwert Erwachsene (Säuglinge mehr)."}',
 true),

-- Sport: WM-Titel Deutschland
('0be4145f-dbb4-47de-92d0-88f2e52d9d39',
 (SELECT id FROM themes WHERE slug = 'sport'),
 'number_guess', 'leicht',
 'Wie oft hat die deutsche Fußball-Nationalmannschaft der Männer bisher die WM gewonnen?',
 'Weniger als fünf.',
 '{"answer": 4, "unit": null, "plausibility_note": "1954, 1974, 1990, 2014."}',
 true),

-- Musik: Klaviertasten
('20396771-4075-4fe5-8319-fafa8569c64e',
 (SELECT id FROM themes WHERE slug = 'musik'),
 'number_guess', 'leicht',
 'Wie viele Tasten hat ein Standard-Klavier?',
 'Eine Zahl zwischen 80 und 90.',
 '{"answer": 88, "unit": null, "plausibility_note": "52 weiße + 36 schwarze Tasten."}',
 true),

-- Film & Serie: Harry Potter Bücher
('c5063099-3634-4168-b387-69f249b614d7',
 (SELECT id FROM themes WHERE slug = 'film-serie'),
 'number_guess', 'leicht',
 'Aus wie vielen Büchern besteht die originale Harry-Potter-Reihe?',
 'Eine einstellige Zahl.',
 '{"answer": 7, "unit": null, "plausibility_note": "Sieben Romane von J. K. Rowling."}',
 true),

-- Reise & Orte: Eiffelturm
('dd870acb-90a7-4b7d-8148-85830b9903a1',
 (SELECT id FROM themes WHERE slug = 'reise-orte'),
 'number_guess', 'mittel',
 'Wie hoch ist der Eiffelturm ungefähr (inkl. Antenne, in Metern)?',
 'Denk an dreihundert und etwas.',
 '{"answer": 330, "unit": "m", "plausibility_note": "Aktuelle Höhe ca. 330 m inkl. Antenne (ohne Antenne ~300)."}',
 true),

-- Alltag & Peinlich: Fußballspiel-Dauer
('9fd12c0b-1094-4be4-8057-130828f8ffb3',
 (SELECT id FROM themes WHERE slug = 'alltag-peinlich'),
 'number_guess', 'mittel',
 'Wie viele Minuten hat ein Fußballspiel (reguläre Spielzeit, ohne Nachspielzeit)?',
 'Eine runde Zahl, die auch Couch-Experten kennen.',
 '{"answer": 90, "unit": "Minuten", "plausibility_note": "2 x 45 Minuten."}',
 true)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- pick_correct prompts (8 active)
-- ============================================================

INSERT INTO prompts (id, theme_id, mode, difficulty, prompt, hint, payload, active) VALUES
-- Gaming: Nintendo franchises
('69ebe305-e2b3-482f-8c5e-2702fa414e1c',
 (SELECT id FROM themes WHERE slug = 'gaming'),
 'pick_correct', 'mittel',
 'Welche davon sind echte Nintendo-Franchises?',
 'Denk an Figuren, die Mario kennen würden.',
 '{"cards": ["The Legend of Zelda", "Halo", "Metroid", "Uncharted", "Animal Crossing", "God of War", "Kirby", "The Last of Us"], "correct_indices": [0, 2, 4, 6]}',
 true),

-- Wissenschaft & Natur: Säugetiere
('a3835716-fcff-43c2-8f7a-8ba3829fc09f',
 (SELECT id FROM themes WHERE slug = 'wissenschaft-natur'),
 'pick_correct', 'mittel',
 'Welche Tiere sind Säugetiere?',
 'Milch und (meist) Fell — auch im Wasser.',
 '{"cards": ["Delfin", "Pinguin", "Fledermaus", "Hai", "Wal", "Schildkröte", "Känguru", "Frosch"], "correct_indices": [0, 2, 4, 6]}',
 true),

-- Sport: Olympische Sommerspiele
('4f1fb6f3-310e-41b5-a724-f01f5a4b3a87',
 (SELECT id FROM themes WHERE slug = 'sport'),
 'pick_correct', 'leicht',
 'Welche Sportarten gehören zu den Olympischen Sommerspielen (regulär)?',
 'Sommer = kein Eis, kein Schnee.',
 '{"cards": ["Schwimmen", "Ski alpin", "Leichtathletik", "Eishockey", "Turnen", "Biathlon", "Beachvolleyball", "Curling"], "correct_indices": [0, 2, 4, 6]}',
 true),

-- Musik: Bands aus Großbritannien
('feee0552-2e7f-46fe-8a1d-b877f63e9c3d',
 (SELECT id FROM themes WHERE slug = 'musik'),
 'pick_correct', 'mittel',
 'Welche Bands/Acts kommen ursprünglich aus Großbritannien?',
 'Irland und Australien zählen hier nicht.',
 '{"cards": ["The Beatles", "U2", "Queen", "AC/DC", "Oasis", "Nirvana", "Coldplay", "Metallica"], "correct_indices": [0, 2, 4, 6]}',
 true),

-- Film & Serie: Marvel-Helden
('95b5384d-36d3-440c-9a2e-0cf8f2982d25',
 (SELECT id FROM themes WHERE slug = 'film-serie'),
 'pick_correct', 'leicht',
 'Welche davon sind Marvel-Helden (MCU/Comics)?',
 'DC rausfiltern.',
 '{"cards": ["Iron Man", "Batman", "Thor", "Superman", "Black Widow", "Wonder Woman", "Spider-Man", "Aquaman"], "correct_indices": [0, 2, 4, 6]}',
 true),

-- Alltag & Peinlich: Peinlichkeits-Klassiker
('b6b38c69-d3d6-4f81-82c8-0d5928d94e82',
 (SELECT id FROM themes WHERE slug = 'alltag-peinlich'),
 'pick_correct', 'leicht',
 'Welche Dinge sind typische Peinlichkeits-Klassiker in Freundesrunden?',
 'Alles, worüber man später lacht — nicht applaudiert.',
 '{"cards": ["Falschen Namen sagen", "Nobelpreis gewinnen", "In den Voice-Chat reinrotzen", "Steuererklärung pünktlich abgeben", "Ex in der Story liken", "Marathon unter 3 Stunden", "Hosennaht platzt auf der Tanzfläche", "Promotion bekommen"], "correct_indices": [0, 2, 4, 6]}',
 true),

-- Reise & Orte: Europäische Städte
('4f11b943-0f56-462e-bb68-1c43a184286c',
 (SELECT id FROM themes WHERE slug = 'reise-orte'),
 'pick_correct', 'mittel',
 'Welche Städte liegen in Europa?',
 'Istanbul ist Spezialfall — hier bewusst Distraktor.',
 '{"cards": ["Lissabon", "Istanbul", "Kairo", "Prag", "Buenos Aires", "Oslo", "Kapstadt", "Budapest"], "correct_indices": [0, 3, 5, 7]}',
 true),

-- Geschichte: 20. Jahrhundert
('a2394bf2-8fc8-4d19-9f54-ad68ee855f7c',
 (SELECT id FROM themes WHERE slug = 'geschichte'),
 'pick_correct', 'mittel',
 'Welche Ereignisse fanden wirklich im 20. Jahrhundert statt?',
 'Alles, was nach 1900 und vor 2001 liegt.',
 '{"cards": ["Mondlandung", "Sturm auf die Bastille", "Erster Weltkrieg", "Fall der Berliner Mauer", "Entdeckung Amerikas durch Kolumbus", "Erfindung des Buchdrucks mit beweglichen Lettern", "Ende der Apartheid in Südafrika (erste freie Wahl)", "Bau der Cheops-Pyramide"], "correct_indices": [0, 2, 3, 6]}',
 true)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- find_lie prompts (2, active)
-- ============================================================

INSERT INTO prompts (id, theme_id, mode, difficulty, prompt, hint, payload, active) VALUES
('50284874-e1bf-439a-aca7-e985a3669a1f',
 (SELECT id FROM themes WHERE slug = 'reise-orte'),
 'find_lie', 'mittel',
 'Welche Aussage ist falsch?',
 'Everest = Himalaya.',
 '{"lie_index": 2, "statements": ["Der Nil fließt durch Ägypten.", "Island liegt im Atlantik.", "Der Mount Everest liegt in den Alpen.", "Australien ist zugleich Land und Kontinent."]}',
 true),

('c0e99ba8-3ea6-411b-827c-2ce2b55c9a22',
 (SELECT id FROM themes WHERE slug = 'musik'),
 'find_lie', 'mittel',
 'Drei stimmen — eine ist gelogen. Welche?',
 'Becken-Anzahl ist Geschmackssache, keine feste Regel.',
 '{"lie_index": 3, "statements": ["Ein Standard-Klavier hat 88 Tasten.", "Die Beatles kamen aus Liverpool.", "Mozart hat mehr als 40 Sinfonien geschrieben.", "Ein typisches Drumset hat immer genau drei Becken."]}',
 true)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- order_it prompts (2, active)
-- ============================================================

INSERT INTO prompts (id, theme_id, mode, difficulty, prompt, hint, payload, active) VALUES
('a1728f42-0557-436f-9023-24cf14f54a1c',
 (SELECT id FROM themes WHERE slug = 'geschichte'),
 'order_it', 'mittel',
 'Ordne chronologisch (frühestes zuerst).',
 '1914 -> 1945 -> 1969 -> 1989.',
 '{"items": ["Erster Weltkrieg beginnt", "Zweiter Weltkrieg endet in Europa", "Mondlandung", "Fall der Berliner Mauer"], "order_axis": "chronologisch", "correct_order": [0, 1, 2, 3]}',
 true),

('c963b266-e139-49ae-a78c-43a9a68853ca',
 (SELECT id FROM themes WHERE slug = 'film-serie'),
 'order_it', 'leicht',
 'Ordne die Star-Wars-Saga-Filme nach Kinostart (älteste zuerst).',
 'Original-Trilogie, dann Sequel.',
 '{"items": ["Eine neue Hoffnung (Episode IV)", "Das Imperium schlägt zurück (Episode V)", "Die Rückkehr der Jedi-Ritter (Episode VI)", "Das Erwachen der Macht (Episode VII)"], "order_axis": "Release", "correct_order": [0, 1, 2, 3]}',
 true)

ON CONFLICT (id) DO NOTHING;
