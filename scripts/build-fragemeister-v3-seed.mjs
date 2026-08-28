#!/usr/bin/env node
/**
 * Fragemeister pack v3: another 10 prompts per playable mode, all 8 themes.
 * Continues v2 UUIDs (029–050). No hints. Does not rewrite older packs.
 * JSON is the source pack; SQL is generated from it.
 */
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
const MODES = ["number_guess", "pick_correct", "find_lie", "order_it"];
const YEARISH = /\b(19[0-9]{2}|20[0-2][0-9])\b/;
const UUID_PREFIX = "025e0825-4a15-4000-8000-";
/** v2 occupied 001–028 (hex); this pack starts at 029. */
const UUID_OFFSET = 40;

/** @type {Array<Record<string, unknown>>} */
const RAW = [
  // ============================================================
  // number_guess — genuine Fermi/Schätzfragen
  // ============================================================
  {
    theme_slug: "gaming",
    mode: "number_guess",
    difficulty: "schwer",
    prompt:
      "Wie viele Tetris-Einheiten wurden ungefähr weltweit verkauft — alle offiziellen Versionen zusammen (Stand 2026)?",
    payload: {
      answer: 520000000,
      unit: null,
      plausibility_note:
        "The Tetris Company: über 520 Millionen verkaufte Einheiten (Pressemitteilungen 2024–2026).",
    },
  },
  {
    theme_slug: "gaming",
    mode: "number_guess",
    difficulty: "mittel",
    prompt:
      "Wie viele Exemplare von Grand Theft Auto V wurden ungefähr verkauft (alle Plattformen, Stand 2026)?",
    payload: {
      answer: 230000000,
      unit: null,
      plausibility_note:
        "Take-Two Interactive, Investorenupdate August 2026: über 230 Millionen Einheiten.",
    },
  },
  {
    theme_slug: "geschichte",
    mode: "number_guess",
    difficulty: "mittel",
    prompt:
      "Wie viele Einwanderer wurden ungefähr über Ellis Island abgefertigt, solange die Station in Betrieb war?",
    payload: {
      answer: 12000000,
      unit: null,
      plausibility_note:
        "U.S. National Park Service: rund 12 Millionen Menschen zwischen 1892 und 1954.",
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "number_guess",
    difficulty: "schwer",
    prompt:
      "Wie viele Ameisen leben ungefähr gleichzeitig auf der Erde — einzelne Tiere, nicht Arten?",
    payload: {
      answer: 20000000000000000,
      unit: null,
      plausibility_note:
        "Schultheiss et al., PNAS 2022: konservativ etwa 20×10^15 Tiere, also 20 Billiarden.",
    },
  },
  {
    theme_slug: "sport",
    mode: "number_guess",
    difficulty: "mittel",
    prompt:
      "Wie viele Menschen laufen ungefähr weltweit in einem starken Jahr einen Marathon zu Ende (Finisher)?",
    payload: {
      answer: 1100000,
      unit: null,
      plausibility_note:
        "RunRepeat-Auswertung der großen Stadtmarathons: Größenordnung 1,1 Millionen Finisher in Spitzenjahren.",
    },
  },
  {
    theme_slug: "musik",
    mode: "number_guess",
    difficulty: "mittel",
    prompt:
      "Wie viele Besucher waren ungefähr beim Original-Woodstock-Festival 1969 über das ganze Wochenende auf dem Gelände?",
    payload: {
      answer: 450000,
      unit: null,
      plausibility_note:
        "Keine amtliche Zählung; gängige Schätzungen liegen zwischen 400.000 und 500.000, oft bei 450.000.",
    },
  },
  {
    theme_slug: "film-serie",
    mode: "number_guess",
    difficulty: "mittel",
    prompt:
      "Wie viele Kinoleinwände (einzelne Screens, nicht Kinosäle-Gebäude) gibt es ungefähr weltweit?",
    payload: {
      answer: 220000,
      unit: null,
      plausibility_note:
        "European Audiovisual Observatory, FOCUS 2025/26: mehr als 220.000 Leinwände (vor der Pandemie ~200.000).",
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "number_guess",
    difficulty: "mittel",
    prompt:
      "Wie viele lebende Sprachen gibt es ungefähr auf der Welt — nicht Dialekte, sondern katalogisierte Einzelsprachen?",
    payload: {
      answer: 7200,
      unit: null,
      plausibility_note:
        "Ethnologue 28./29. Edition: rund 7.160–7.170 lebende Sprachen; Schätzfrage zielt auf 7.200.",
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "number_guess",
    difficulty: "schwer",
    prompt:
      "Wie viele planmäßige Linienflüge starten ungefähr an einem durchschnittlichen Tag weltweit?",
    payload: {
      answer: 100000,
      unit: null,
      plausibility_note:
        "ICAO 2024: 37,4 Millionen Abflüge im Jahr → grob 100.000 pro Tag; OAG lag 2026 ähnlich.",
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "number_guess",
    difficulty: "schwer",
    prompt:
      "Wie viele E-Mails werden ungefähr weltweit an einem Tag verschickt und empfangen (Stand 2026)?",
    payload: {
      answer: 390000000000,
      unit: null,
      plausibility_note:
        "Statista-Schätzung: etwa 376 Milliarden (2025) bzw. 393 Milliarden (2026) E-Mails pro Tag.",
    },
  },

  // ============================================================
  // pick_correct — 8 Karten, 4 richtig
  // ============================================================
  {
    theme_slug: "gaming",
    mode: "pick_correct",
    difficulty: "schwer",
    prompt:
      "Welche Spiele kamen zuerst exklusiv auf einer PlayStation-Konsole heraus — nicht Xbox, nicht Nintendo?",
    payload: {
      cards: [
        "Halo: Combat Evolved",
        "Metal Gear Solid",
        "The Legend of Zelda: Breath of the Wild",
        "Bloodborne",
        "Gears of War",
        "The Last of Us",
        "Super Mario Odyssey",
        "God of War (Kratos in Midgard)",
      ],
      correct_indices: [1, 3, 5, 7],
    },
  },
  {
    theme_slug: "geschichte",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt:
      "Welche Ereignisse gehören in die Zeit des Kalten Krieges (ungefähr 1947 bis 1991)?",
    payload: {
      cards: [
        "Sputnik startet",
        "Fall Konstantinopels",
        "Kubakrise",
        "Französische Revolution",
        "Bau der Berliner Mauer",
        "Kolumbus landet in der Karibik",
        "Reaktorunglück Tschernobyl",
        "Anschläge vom 11. September",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt:
      "Welche Tiere sind Vögel — keine Säugetiere, keine Insekten, keine ausgestorbenen Flugsaurier?",
    payload: {
      cards: [
        "Pinguin",
        "Fledermaus",
        "Strauß",
        "Delfin",
        "Kiwi",
        "Schmetterling",
        "Buntspecht",
        "Pteranodon",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "pick_correct",
    difficulty: "schwer",
    prompt:
      "Welche Größen sind SI-Basiseinheiten — keine abgeleiteten Einheiten und kein Alltagsgrad?",
    payload: {
      cards: [
        "Joule",
        "Meter",
        "Liter",
        "Sekunde",
        "Newton",
        "Kelvin",
        "Grad Celsius",
        "Ampere",
      ],
      correct_indices: [1, 3, 5, 7],
    },
  },
  {
    theme_slug: "sport",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt:
      "Welche Sportarten werden auf Eis ausgetragen — nicht auf Schnee?",
    payload: {
      cards: [
        "Eiskunstlauf",
        "Ski alpin",
        "Eishockey",
        "Snowboard",
        "Curling",
        "Biathlon",
        "Shorttrack",
        "Skispringen",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "musik",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt:
      "Welche Instrumente gehören zur Holzbläserfamilie — nicht zu den Blechbläsern?",
    payload: {
      cards: [
        "Querflöte",
        "Trompete",
        "Klarinette",
        "Posaune",
        "Oboe",
        "Waldhorn",
        "Fagott",
        "Tuba",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "film-serie",
    mode: "pick_correct",
    difficulty: "schwer",
    prompt: "Welche Filme hat Alfred Hitchcock selbst inszeniert?",
    payload: {
      cards: [
        "Citizen Kane",
        "Psycho",
        "Der weiße Hai",
        "Das Fenster zum Hof",
        "Shining",
        "Vertigo",
        "Casablanca",
        "Die Vögel",
      ],
      correct_indices: [1, 3, 5, 7],
    },
  },
  {
    theme_slug: "film-serie",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt:
      "Welche Serien starteten als Netflix-Eigenproduktion — nicht HBO, AMC oder US-Network?",
    payload: {
      cards: [
        "Stranger Things",
        "Breaking Bad",
        "The Crown",
        "The Sopranos",
        "House of Cards",
        "Game of Thrones",
        "Orange Is the New Black",
        "The Office (US)",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "pick_correct",
    difficulty: "schwer",
    prompt: "Welche Städte liegen nördlich des Polarkreises?",
    payload: {
      cards: [
        "Tromsø",
        "Reykjavík",
        "Murmansk",
        "Helsinki",
        "Longyearbyen",
        "Oslo",
        "Narvik",
        "Stockholm",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt:
      "Welche Lebensmittel fermentieren in der klassischen Herstellung — Mikroben arbeiten mit?",
    payload: {
      cards: [
        "Joghurt",
        "Mineralwasser",
        "Sauerkraut",
        "Olivenöl extra vergine",
        "Kimchi",
        "Bienenhonig aus dem Glas",
        "Sauerteigbrot",
        "H-Milch",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },

  // ============================================================
  // find_lie — plausible truths, one subtle lie
  // ============================================================
  {
    theme_slug: "gaming",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Nintendo-Hardware: eine Behauptung ist gelogen. Welche?",
    payload: {
      statements: [
        "Die Wii hieß intern während der Entwicklung „Revolution“.",
        "Der originale Game Boy erschien in Japan 1989.",
        "Super Mario Bros. erschien zuerst exklusiv auf dem Nintendo 64.",
        "Die Switch kann sowohl angedockt am Fernseher als auch als Handheld gespielt werden.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "geschichte",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Antike und Kaiser: drei stimmen, eine ist Quatsch. Welche?",
    payload: {
      statements: [
        "Kleopatra lebte zeitlich näher an der ersten iPhone-Keynote als am Bau der Pyramiden von Gizeh.",
        "Julius Caesar war der erste römische Kaiser im Sinn des Prinzipats.",
        "Die Berliner Mauer fiel 1989.",
        "Die Titanic sank auf ihrer Jungfernfahrt.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "geschichte",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Weltreiche: eine flunkert. Welche?",
    payload: {
      statements: [
        "Das Osmanische Reich endete in den Jahren nach dem Ersten Weltkrieg.",
        "Die Inka errichteten Machu Picchu.",
        "Wikinger erreichten Amerika vor Kolumbus.",
        "Das Heilige Römische Reich war räumlich deckungsgleich mit dem heutigen Italien.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Physik im Alltag: welche Aussage ist falsch?",
    payload: {
      statements: [
        "Reines Wasser hat bei etwa 4 °C seine größte Dichte.",
        "Diamanten sind härter als Graphit, obwohl beide aus Kohlenstoff bestehen.",
        "Die Erde ist der Sonne im Juli näher als im Januar.",
        "Sonnenlicht braucht grob acht Minuten bis zur Erde.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "sport",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Sportregeln und Maße: eine flunkert. Welche?",
    payload: {
      statements: [
        "Die Marathon-Distanz beträgt 42,195 Kilometer.",
        "Beim Tennis zählt man in einem Spiel 15, 30, 40.",
        "Ein internationales Fußballfeld muss exakt 100 Meter lang sein — keinen Meter anders.",
        "Ein Distanzwurf hinter der Dreierlinie zählt im Basketball drei Punkte.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "musik",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Pop und Klassik: welche Behauptung ist falsch?",
    payload: {
      statements: [
        "Eine Standard-Gitarre hat sechs Saiten.",
        "Beethoven schrieb neun Sinfonien.",
        "ABBA gewann den Eurovision Song Contest für Norwegen.",
        "Das Kammerton-A liegt heute üblicherweise bei 440 Hertz.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "film-serie",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Hollywood-Fakten: eine Aussage lügt. Welche?",
    payload: {
      statements: [
        "Der Pate entstand unter der Regie von Francis Ford Coppola.",
        "Titanic spielt zur Zeit des Untergangs 1912.",
        "E.T. – Der Außerirdische stammt von Steven Spielberg.",
        "Der erste Kinofilm der Star-Wars-Saga hieß im Original „Return of the Jedi“.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Kontinente und Staaten: welche Aussage ist falsch?",
    payload: {
      statements: [
        "Australien ist zugleich Kontinent und Staat.",
        "Der Vatikan ist der flächenmäßig kleinste anerkannte Staat der Welt.",
        "Die Sahara liegt ausschließlich in Ägypten.",
        "Japan besteht aus mehreren Hauptinseln, nicht nur aus einer.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "find_lie",
    difficulty: "leicht",
    prompt: "Küche und Technik: welche ist gelogen?",
    payload: {
      statements: [
        "Rohes Hühnchen sollte man nicht auf demselben ungereinigten Brett wie Salat schneiden.",
        "Auf Meereshöhe kocht Wasser bei etwa 100 °C.",
        "Die Mikrowelle macht Speisen radioaktiv.",
        "Backhefe braucht Zucker oder Stärke, um Teig aufgehen zu lassen.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Handy, WLAN, Alltag: eine flunkert. Welche?",
    payload: {
      statements: [
        "In Deutschland darf man am Steuer nur mit Freisprecheinrichtung telefonieren.",
        "QWERTZ tauscht gegenüber QWERTY unter anderem Y und Z.",
        "Das WLAN aus dem Heimrouter kocht das Gehirn wie ein Mikrowellenherd.",
        "USB-C kann je nach Gerät Laden und Datenübertragung.",
      ],
      lie_index: 2,
    },
  },

  // ============================================================
  // order_it — no years in labels
  // ============================================================
  {
    theme_slug: "gaming",
    mode: "order_it",
    difficulty: "mittel",
    prompt:
      "Ordne diese Videospiel-Klassiker nach Erstveröffentlichung (älteste zuerst).",
    payload: {
      items: ["Minecraft", "Pac-Man", "Doom", "Tetris"],
      correct_order: [1, 3, 2, 0],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "geschichte",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne diese Bauwerke nach Fertigstellung (frühestes zuerst).",
    payload: {
      items: [
        "Eiffelturm",
        "Kolosseum",
        "Machu Picchu",
        "Pyramiden von Gizeh",
      ],
      correct_order: [3, 1, 2, 0],
      order_axis: "chronologisch",
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne diese Erdzeitalter (ältestes zuerst).",
    payload: {
      items: ["Jura", "Quartär", "Kambrium", "Kreide"],
      correct_order: [2, 0, 3, 1],
      order_axis: "Erdgeschichte",
    },
  },
  {
    theme_slug: "sport",
    mode: "order_it",
    difficulty: "schwer",
    prompt:
      "Ordne nach der ersten Fußball-WM, die in diesem Land ausgetragen wurde (früheste zuerst).",
    payload: {
      items: ["England", "Uruguay", "Deutschland", "Italien"],
      correct_order: [1, 3, 0, 2],
      order_axis: "erste WM-Austragung",
    },
  },
  {
    theme_slug: "sport",
    mode: "order_it",
    difficulty: "leicht",
    prompt: "Ordne die Spielflächen nach Größe (kleinste zuerst).",
    payload: {
      items: [
        "Fußballfeld",
        "Tischtennisplatte",
        "Basketballfeld",
        "Tennisplatz",
      ],
      correct_order: [1, 3, 2, 0],
      order_axis: "Spielfläche",
    },
  },
  {
    theme_slug: "musik",
    mode: "order_it",
    difficulty: "schwer",
    prompt:
      "Ordne diese Jazz- und Rock-Alben nach Erstveröffentlichung (älteste zuerst).",
    payload: {
      items: [
        "Rumours (Fleetwood Mac)",
        "Kind of Blue (Miles Davis)",
        "What's Going On (Marvin Gaye)",
        "Highway 61 Revisited (Bob Dylan)",
      ],
      correct_order: [1, 3, 2, 0],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "musik",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne diese Beatles-Alben nach UK-Erstveröffentlichung (älteste zuerst).",
    payload: {
      items: ["Abbey Road", "Please Please Me", "Sgt. Pepper", "Rubber Soul"],
      correct_order: [1, 3, 2, 0],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "film-serie",
    mode: "order_it",
    difficulty: "mittel",
    prompt:
      "Ordne diese Marvel-Filme nach US-Kinostart (älteste zuerst).",
    payload: {
      items: [
        "The Avengers",
        "Iron Man",
        "Captain America: The First Avenger",
        "Thor",
      ],
      correct_order: [1, 3, 2, 0],
      order_axis: "Kinostart",
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne die Bauwerke nach Höhe (niedrigstes zuerst).",
    payload: {
      items: [
        "Empire State Building",
        "Schiefer Turm von Pisa",
        "Burj Khalifa",
        "Eiffelturm",
      ],
      correct_order: [1, 3, 0, 2],
      order_axis: "Höhe",
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "order_it",
    difficulty: "mittel",
    prompt:
      "Ordne nach typischer Haltbarkeit im Kühlschrank nach dem Öffnen bzw. Frischkauf (kürzeste zuerst).",
    payload: {
      items: [
        "Hartkäse",
        "rohes Hackfleisch",
        "Hühnereier",
        "geöffnete Frischmilch",
      ],
      correct_order: [1, 3, 2, 0],
      order_axis: "Haltbarkeit",
    },
  },
];

function uuidFor(index) {
  const n = (index + 1 + UUID_OFFSET).toString(16).padStart(12, "0");
  return `${UUID_PREFIX}${n}`;
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

  if (prompts.length !== 40) errors.push(`expected 40 prompts, got ${prompts.length}`);

  const byMode = Object.fromEntries(MODES.map((m) => [m, 0]));
  const byTheme = Object.fromEntries(THEMES.map((t) => [t, 0]));

  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    const loc = `#${i + 1} [${p.theme_slug}/${p.mode}]`;

    if (!THEMES.includes(p.theme_slug)) errors.push(`${loc}: unknown theme_slug`);
    if (!MODES.includes(p.mode)) errors.push(`${loc}: bad mode`);
    if (!["leicht", "mittel", "schwer"].includes(p.difficulty)) {
      errors.push(`${loc}: bad difficulty`);
    }
    if (typeof p.prompt !== "string" || p.prompt.trim().length < 8) {
      errors.push(`${loc}: prompt too short`);
    }
    if (p.hint != null && String(p.hint).trim() !== "") {
      errors.push(`${loc}: question hints are retired — hint must be null`);
    }
    if (p.active !== true) errors.push(`${loc}: active must be true`);
    if (!p.payload || typeof p.payload !== "object") errors.push(`${loc}: missing payload`);

    const blob = JSON.stringify(p);
    if (/die lüge ist/i.test(blob)) errors.push(`${loc}: spoiler phrasing in text`);

    if (p.mode === "number_guess") {
      const { answer, plausibility_note } = p.payload;
      if (typeof answer !== "number" || !Number.isFinite(answer) || answer <= 0) {
        errors.push(`${loc}: number_guess.answer must be a positive finite number`);
      }
      if (answer === 3650000 || answer === 10000 * 365) {
        errors.push(`${loc}: trivial 10000×365-style answer`);
      }
      if (typeof plausibility_note !== "string" || plausibility_note.length < 12) {
        errors.push(`${loc}: missing plausibility_note`);
      }
      if (p.difficulty === "leicht") {
        errors.push(`${loc}: Schätzfragen in this pack must not be leicht`);
      }
    }

    if (p.mode === "pick_correct") {
      const { cards, correct_indices } = p.payload;
      if (!Array.isArray(cards) || cards.length !== 8) {
        errors.push(`${loc}: pick_correct needs exactly 8 cards`);
      } else {
        cards.forEach((c, ci) => {
          if (typeof c !== "string" || !c.trim()) errors.push(`${loc}: empty card ${ci}`);
        });
        if (new Set(cards).size !== cards.length) errors.push(`${loc}: duplicate cards`);
      }
      const uniq = Array.isArray(correct_indices) ? new Set(correct_indices) : new Set();
      if (
        !Array.isArray(correct_indices) ||
        correct_indices.length !== 4 ||
        uniq.size !== 4 ||
        [...uniq].some((x) => !Number.isInteger(x) || x < 0 || x > 7)
      ) {
        errors.push(`${loc}: correct_indices must be 4 unique indexes 0..7`);
      }
    }

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
        errors.push(
          `${loc}: correct_order must be permutation of 0..3, got ${JSON.stringify(correct_order)}`,
        );
      }
      if (typeof order_axis !== "string" || !order_axis.trim()) {
        errors.push(`${loc}: missing order_axis`);
      }
    }

    byMode[p.mode] += 1;
    byTheme[p.theme_slug] += 1;
  }

  for (const mode of MODES) {
    if (byMode[mode] !== 10) errors.push(`${mode}: expected 10 prompts, got ${byMode[mode]}`);
  }
  for (const theme of THEMES) {
    if (byTheme[theme] !== 5) errors.push(`${theme}: expected 5 prompts, got ${byTheme[theme]}`);
  }

  return { errors, byMode, byTheme };
}

function sqlEscapeDollar(text, tag) {
  if (text.includes(`$${tag}$`)) {
    throw new Error(`payload contains dollar-tag $${tag}$`);
  }
  return `$${tag}$${text}$${tag}$`;
}

function toSql(prompts) {
  const firstId = uuidFor(0);
  const lastId = uuidFor(prompts.length - 1);
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

  return `-- Seed: Fragemeister v3 (another ~10 prompts per mode, all 8 themes)
-- Idempotent via ON CONFLICT (id). Does not rewrite older packs.
-- Source: content/seed-fragemeister-v3.json
--
-- Apply on project uwbhgveknypqvrwazleq:
--   Dashboard → SQL Editor → paste this file → Run

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

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM prompts
  WHERE id >= '${firstId}'::uuid
    AND id <= '${lastId}'::uuid;
  IF n < 40 THEN
    RAISE EXCEPTION 'fragemeister v3 seed: expected 40 rows, got % — check theme slugs', n;
  END IF;
END $$;
`;
}

const prompts = RAW.map((p) => ({ ...p, hint: null, active: true }));
const { errors, byMode, byTheme } = validate(prompts);
if (errors.length) {
  console.error("Validation failed:\n" + errors.map((e) => "- " + e).join("\n"));
  process.exit(1);
}

const jsonPath = join(ROOT, "content/seed-fragemeister-v3.json");
const sqlPath = join(ROOT, "supabase/migrations/20260825_020_seed_fragemeister_v3.sql");
const seedPath = join(ROOT, "supabase/seed/prompts_fragemeister_v3.sql");

mkdirSync(dirname(jsonPath), { recursive: true });
writeFileSync(jsonPath, JSON.stringify({ prompts }, null, 2) + "\n");
const sql = toSql(prompts);
writeFileSync(sqlPath, sql);
writeFileSync(seedPath, sql);

console.log("OK — wrote");
console.log(" ", jsonPath);
console.log(" ", sqlPath);
console.log(" ", seedPath);
console.log("\nBy mode:", byMode);
console.log("By theme:", byTheme);
console.log("IDs:", uuidFor(0), "…", uuidFor(prompts.length - 1));
console.log("All payload shapes valid.");
