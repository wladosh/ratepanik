#!/usr/bin/env node
/**
 * Builds content/seed-find-lie-order-it-v1.json and the SQL seed migration.
 * Validates every find_lie.lie_index and order_it.correct_order before writing.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const THEMES = [
  "gaming",
  "geschichte",
  "wissenschaft-natur",
  "sport",
  "musik",
  "film-serie",
  "reise-orte",
  "alltag-peinlich",
];
const YEARISH = /\b(19[0-9]{2}|20[0-2][0-9])\b/;

/** @type {Array<Record<string, unknown>>} */
const RAW = [
  {
    theme_slug: "gaming",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Welche Aussage ist falsch?",
    hint: "Igel, blau, sehr schnell — kein Beuteltier.",
    payload: {
      statements: [
        "Super Mario trägt meist einen roten Hut.",
        "Pikachu ist ein Elektro-Pokémon.",
        "Die Steine in Tetris heißen Tetrominos.",
        "Sonic the Hedgehog ist ein gelbes Känguru.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "gaming",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Drei stimmen — eine ist gelogen. Welche?",
    hint: "Minecraft baut mit Würfeln, nicht mit Pyramiden-Mesh.",
    payload: {
      statements: [
        "Minecraft spielt in einer Welt aus Dreiecken.",
        "Die Nintendo Switch hat abnehmbare Joy-Con.",
        "Pokémon hat Typen wie Feuer, Wasser und Pflanze.",
        "Ein Game Over bedeutet meist: Runde vorbei.",
      ],
      lie_index: 0,
    },
  },
  {
    theme_slug: "gaming",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Eine flunkert. Welche?",
    hint: "Denk an Steckmodul vs. Silberscheibe.",
    payload: {
      statements: [
        "Die PlayStation kommt ursprünglich von Sony.",
        "Xbox ist eine Marke von Microsoft.",
        "Die Wii wurde mit Bewegungssteuerung bekannt.",
        "Die Nintendo 64 kam serienmäßig mit CD-Laufwerk wie die erste PlayStation.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "gaming",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Welche ist die Lüge?",
    hint: "Kanto startet kleiner als Johto-Nationaldex.",
    payload: {
      statements: [
        "Doom gilt als Meilenstein der Ego-Shooter.",
        "Die erste Pokémon-Generation hatte 251 Arten im Pokédex.",
        "Lara Croft ist die Heldin von Tomb Raider.",
        "Tetris wurde von Alexei Paschitnow entwickelt.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "gaming",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne die Nintendo-Heimkonsolen nach Erscheinen (älteste zuerst).",
    hint: "8-Bit, dann 16-Bit, dann der Analogstick, dann der Würfel.",
    payload: {
      items: ["GameCube", "NES", "Nintendo 64", "SNES"],
      correct_order: [1, 3, 2, 0],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "gaming",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne die GTA-Teile nach Erstveröffentlichung (älteste zuerst).",
    hint: "Erst Liberty City in 3D, dann 80er-Neon, dann San Andreas, dann Los Santos im HD-Look.",
    payload: {
      items: ["San Andreas", "GTA V", "GTA III", "Vice City"],
      correct_order: [2, 3, 0, 1],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "gaming",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne die Pokémon-Regionen nach Debüt-Spielen (älteste zuerst).",
    hint: "Die Reise beginnt in Kanto — Sinnoh kommt deutlich später.",
    payload: {
      items: ["Sinnoh (Diamant/Perl)", "Johto (Gold/Silber)", "Kanto (Rot/Blau)", "Hoenn (Rubin/Saphir)"],
      correct_order: [2, 1, 3, 0],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "gaming",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne die Spiele nach Erstveröffentlichung (älteste zuerst).",
    hint: "Arcade-Klassiker vor Puzzle-Ikone, dann NES-Helden nacheinander.",
    payload: {
      items: ["The Legend of Zelda", "Pac-Man", "Super Mario Bros.", "Tetris"],
      correct_order: [1, 3, 2, 0],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "geschichte",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Welche Aussage ist falsch?",
    hint: "Das Schiff liegt auf dem Grund des Atlantiks, nicht an der Elbe.",
    payload: {
      statements: [
        "Die Berliner Mauer stand in Berlin.",
        "Napoleon war ein französischer Feldherr.",
        "Kleopatra lebte im alten Ägypten.",
        "Die Titanic ist unversehrt im Hamburger Hafen ausgestellt.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "geschichte",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Drei stimmen — eine ist gelogen. Welche?",
    hint: "Cäsaren eher Tiber als Ostsee.",
    payload: {
      statements: [
        "Die Französische Revolution begann im 18. Jahrhundert.",
        "Das Römische Reich hatte seinen Sitz dauerhaft in Stockholm.",
        "Martin Luther trat als Reformator auf.",
        "Die Pyramiden von Gizeh stehen in Ägypten.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "geschichte",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Eine flunkert. Welche?",
    hint: "Kaiserkrönung eher Petersdom als Shibuya.",
    payload: {
      statements: [
        "Die Hanse war ein Handelsbund im Norden Europas.",
        "Die Weimarer Republik folgte auf das Kaiserreich.",
        "Karl der Große wurde in Tokio zum Kaiser gekrönt.",
        "Der Westfälische Frieden beendete den Dreißigjährigen Krieg.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "geschichte",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Welche ist die Lüge?",
    hint: "Osmanen am Bosporus, nicht am Oslofjord.",
    payload: {
      statements: [
        "Das Osmanische Reich hatte seine Hauptstadt in Oslo.",
        "Die Magna Carta stammt aus England.",
        "Die Berliner Luftbrücke versorgte West-Berlin.",
        "Der Wiener Kongress ordnete Europa nach Napoleon.",
      ],
      lie_index: 0,
    },
  },
  {
    theme_slug: "geschichte",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne chronologisch (frühestes zuerst).",
    hint: "Steine vor Kaisern, Segel vor Raketen.",
    payload: {
      items: [
        "Mondlandung",
        "Kolumbus erreicht Amerika",
        "Pyramiden von Gizeh entstehen",
        "Augustus wird erster römischer Kaiser",
      ],
      correct_order: [2, 3, 1, 0],
      order_axis: "chronologisch",
    },
  },
  {
    theme_slug: "geschichte",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne die deutschen Staatsformen chronologisch (früheste zuerst).",
    hint: "Erst Kaiser, dann Republik, dann Diktatur, dann Neubeginn im Westen.",
    payload: {
      items: [
        "Bundesrepublik wird gegründet",
        "NS-Zeit beginnt",
        "Kaiserreich wird ausgerufen",
        "Weimarer Republik beginnt",
      ],
      correct_order: [2, 3, 1, 0],
      order_axis: "chronologisch",
    },
  },
  {
    theme_slug: "geschichte",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne die Erfindungen nach dem, was zuerst da war (frühestes zuerst).",
    hint: "Lettern vor Dampf, Flieger vor Touchscreen.",
    payload: {
      items: [
        "Erstes iPhone",
        "Buchdruck mit beweglichen Lettern",
        "Erster Motorflug der Gebrüder Wright",
        "Dampfmaschine wird alltagstauglich",
      ],
      correct_order: [1, 3, 2, 0],
      order_axis: "chronologisch",
    },
  },
  {
    theme_slug: "geschichte",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne die Dokumente / Friedensschlüsse chronologisch (frühestes zuerst).",
    hint: "England im Mittelalter, dann Dreißigjähriger, dann Napoleon, dann Weltkrieg.",
    payload: {
      items: ["Versailler Vertrag", "Wiener Kongress", "Magna Carta", "Westfälischer Frieden"],
      correct_order: [2, 3, 1, 0],
      order_axis: "chronologisch",
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Welche Aussage ist falsch?",
    hint: "Pinguine mögen Kälte und Küste, keine Sanddünen.",
    payload: {
      statements: [
        "Wasser gefriert bei 0 °C (unter Normaldruck).",
        "Die Erde kreist um die Sonne.",
        "Menschen atmen Sauerstoff.",
        "Pinguine brüten wild in der Sahara.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Drei stimmen — eine ist gelogen. Welche?",
    hint: "Planeten kreisen — die große heiße Kugel ist selbst der Stern.",
    payload: {
      statements: [
        "Der Mond umkreist die Erde.",
        "Bienen erzeugen Honig.",
        "Die Sonne ist ein Planet.",
        "Diamanten bestehen aus Kohlenstoff.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Eine flunkert. Welche?",
    hint: "Edelmetall bleibt glänzend, Eisen nicht.",
    payload: {
      statements: [
        "Gold rostet an der Luft genauso schnell wie Eisen.",
        "DNA trägt Erbinformation.",
        "Photosynthese braucht Licht.",
        "Blitze sind elektrische Entladungen.",
      ],
      lie_index: 0,
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Welche ist die Lüge?",
    hint: "Schnupfen ist oft viral — Tabletten gegen Bakterien helfen dann nicht.",
    payload: {
      statements: [
        "Pluto gilt offiziell als Zwergplanet.",
        "Antibiotika wirken gegen Viren genauso zuverlässig wie gegen Bakterien.",
        "Tomaten sind botanisch Früchte.",
        "Der Mount Everest ist kein aktiver Vulkan.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne nach Größe (kleinstes zuerst).",
    hint: "Nager, Stubentiger, Reittier, Meeresriese.",
    payload: {
      items: ["Pferd", "Blauwal", "Hausmaus", "Hauskatze"],
      correct_order: [2, 3, 0, 1],
      order_axis: "Größe",
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne die Planeten nach Abstand zur Sonne (nächster zuerst).",
    hint: "Merkur klebt an der Sonne, Mars ist der rote Nachbar hinter uns.",
    payload: {
      items: ["Erde", "Merkur", "Mars", "Venus"],
      correct_order: [1, 3, 0, 2],
      order_axis: "Abstand zur Sonne",
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne nach Tempo (langsamstes zuerst).",
    hint: "Schleimspur, Jogging, Savanne, dann die Wolkenkratzer-Route.",
    payload: {
      items: ["Gepard", "Weinbergschnecke", "Passagierflugzeug", "Jogender Mensch"],
      correct_order: [1, 3, 0, 2],
      order_axis: "Geschwindigkeit",
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne vom Kleinsten zum Größten (Maßstab: Teilchen bis Tier).",
    hint: "Baustein der Materie, dann Infektion ohne Zelle, dann Mikrobe, dann Insekt.",
    payload: {
      items: ["Ameise", "Virus", "Atom", "Bakterium"],
      correct_order: [2, 1, 3, 0],
      order_axis: "Größe",
    },
  },
  {
    theme_slug: "sport",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Welche Aussage ist falsch?",
    hint: "Elfmeter heißt nicht ohne Grund so — und liegt vor dem Tor.",
    payload: {
      statements: [
        "Ein Fußballspiel hat zwei Halbzeiten.",
        "Beim Tennis gibt es Aufschlag-Aces.",
        "Ein Elfmeter wird vom Mittelkreis geschossen.",
        "Olympia gibt es als Sommer- und Winterspiele.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "sport",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Drei stimmen — eine ist gelogen. Welche?",
    hint: "Feldspieler: Füße ja, Hände eher peinlich.",
    payload: {
      statements: [
        "Beim Fußball dürfen Feldspieler den Ball nur mit der Hand ins Tor bugsieren.",
        "Usain Bolt ist Sprint-Legende.",
        "Ein Marathon ist deutlich länger als 5 km.",
        "Basketball-Körbe hängen oben am Brett.",
      ],
      lie_index: 0,
    },
  },
  {
    theme_slug: "sport",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Eine flunkert. Welche?",
    hint: "Korb vs. Puck: andere Liga, anderes Eis.",
    payload: {
      statements: [
        "Wimbledon wird auf Rasen gespielt.",
        "Die Tour de France ist ein Radrennen.",
        "Der Super Bowl ist das Finale der NFL.",
        "Die NBA ist die Top-Liga im Eishockey.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "sport",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Welche ist die Lüge?",
    hint: "Majors im Tennis: eine Hand voll minus den Daumen.",
    payload: {
      statements: [
        "Ein Cricket-Test kann über mehrere Tage gehen.",
        "Ein Grand Slam im Tennis besteht aus fünf Majors plus Olympia.",
        "Abseits gibt es im Fußball.",
        "Die Tour de France hat Bergetappen.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "sport",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne nach Distanz (kürzeste zuerst).",
    hint: "Bahn-Sprint, dann Runde, dann Mittelstrecke, dann Straßenqual.",
    payload: {
      items: ["Marathon", "400 Meter", "100-Meter-Sprint", "1500-Meter-Lauf"],
      correct_order: [2, 1, 3, 0],
      order_axis: "Distanz",
    },
  },
  {
    theme_slug: "sport",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne die Gewichtsklassen (leichteste zuerst).",
    hint: "Fliegen ist winzig, Schwer ist das andere Ende.",
    payload: {
      items: ["Schwergewicht", "Fliegengewicht", "Mittelgewicht", "Weltergewicht"],
      correct_order: [1, 3, 2, 0],
      order_axis: "Gewichtsklasse",
    },
  },
  {
    theme_slug: "sport",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne nach Geburtsjahr (älteste Person zuerst).",
    hint: "Brasilianische Legende, dann Chicago, dann Jamaika, dann Norwegen jetzt.",
    payload: {
      items: ["Usain Bolt", "Pelé", "Erling Haaland", "Michael Jordan"],
      correct_order: [1, 3, 0, 2],
      order_axis: "Geburtsjahr",
    },
  },
  {
    theme_slug: "sport",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne die Grand-Slam-Turniere im Kalenderjahr (frühestes zuerst).",
    hint: "Sommer Down Under, dann Sand, dann Rasen, dann US-Hardcourt.",
    payload: {
      items: ["Wimbledon", "US Open", "Australian Open", "French Open"],
      correct_order: [2, 3, 0, 1],
      order_axis: "Saisonkalender",
    },
  },
  {
    theme_slug: "musik",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Welche Aussage ist falsch?",
    hint: "Blasen, nicht streichen — trotz Blech-Look.",
    payload: {
      statements: [
        "Ein DJ legt Tracks auf.",
        "Gitarren haben Saiten.",
        "Ein Mikrofon nimmt Schall auf.",
        "Ein Saxophon ist ein Streichinstrument.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "musik",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Drei stimmen — eine ist gelogen. Welche?",
    hint: "Mehr Köttbullar als Fondue.",
    payload: {
      statements: [
        "Queen hatte Freddie Mercury als Sänger.",
        "ABBA kommt aus der Schweiz.",
        "Hip-Hop entstand in New York.",
        "Beethoven komponierte Sinfonien.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "musik",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Eine flunkert. Welche?",
    hint: "Taktstock reicht. Marshall-Stack ist optional.",
    payload: {
      statements: [
        "Ein Dirigent braucht zwingend eine E-Gitarre.",
        "Rap lebt von Rhythmus und Sprache.",
        "Die EU-Hymne basiert auf Beethovens Ode an die Freude.",
        "Ein Taktstrich teilt die Musik in Takte.",
      ],
      lie_index: 0,
    },
  },
  {
    theme_slug: "musik",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Welche ist die Lüge?",
    hint: "Zwölfton ist Wiener Schule, nicht Graceland.",
    payload: {
      statements: [
        "Die Zauberflöte stammt von Mozart.",
        "Woodstock fand in den USA statt.",
        "Die Zwölftontechnik stammt von Elvis Presley.",
        "Miles Davis ist eine Jazz-Ikone.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "musik",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne die Epochen chronologisch (früheste zuerst).",
    hint: "Perücke und Generalbass, dann Wiener Klarheit, dann Gefühl, dann elektrischer Wackelpo.",
    payload: {
      items: ["Rock ’n’ Roll", "Barock", "Romantik", "Wiener Klassik"],
      correct_order: [1, 3, 2, 0],
      order_axis: "chronologisch",
    },
  },
  {
    theme_slug: "musik",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne nach Tonlage (höchste zuerst).",
    hint: "Winzige Flöte piepst oben, der Kasten mit Stachel brummt unten.",
    payload: {
      items: ["Cello", "Kontrabass", "Piccoloflöte", "Violine"],
      correct_order: [2, 3, 0, 1],
      order_axis: "Tonlage",
    },
  },
  {
    theme_slug: "musik",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne nach Durchbruch (früheste Ära zuerst).",
    hint: "Liverpool, dann Stockholm, dann Seattle, dann Teen-Pop-Ära am Handy.",
    payload: {
      items: ["Billie Eilish", "Nirvana", "The Beatles", "ABBA"],
      correct_order: [2, 3, 1, 0],
      order_axis: "Ära",
    },
  },
  {
    theme_slug: "musik",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne chronologisch (frühestes zuerst).",
    hint: "Kloster, dann Opernhaus, dann Clubs am Mississippi, dann Bronx-Blockparty.",
    payload: {
      items: [
        "Hip-Hop in der Bronx",
        "Frühe Oper in Italien",
        "Gregorianischer Choral",
        "Jazz in New Orleans",
      ],
      correct_order: [2, 1, 3, 0],
      order_axis: "chronologisch",
    },
  },
  {
    theme_slug: "film-serie",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Welche Aussage ist falsch?",
    hint: "Elsa braucht Schnee, kein Kamel.",
    payload: {
      statements: [
        "Harry Potter geht nach Hogwarts.",
        "Darth Vader gehört zu Star Wars.",
        "Titanic handelt von einem Schiffsunglück.",
        "Frozen spielt hauptsächlich in der Sahara.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "film-serie",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Drei stimmen — eine ist gelogen. Welche?",
    hint: "Bond, James Bond — nicht Bond, Klassenlehrer.",
    payload: {
      statements: [
        "Sherlock Holmes ist Detektiv.",
        "James Bond unterrichtet fest als Dorflehrer in Bielefeld.",
        "Der Joker ist Batmans Gegenspieler.",
        "Pixar hat Toy Story gemacht.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "film-serie",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Eine flunkert. Welche?",
    hint: "Eis und Feuer, nicht Hogwarts.",
    payload: {
      statements: [
        "Game of Thrones basiert auf Büchern von J. K. Rowling.",
        "Die Simpsons leben in Springfield.",
        "Der Herr der Ringe spielt in Mittelerde.",
        "Marvel und DC sind verschiedene Universen.",
      ],
      lie_index: 0,
    },
  },
  {
    theme_slug: "film-serie",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Welche ist die Lüge?",
    hint: "Passagierschiff ≠ Schlachtschiff.",
    payload: {
      statements: [
        "Stranger Things spielt optisch stark in den 80ern.",
        "Studio Ghibli kommt aus Japan.",
        "Der Film Titanic handelt vom Untergang der Bismarck.",
        "Netflix ist ein Streamingdienst.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "film-serie",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne die Harry-Potter-Filme nach Kinostart (älteste zuerst).",
    hint: "Erst der Stein, dann die Kammer, dann Askaban, dann der Kelch.",
    payload: {
      items: [
        "Feuerkelch",
        "Stein der Weisen",
        "Der Gefangene von Askaban",
        "Kammer des Schreckens",
      ],
      correct_order: [1, 3, 2, 0],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "film-serie",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne nach Kinostart (älteste zuerst).",
    hint: "Erst der Anzug, dann der Crossover, dann das Schnappen, dann das Ende.",
    payload: {
      items: ["Avengers: Endgame", "Iron Man", "Avengers: Infinity War", "The Avengers"],
      correct_order: [1, 3, 2, 0],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "film-serie",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne nach Kinostart (älteste zuerst) — nicht nach Buchchronologie.",
    hint: "Erst die Trilogie im Kino, der Hobbit kam als Prequel später in die Läden.",
    payload: {
      items: [
        "Der Hobbit: Eine unerwartete Reise",
        "Die zwei Türme",
        "Die Gefährten",
        "Die Rückkehr des Königs",
      ],
      correct_order: [2, 1, 3, 0],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "film-serie",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne die Pixar-Filme nach Kinostart (älteste zuerst).",
    hint: "Spielzeug zuerst, dann Riff, dann Luftballons, dann Gefühle im Kopf.",
    payload: {
      items: ["Oben", "Toy Story", "Alles steht Kopf", "Findet Nemo"],
      correct_order: [1, 3, 0, 2],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Welche Aussage ist falsch?",
    hint: "Eiffel guckt auf die Seine, nicht auf die Spree.",
    payload: {
      statements: [
        "Paris ist die Hauptstadt von Frankreich.",
        "Die Alpen liegen in Europa.",
        "Japan ist ein Inselstaat.",
        "Der Eiffelturm steht in Berlin.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Drei stimmen — eine ist gelogen. Welche?",
    hint: "Samba und Amazonas, nicht Alpenvorland.",
    payload: {
      statements: [
        "Italien hat ungefähr Stiefelform.",
        "Brasilien liegt in Europa.",
        "Die Sahara ist eine Wüste.",
        "New York liegt in den USA.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Eine flunkert. Welche?",
    hint: "Freistehender Gipfel in Ostafrika, nicht Zugspitz-Nachbar.",
    payload: {
      statements: [
        "Der Kilimandscharo liegt in den Alpen.",
        "Der Amazonas fließt durch Südamerika.",
        "Die Anden liegen in Südamerika.",
        "Der Nil mündet ins Mittelmeer.",
      ],
      lie_index: 0,
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Welche ist die Lüge?",
    hint: "Hauptstadt ≠ größte Stadt. Opernhaus und Hafen gewinnen die Einwohner-Liga.",
    payload: {
      statements: [
        "Istanbul liegt teils in Europa, teils in Asien.",
        "Der Vatikan ist ein eigener Staat.",
        "Canberra ist die einwohnerstärkste Stadt Australiens.",
        "Die Donau fließt durch mehrere Länder.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne von Westen nach Osten.",
    hint: "Atlantikküste, dann Mitte Europas, dann Bosporus, dann Fernost.",
    payload: {
      items: ["Tokio", "Berlin", "Lissabon", "Istanbul"],
      correct_order: [2, 1, 3, 0],
      order_axis: "West → Ost",
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne nach Gipfelhöhe (niedrigstes zuerst).",
    hint: "Harz-Hausberg, dann Deutschland-Dach, dann Alpenkrone, dann Himalaya.",
    payload: {
      items: ["Mont Blanc", "Brocken", "Mount Everest", "Zugspitze"],
      correct_order: [1, 3, 0, 2],
      order_axis: "Höhe",
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne nach Landesfläche (kleinste zuerst).",
    hint: "Ein Stadtstaat, dann Mitteleuropa, dann Ahorn-Riese, dann das flächengrößte Land.",
    payload: {
      items: ["Kanada", "Vatikanstadt", "Russland", "Deutschland"],
      correct_order: [1, 3, 0, 2],
      order_axis: "Fläche",
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne von Norden nach Süden.",
    hint: "Fjorde, dann Spree, dann Dolce Vita, dann Nil-Delta.",
    payload: {
      items: ["Rom", "Oslo", "Kairo", "Berlin"],
      correct_order: [1, 3, 0, 2],
      order_axis: "Nord → Süd",
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Welche Aussage ist falsch?",
    hint: "Erst die Unterwäsche, dann die Jeans — außer als Statement.",
    payload: {
      statements: [
        "„Guten Morgen“ passt am Vormittag.",
        "Toast kann man rösten.",
        "Ampeln haben Rot und Grün.",
        "Die Unterhose zieht man üblicherweise über die Jeans.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Drei stimmen — eine ist gelogen. Welche?",
    hint: "Augen wollen Kochsalz, kein Nivea-Spa.",
    payload: {
      statements: [
        "Ein Schaltjahr hat einen 29. Februar.",
        "Kontaktlinsen putzt man am besten mit Handcreme.",
        "Eine PIN sollte man nicht laut hersagen.",
        "In Deutschland gilt oft rechts vor links, wenn nichts anderes da ist.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Eine flunkert. Welche?",
    hint: "Trauerfeier ≠ Junggesellenabschied.",
    payload: {
      statements: [
        "Auf einer Beerdigung ruft man traditionell „Hoch die Tassen, JGA!“.",
        "Smalltalk übers Wetter ist ein Klassiker.",
        "„Du hast was im Zahn“ sagt man lieber leise.",
        "Zur Begrüßung gibt man sich oft die Hand.",
      ],
      lie_index: 0,
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Welche ist die Lüge?",
    hint: "Fünf Ziffern auf dem Brief — nicht die Hausnummer-Länge.",
    payload: {
      statements: [
        "Die Telefon-Vorwahl Deutschlands ist +49.",
        "In Deutschland gibt es Mülltrennung.",
        "Deutsche Postleitzahlen haben immer genau drei Stellen.",
        "Ein Schuko-Stecker hat Schutzkontakt.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne im Tagesablauf (frühestes zuerst).",
    hint: "Licht, dann Hunger, dann Couch, dann Geisterstunde.",
    payload: {
      items: ["Mitternacht", "Mittagessen", "Sonnenaufgang", "Feierabend"],
      correct_order: [2, 1, 3, 0],
      order_axis: "Tagesablauf",
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne die Anzieh-Reihenfolge (zuerst angezogene Sache zuerst).",
    hint: "Hautnah zuerst, dann Beine, dann halt der Hose, dann die Schicht nach draußen.",
    payload: {
      items: ["Jacke", "Gürtel", "Unterwäsche", "Hose"],
      correct_order: [2, 3, 1, 0],
      order_axis: "Anziehen",
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne den Nudel-Ablauf (erster Schritt zuerst).",
    hint: "Topf, kochen, Sieb, dann die Soße — nicht umgekehrt, außer du magst Kleister.",
    payload: {
      items: [
        "Sauce untermengen",
        "Nudeln abgießen",
        "Wasser aufsetzen",
        "Nudeln ins kochende Wasser",
      ],
      correct_order: [2, 3, 1, 0],
      order_axis: "Zubereitung",
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne den Kuchen-Ablauf (erster Schritt zuerst).",
    hint: "Rühren, hitzen, warten, dann erst die süße Krone — sonst rutscht sie in den Teig.",
    payload: {
      items: ["Glasur drauf", "Teig rühren", "auskühlen lassen", "Kuchen in den Ofen"],
      correct_order: [1, 3, 2, 0],
      order_axis: "Backen",
    },
  },
];

function uuidFor(index) {
  const n = (index + 1).toString(16).padStart(12, "0");
  return `015e0823-4a15-4000-8000-${n}`;
}

function isPermutation(order, n) {
  if (!Array.isArray(order) || order.length !== n) return false;
  const seen = new Set();
  for (const x of order) {
    if (!Number.isInteger(x) || x < 0 || x >= n || seen.has(x)) return false;
    seen.add(x);
  }
  return seen.size === n;
}

function validate(prompts) {
  const errors = [];
  const seenHash = new Set();

  if (prompts.length !== 64) errors.push(`expected 64 prompts, got ${prompts.length}`);

  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    const loc = `#${i + 1} [${p.theme_slug}/${p.mode}]`;

    if (!THEMES.includes(p.theme_slug)) errors.push(`${loc}: unknown theme_slug`);
    if (!["find_lie", "order_it"].includes(p.mode)) errors.push(`${loc}: bad mode`);
    if (!["leicht", "mittel", "schwer"].includes(p.difficulty)) errors.push(`${loc}: bad difficulty`);
    if (typeof p.prompt !== "string" || p.prompt.trim().length < 8) errors.push(`${loc}: prompt too short`);
    if (p.hint != null && typeof p.hint !== "string") errors.push(`${loc}: hint must be string`);
    if (p.active !== true) errors.push(`${loc}: active must be true`);
    if (!p.payload || typeof p.payload !== "object") errors.push(`${loc}: missing payload`);

    const blob = JSON.stringify(p);
    if (/die lüge ist/i.test(blob)) errors.push(`${loc}: spoiler phrasing in text`);

    if (p.mode === "find_lie") {
      const { statements, lie_index } = p.payload;
      if (!Array.isArray(statements) || statements.length !== 4) {
        errors.push(`${loc}: statements must be exactly 4`);
      } else {
        statements.forEach((s, si) => {
          if (typeof s !== "string" || !s.trim()) errors.push(`${loc}: empty statement ${si}`);
        });
      }
      if (!Number.isInteger(lie_index) || lie_index < 0 || lie_index > 3) {
        errors.push(`${loc}: lie_index must be 0..3, got ${lie_index}`);
      }
    }

    if (p.mode === "order_it") {
      const { items, correct_order, order_axis } = p.payload;
      if (!Array.isArray(items) || items.length !== 4) {
        errors.push(`${loc}: items must be exactly 4`);
      } else {
        items.forEach((s, si) => {
          if (typeof s !== "string" || !s.trim()) errors.push(`${loc}: empty item ${si}`);
          if (YEARISH.test(s)) errors.push(`${loc}: year in item label would spoil order: ${s}`);
        });
      }
      if (!isPermutation(correct_order, items?.length ?? 0)) {
        errors.push(`${loc}: correct_order must be permutation of 0..3, got ${JSON.stringify(correct_order)}`);
      }
      if (typeof order_axis !== "string" || !order_axis.trim()) {
        errors.push(`${loc}: missing order_axis`);
      }
    }

    const h = createHash("sha1").update(`${p.theme_slug}|${p.mode}|${p.prompt}`).digest("hex");
    if (seenHash.has(h)) errors.push(`${loc}: duplicate theme+mode+prompt`);
    seenHash.add(h);
  }

  const byThemeMode = {};
  const byDiff = { leicht: 0, mittel: 0, schwer: 0 };
  for (const p of prompts) {
    const k = `${p.theme_slug}|${p.mode}`;
    byThemeMode[k] = (byThemeMode[k] ?? 0) + 1;
    byDiff[p.difficulty]++;
  }
  for (const theme of THEMES) {
    for (const mode of ["find_lie", "order_it"]) {
      const n = byThemeMode[`${theme}|${mode}`] ?? 0;
      if (n < 4) errors.push(`${theme} ${mode}: need ≥4, got ${n}`);
    }
  }

  return { errors, byThemeMode, byDiff };
}

function sqlEscapeDollar(text, tag) {
  if (text.includes(`$${tag}$`)) {
    throw new Error(`payload contains dollar-tag $${tag}$`);
  }
  return `$${tag}$${text}$${tag}$`;
}

function toSql(prompts) {
  const rows = prompts.map((p, i) => {
    const id = uuidFor(i);
    const payload = JSON.stringify(p.payload);
    return `  (
    '${id}'::uuid,
    ${sqlEscapeDollar(p.theme_slug, "s")},
    ${sqlEscapeDollar(p.mode, "m")},
    ${sqlEscapeDollar(p.difficulty, "d")},
    ${sqlEscapeDollar(p.prompt, "p")},
    ${sqlEscapeDollar(p.hint ?? "", "h")},
    ${sqlEscapeDollar(payload, "j")}::jsonb
  )`;
  });

  return `-- Seed: find_lie + order_it v1 (64 prompts)
-- Idempotent via ON CONFLICT (id). Does NOT touch number_guess / pick_correct.
-- Resolves theme_id via slug. Sets active = true.
-- Source: content/seed-find-lie-order-it-v1.json
--
-- Apply on project uwbhgveknypqvrwazleq:
--   Dashboard → SQL Editor → paste this file → Run
--   or: supabase db query -f supabase/migrations/20260823_015_seed_find_lie_order_it.sql --linked

INSERT INTO prompts (id, theme_id, mode, difficulty, prompt, hint, payload, active)
SELECT
  v.id,
  t.id,
  v.mode,
  v.difficulty,
  v.prompt,
  NULLIF(v.hint, ''),
  v.payload,
  true
FROM (
  VALUES
${rows.join(",\n")}
) AS v(id, theme_slug, mode, difficulty, prompt, hint, payload)
JOIN themes t ON t.slug = v.theme_slug
ON CONFLICT (id) DO NOTHING;

-- Fail if a theme slug did not resolve (JOIN would drop rows).
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM prompts
  WHERE id >= '015e0823-4a15-4000-8000-000000000001'::uuid
    AND id <= '015e0823-4a15-4000-8000-000000000040'::uuid;
  IF n < 64 THEN
    RAISE EXCEPTION 'find_lie/order_it v1 seed: expected 64 rows, got % — check theme slugs', n;
  END IF;
END $$;
`;
}

function countsTable(prompts) {
  const lines = [];
  lines.push("| Thema | find_lie | order_it | leicht | mittel | schwer | Summe |");
  lines.push("|-------|----------|----------|--------|--------|--------|-------|");
  for (const theme of THEMES) {
    const rows = prompts.filter((p) => p.theme_slug === theme);
    const fl = rows.filter((p) => p.mode === "find_lie").length;
    const oi = rows.filter((p) => p.mode === "order_it").length;
    const l = rows.filter((p) => p.difficulty === "leicht").length;
    const m = rows.filter((p) => p.difficulty === "mittel").length;
    const s = rows.filter((p) => p.difficulty === "schwer").length;
    lines.push(`| ${theme} | ${fl} | ${oi} | ${l} | ${m} | ${s} | ${rows.length} |`);
  }
  const l = prompts.filter((p) => p.difficulty === "leicht").length;
  const m = prompts.filter((p) => p.difficulty === "mittel").length;
  const s = prompts.filter((p) => p.difficulty === "schwer").length;
  const fl = prompts.filter((p) => p.mode === "find_lie").length;
  const oi = prompts.filter((p) => p.mode === "order_it").length;
  lines.push(`| **total** | **${fl}** | **${oi}** | **${l}** | **${m}** | **${s}** | **${prompts.length}** |`);
  return lines.join("\n");
}

const prompts = RAW.map((p) => ({ ...p, active: true }));
const { errors, byDiff } = validate(prompts);
if (errors.length) {
  console.error("Validation failed:\n" + errors.map((e) => "- " + e).join("\n"));
  process.exit(1);
}

const jsonPath = join(ROOT, "content/seed-find-lie-order-it-v1.json");
const sqlPath = join(ROOT, "supabase/migrations/20260823_015_seed_find_lie_order_it.sql");
const seedPath = join(ROOT, "supabase/seed/prompts_find_lie_order_it_v1.sql");

mkdirSync(dirname(jsonPath), { recursive: true });
writeFileSync(jsonPath, JSON.stringify({ prompts }, null, 2) + "\n");
const sql = toSql(prompts);
writeFileSync(sqlPath, sql);
writeFileSync(seedPath, sql);

console.log("OK — wrote");
console.log(" ", jsonPath);
console.log(" ", sqlPath);
console.log(" ", seedPath);
console.log("\n" + countsTable(prompts));
console.log(
  `\nDifficulty mix: leicht ${byDiff.leicht} (${((byDiff.leicht / 64) * 100).toFixed(1)}%) · mittel ${byDiff.mittel} (${((byDiff.mittel / 64) * 100).toFixed(1)}%) · schwer ${byDiff.schwer} (${((byDiff.schwer / 64) * 100).toFixed(1)}%)`,
);
console.log("All lie_index in 0..3 and all correct_order permutations: pass");
