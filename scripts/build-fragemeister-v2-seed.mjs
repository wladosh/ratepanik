#!/usr/bin/env node
/**
 * Fragemeister pack v2: ~10 prompts per playable mode, spread across all themes.
 * Deactivates the trivial 10.000-steps × 365 Schätzfrage.
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
const STEPS_PROMPT_ID = "f2391b41-fbc3-483e-957c-0de213ad5581";
const UUID_PREFIX = "025e0825-4a15-4000-8000-";

/** @type {Array<Record<string, unknown>>} */
const RAW = [
  // ============================================================
  // number_guess — genuine Fermi/Schätzfragen, no school-times-365
  // ============================================================
  {
    theme_slug: "gaming",
    mode: "number_guess",
    difficulty: "schwer",
    prompt:
      "Wie viele Pokémon-Sammelkarten wurden ungefähr weltweit schon gedruckt (Stand 2026)?",
    hint: "Denk in Zehnermilliarden — die Drucker laufen seit 1996.",
    payload: {
      answer: 85000000000,
      unit: null,
      plausibility_note:
        "The Pokémon Company: über 85 Milliarden Karten bis März 2026.",
    },
  },
  {
    theme_slug: "gaming",
    mode: "number_guess",
    difficulty: "mittel",
    prompt:
      "Wie viele Spiele sind ungefähr jemals auf Steam erschienen (Größenordnung, Stand 2026)?",
    hint: "Mehr als ein volles Fußballstadion an Covern, klar unter einer Million.",
    payload: {
      answer: 130000,
      unit: null,
      plausibility_note:
        "SteamDB lag 2026 bei grob 130.000 jemals erschienenen Titeln (Store schwankt durch Delistings).",
    },
  },
  {
    theme_slug: "geschichte",
    mode: "number_guess",
    difficulty: "schwer",
    prompt:
      "Wie viele Menschen sind ungefähr jemals geboren worden — alle Generationen zusammen, nicht nur die heute Lebenden?",
    hint: "Deutlich mehr als die heutigen acht Milliarden, aber keine Billiarde.",
    payload: {
      answer: 117000000000,
      unit: null,
      plausibility_note:
        "Population Reference Bureau 2022: ca. 117 Milliarden Geburten seit dem Auftreten des Homo sapiens.",
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "number_guess",
    difficulty: "schwer",
    prompt: "Wie viele Bäume stehen ungefähr auf der ganzen Erde?",
    hint: "Eine große Ökologie-Zählung landete bei einer Zahl mit 13 Stellen.",
    payload: {
      answer: 3000000000000,
      unit: null,
      plausibility_note:
        "Crowther et al., Nature 2015: ca. 3,04 Billionen Bäume (deutsche Billion = 10^12).",
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "number_guess",
    difficulty: "mittel",
    prompt:
      "Wie viele Nervenzellen (Neuronen) hat ein menschliches Gehirn ungefähr?",
    hint: "Die alte Schulbuch-100-Milliarden waren zu hoch gegriffen.",
    payload: {
      answer: 86000000000,
      unit: null,
      plausibility_note:
        "Azevedo / Herculano-Houzel: im Schnitt ca. 86 Milliarden Neuronen.",
    },
  },
  {
    theme_slug: "sport",
    mode: "number_guess",
    difficulty: "schwer",
    prompt:
      "Wie viele Tennisbälle werden ungefähr während eines kompletten Wimbledon-Turniers verbraucht?",
    hint: "Keine paar Dosen — eher ein ganzes Lager voller Dosen.",
    payload: {
      answer: 55000,
      unit: null,
      plausibility_note:
        "AELTC-Angaben liegen typischerweise bei grob 54.000–65.000 Bällen; gängige Größe 55.000.",
    },
  },
  {
    theme_slug: "musik",
    mode: "number_guess",
    difficulty: "schwer",
    prompt:
      "Wie viele Menschen waren ungefähr beim Rekord-Open-Air von Rod Stewart an der Copacabana (Silvester 1994) live vor Ort?",
    hint: "Größer als manches Bundesland — aber keine zehn Millionen.",
    payload: {
      answer: 3500000,
      unit: null,
      plausibility_note:
        "Guinness / Stadt Rio: ca. 3,5 Millionen, inkl. Silvester-Feuerwerk-Publikum am Strand.",
    },
  },
  {
    theme_slug: "film-serie",
    mode: "number_guess",
    difficulty: "schwer",
    prompt:
      "Wie viele Statisten kamen ungefähr in der Beerdigungsszene von „Gandhi“ (1982) zum Einsatz?",
    hint: "Eine ganze Großstadt als Komparsen — kein CGI-Schwarm.",
    payload: {
      answer: 300000,
      unit: null,
      plausibility_note:
        "Guinness World Records: über 300.000 Extras, oft als Film-Rekord zitiert.",
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "number_guess",
    difficulty: "schwer",
    prompt: "Wie viele Nieten halten ungefähr den Eiffelturm zusammen?",
    hint: "Millionen, nicht Tausende — jedes Eisenstück will gehalten werden.",
    payload: {
      answer: 2500000,
      unit: null,
      plausibility_note:
        "Offizielle Angabe der Turmverwaltung: ca. 2,5 Millionen Nieten.",
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "number_guess",
    difficulty: "schwer",
    prompt:
      "Wie viele Bläschen entstehen ungefähr, wenn eine 0,75-Liter-Flasche Champagner komplett ausperlt?",
    hint: "Nicht eine Million und nicht eine Milliarde — irgendwo dazwischen.",
    payload: {
      answer: 50000000,
      unit: null,
      plausibility_note:
        "Theoretische CO₂-Bilanz (Uni Reims / Liger-Belair-Umrechnung): grob 49 Millionen mögliche Blasen; Party-Ziel 50 Millionen.",
    },
  },

  // ============================================================
  // pick_correct — 8 Karten, 4 richtig, knifflige Distraktoren
  // ============================================================
  {
    theme_slug: "gaming",
    mode: "pick_correct",
    difficulty: "schwer",
    prompt:
      "Welche Spiele hat Hideo Kojima maßgeblich als Autor oder Regisseur verantwortet?",
    hint: "Metal Gear ist die Visitenkarte — Silent Hill und Bloodborne gehören woanders hin.",
    payload: {
      cards: [
        "Silent Hill 2",
        "Metal Gear Solid",
        "Resident Evil 4",
        "Death Stranding",
        "Bloodborne",
        "Snatcher",
        "The Last of Us",
        "P.T.",
      ],
      correct_indices: [1, 3, 5, 7],
    },
  },
  {
    theme_slug: "geschichte",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt:
      "Welche Ereignisse lagen zeitlich vor Kolumbus’ erster Landung in der Karibik?",
    hint: "Luther, Magellan und die Revolution kommen später. Wikinger und Buchdruck nicht.",
    payload: {
      cards: [
        "Fall Konstantinopels",
        "95 Thesen Luthers",
        "Wikinger erreichen Vinland",
        "Magellan sticht zur Weltumsegelung in See",
        "Buchdruck mit beweglichen Lettern in Mainz",
        "Französische Revolution",
        "Azteken gründen Tenochtitlán",
        "Erste iPhone-Keynote",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "geschichte",
    mode: "pick_correct",
    difficulty: "schwer",
    prompt:
      "Welche Personen herrschten wirklich als Königin oder Kaiserin aus eigenem Recht — nicht nur als Gemahlin?",
    hint: "Krone selbst tragen zählt. First Ladies und Königinnen-Gemahlinnen fliegen raus.",
    payload: {
      cards: [
        "Hatschepsut",
        "Marie-Antoinette",
        "Elisabeth I. von England",
        "Eva Perón",
        "Maria Theresia",
        "Jackie Kennedy",
        "Katharina die Große",
        "Wallis Simpson",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt:
      "Welche Einheiten messen Energie — nicht Kraft, nicht Leistung, nicht Druck?",
    hint: "Joule und Verwandte. Newton drückt, Watt leistet, Pascal presst.",
    payload: {
      cards: [
        "Joule",
        "Newton",
        "Kilowattstunde",
        "Watt",
        "Kalorie",
        "Pascal",
        "Elektronenvolt",
        "Ampere",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "sport",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt:
      "Welche Sportarten waren mindestens einmal olympisch, stehen 2026 aber nicht im Sommer- oder Winterprogramm?",
    hint: "Klassiker wie Schwimmen bleiben. Polo, Tauziehen und historische Raritäten nicht.",
    payload: {
      cards: [
        "Tauziehen",
        "Schwimmen",
        "Polo zu Pferd",
        "Leichtathletik",
        "Jeu de Paume",
        "Turnen",
        "Croquet",
        "Fechten",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "musik",
    mode: "pick_correct",
    difficulty: "schwer",
    prompt: "Welche Werke sind Opern — keine Musicals und keine Operetten?",
    hint: "Verdi, Puccini, Mozart, Bizet. Die Fledermaus tanzt in einem anderen Fach.",
    payload: {
      cards: [
        "Carmen",
        "Cats",
        "La Traviata",
        "Die Fledermaus",
        "Tosca",
        "Hamilton",
        "Die Zauberflöte",
        "West Side Story",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "film-serie",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt:
      "Welche Serien liefen ursprünglich als HBO-Eigenproduktion — nicht Netflix, AMC oder BBC?",
    hint: "New Jersey, Baltimore, Roy-Familie, Louisiana-Cops. Walter White war bei AMC.",
    payload: {
      cards: [
        "The Sopranos",
        "Breaking Bad",
        "Succession",
        "Stranger Things",
        "The Wire",
        "The Office (US)",
        "True Detective",
        "Sherlock",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "film-serie",
    mode: "pick_correct",
    difficulty: "schwer",
    prompt:
      "Welche Filme hat Hayao Miyazaki selbst inszeniert — nicht nur „irgendwas von Ghibli“?",
    hint: "Chihiro, Totoro, Mononoke, Howl. Glühwürmchen und Akira haben andere Regisseure.",
    payload: {
      cards: [
        "Chihiros Reise ins Zauberland",
        "Die letzten Glühwürmchen",
        "Prinzessin Mononoke",
        "Perfect Blue",
        "Mein Nachbar Totoro",
        "Akira",
        "Das wandelnde Schloss",
        "Your Name",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "pick_correct",
    difficulty: "mittel",
    prompt: "Welche dieser Hauptstädte liegen südlich des Äquators?",
    hint: "Ozeanien, Südamerika, Neuseeland. Kairo und Madrid bleiben auf der Nordhalbkugel.",
    payload: {
      cards: [
        "Canberra",
        "Mexiko-Stadt",
        "Brasília",
        "Kairo",
        "Wellington",
        "Bangkok",
        "Buenos Aires",
        "Madrid",
      ],
      correct_indices: [0, 2, 4, 6],
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "pick_correct",
    difficulty: "schwer",
    prompt: "Welche Aussagen über Essen und Körper stimmen wirklich?",
    hint: "Botanik ist pedantisch, Urban Legends sind faul. Beeren, Hülsenfrüchte, Carotin.",
    payload: {
      cards: [
        "Bananen sind botanisch Beeren",
        "Man nutzt nur 10 % des Gehirns",
        "Erdnüsse sind keine Nüsse, sondern Hülsenfrüchte",
        "Goldfische vergessen alles nach drei Sekunden",
        "Viel Carotin kann die Haut leicht orange färben",
        "Man verliert die meiste Körperwärme über den Kopf",
        "Tomaten sind botanisch Früchte",
        "Ein Blitz schlägt nie zweimal an derselben Stelle ein",
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
    difficulty: "schwer",
    prompt: "Spielegeschichte: eine Behauptung ist gelogen. Welche?",
    hint: "Sieben war die PlayStation-Ära. Die SNES-Nummer davor hieß anders.",
    payload: {
      statements: [
        "Counter-Strike entstand als Half-Life-Mod.",
        "Halo: Combat Evolved war ein Launch-Titel der originalen Xbox.",
        "Final Fantasy VII erschien zuerst exklusiv auf dem Super Nintendo.",
        "The Legend of Zelda: Ocarina of Time erschien zuerst auf dem Nintendo 64.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "geschichte",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Weltgeschichte: drei stimmen, eine ist Quatsch. Welche?",
    hint: "Korsika ja — aber nicht als Thronfolger in der Wiege.",
    payload: {
      statements: [
        "Die Magna Carta wurde in England besiegelt.",
        "Das Byzantinische Reich endete mit dem Fall Konstantinopels.",
        "Die Unabhängigkeitserklärung der USA wurde in Philadelphia verabschiedet.",
        "Napoleon Bonaparte wurde auf Korsika als französischer Kronprinz geboren.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Naturwissenschaft: welche Aussage ist falsch?",
    hint: "Alte Scheiben sind unten dicker, weil man sie so gegossen hat — nicht weil Glas läuft.",
    payload: {
      statements: [
        "Die Venus rotiert im Vergleich zu den meisten Planeten rückwärts.",
        "Diamanten und Graphit bestehen beide aus Kohlenstoff.",
        "Die DNA in einer menschlichen Zelle wäre ausgerollt rund zwei Meter lang.",
        "Glas ist bei Zimmertemperatur eine extrem zähe Flüssigkeit — deshalb sind alte Kirchenfenster unten dicker.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "sport",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Sportrekorde: eine flunkert. Welche?",
    hint: "Unter zwei Stunden gab es — nur nicht als offiziellen Weltrekord auf einer Rekordstrecke.",
    payload: {
      statements: [
        "Ein NBA-Korb hängt 10 Fuß (3,05 m) über dem Parkett.",
        "Eliud Kipchoge unterbot 2019 offiziell die 2-Stunden-Marke und hält seitdem den World-Athletics-Weltrekord.",
        "Ein Eishockey-Puck besteht hauptsächlich aus vulkanisiertem Gummi.",
        "Beim modernen Fußball-Anstoß darf der Ball auch nach hinten gespielt werden.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "sport",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Fußballregeln: welche Aussage ist falsch?",
    hint: "Strafraum und Elfmeterpunkt sind zwei verschiedene Markierungen.",
    payload: {
      statements: [
        "Ein gültiges Tor direkt aus einem Einwurf ist nach den FIFA-Regeln nicht möglich.",
        "Der Video-Assistent (VAR) wurde bei einer WM erstmals 2018 in Russland eingesetzt.",
        "Ein Elfmeter wird von der Strafraumgrenze aus ausgeführt — also aus 16,5 Metern.",
        "Ein Spiel hat zwei Halbzeiten à 45 Minuten plus Nachspielzeit.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "musik",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Musikgeschichte: welche Behauptung ist falsch?",
    hint: "Das letzte Live-Dach stand in London, nicht in New York.",
    payload: {
      statements: [
        "Queen verzichtet in „Bohemian Rhapsody“ bewusst auf einen klassischen, sich wiederholenden Refrain.",
        "Beethoven komponierte auch nach seiner Ertaubung weiter.",
        "Die Beatles spielten ihr letztes Dachkonzert auf dem Empire State Building.",
        "Ein Standard-Konzertflügel hat 88 Tasten.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "film-serie",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Filmzitate und Fakten: eine Aussage lügt. Welche?",
    hint: "Jeder zitiert den Satz falsch — im Film heißt er kürzer.",
    payload: {
      statements: [
        "Der erste abendfüllende Pixar-Film war Toy Story.",
        "In Casablanca fällt der Satz „Play it again, Sam“ wortwörtlich genau so.",
        "Der Herr der Ringe: Die Rückkehr des Königs gewann 11 Oscars.",
        "2001: Odyssee im Weltraum entstand unter der Regie von Stanley Kubrick.",
      ],
      lie_index: 1,
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Geografie für Fortgeschrittene: welche Aussage ist falsch?",
    hint: "Der Nil kommt von weiter südlich, Ägypten ist vor allem Mündungsland.",
    payload: {
      statements: [
        "Lesotho liegt als Binnenstaat komplett innerhalb Südafrikas.",
        "Der Titicacasee liegt auf der Grenze zwischen Peru und Bolivien.",
        "Der Nil entspringt ausschließlich in Ägypten.",
        "Kaliningrad gehört zu Russland, liegt aber zwischen Polen und Litauen.",
      ],
      lie_index: 2,
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "find_lie",
    difficulty: "mittel",
    prompt: "Länderkunde: eine flunkert. Welche?",
    hint: "Tausend Seen sind untertrieben — Feuerberge hat Finnland praktisch keine.",
    payload: {
      statements: [
        "Istanbul war früher unter anderem als Konstantinopel bekannt.",
        "Die Große Mauer verläuft im Wesentlichen durch das heutige China.",
        "Der Äquator durchquert den afrikanischen Kontinent.",
        "Finnland hat mehr Vulkane als Seen.",
      ],
      lie_index: 3,
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "find_lie",
    difficulty: "schwer",
    prompt: "Küchenmythen: welche ist gelogen?",
    hint: "Die Schärfe sitzt in den weißen Rippen, die Samen sind nur Nachbarn.",
    payload: {
      statements: [
        "Bananen reifen nach, weil sie Ethylengas abgeben.",
        "Honig kann jahrzehntelang haltbar sein, wenn er trocken und dicht verschlossen bleibt.",
        "Chili-Schärfe sitzt vor allem in den Samen — die weißen Innenrippen sind harmlos.",
        "Koriander schmeckt einem Teil der Menschen seifig, weil eine Genvariante die Wahrnehmung verändert.",
      ],
      lie_index: 2,
    },
  },

  // ============================================================
  // order_it — no years in labels, not trivial daily-routine stuff
  // ============================================================
  {
    theme_slug: "gaming",
    mode: "order_it",
    difficulty: "mittel",
    prompt:
      "Ordne diese FromSoftware-Spiele nach Erstveröffentlichung (älteste zuerst).",
    hint: "Erst die Dämonen, dann die Seele, dann Yharnam, dann das Zwischenland.",
    payload: {
      items: ["Elden Ring", "Demon's Souls", "Bloodborne", "Dark Souls"],
      correct_order: [1, 3, 2, 0],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "geschichte",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne diese Schrift- und Druckmeilensteine (frühestes zuerst).",
    hint: "Keil vor Stein, Stein vor Pergament-Privileg, Privileg vor Werkstatt in Mainz.",
    payload: {
      items: [
        "Gutenberg-Bibel",
        "Rosetta-Stein",
        "Keilschrift-Tafeln aus Uruk",
        "Magna Carta",
      ],
      correct_order: [2, 1, 3, 0],
      order_axis: "chronologisch",
    },
  },
  {
    theme_slug: "wissenschaft-natur",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne nach typischer Wellenlänge (längste Welle zuerst).",
    hint: "Radio dehnt sich am weitesten, Röntgen zwängt sich am engsten.",
    payload: {
      items: ["Röntgenstrahlung", "UKW-Radio", "sichtbares Licht", "Mikrowelle"],
      correct_order: [1, 3, 2, 0],
      order_axis: "Wellenlänge",
    },
  },
  {
    theme_slug: "sport",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne die Bälle nach offiziellem Durchmesser (kleinster zuerst).",
    hint: "Dimples, Filz, Leder, dann der Korb-Koloss.",
    payload: {
      items: [
        "Fußball (Größe 5)",
        "Golfball",
        "Basketball",
        "Tennisball",
      ],
      correct_order: [1, 3, 0, 2],
      order_axis: "Durchmesser",
    },
  },
  {
    theme_slug: "musik",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne die Alben nach Erstveröffentlichung (älteste zuerst).",
    hint: "Prisma und Synth, dann Mondschein-Pop, dann Grunge, dann Oxford-Gitarren.",
    payload: {
      items: [
        "Nevermind (Nirvana)",
        "Thriller (Michael Jackson)",
        "OK Computer (Radiohead)",
        "The Dark Side of the Moon",
      ],
      correct_order: [3, 1, 0, 2],
      order_axis: "Release",
    },
  },
  {
    theme_slug: "musik",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne die Komponisten nach Geburtsjahr (früher geboren zuerst).",
    hint: "Barockvater zuerst, dann Wien, dann der Schüler-Nachfolger, dann Paris-Salon.",
    payload: {
      items: ["Mozart", "Johann Sebastian Bach", "Beethoven", "Chopin"],
      correct_order: [1, 0, 2, 3],
      order_axis: "Geburtsjahr",
    },
  },
  {
    theme_slug: "film-serie",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne die Filme nach US-Kinostart (älteste zuerst).",
    hint: "Hai vor Dino, Dino vor Löffel, Löffel vor Pandora.",
    payload: {
      items: ["Jurassic Park", "The Matrix", "Der weiße Hai", "Avatar"],
      correct_order: [2, 0, 1, 3],
      order_axis: "Kinostart",
    },
  },
  {
    theme_slug: "reise-orte",
    mode: "order_it",
    difficulty: "schwer",
    prompt: "Ordne die Flüsse nach Länge (kürzester zuerst).",
    hint: "London-Rinnsal, dann Mitteleuropa, dann Donaulauf, dann Asiens Riese.",
    payload: {
      items: ["Jangtse", "Themse", "Donau", "Rhein"],
      correct_order: [1, 3, 2, 0],
      order_axis: "Länge",
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "order_it",
    difficulty: "mittel",
    prompt: "Ordne die Alltagsdinge nach Erfindung (frühestes zuerst).",
    hint: "Hose schließen, dann schreiben ohne Tinte-Klecks, dann Reste wärmen, dann das Netz.",
    payload: {
      items: [
        "World Wide Web",
        "Mikrowellenherd",
        "Kugelschreiber",
        "Reißverschluss",
      ],
      correct_order: [3, 2, 1, 0],
      order_axis: "Erfindung",
    },
  },
  {
    theme_slug: "alltag-peinlich",
    mode: "order_it",
    difficulty: "schwer",
    prompt:
      "Ordne nach typischer Haltbarkeit ungeöffnet im Vorratsschrank (kürzeste zuerst).",
    hint: "Bäcker zuerst, dann Tetra, dann Dose, dann das Zeug aus dem Grab der Pharaonen.",
    payload: {
      items: ["Weißbrot", "Honig", "H-Milch", "Dosentomaten"],
      correct_order: [0, 2, 3, 1],
      order_axis: "Haltbarkeit",
    },
  },
];

function uuidFor(index) {
  const n = (index + 1).toString(16).padStart(12, "0");
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

  return `-- Seed: Fragemeister v2 (~10 prompts per mode, all 8 themes)
-- Also deactivates the trivial 10.000-steps × 365 Schätzfrage.
-- Idempotent via ON CONFLICT (id). Does not rewrite older packs.
-- Source: content/seed-fragemeister-v2.json
--
-- Apply on project uwbhgveknypqvrwazleq:
--   Dashboard → SQL Editor → paste this file → Run

UPDATE prompts
SET active = false
WHERE id = '${STEPS_PROMPT_ID}'::uuid
  AND prompt ILIKE '%10.000 Schritte%';

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
DECLARE steps_active boolean;
BEGIN
  SELECT count(*) INTO n
  FROM prompts
  WHERE id >= '${UUID_PREFIX}000000000001'::uuid
    AND id <= '${UUID_PREFIX}000000000028'::uuid;
  IF n < 40 THEN
    RAISE EXCEPTION 'fragemeister v2 seed: expected 40 rows, got % — check theme slugs', n;
  END IF;

  SELECT active INTO steps_active
  FROM prompts
  WHERE id = '${STEPS_PROMPT_ID}'::uuid;
  IF steps_active IS TRUE THEN
    RAISE EXCEPTION 'fragemeister v2 seed: steps-per-year prompt is still active';
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

const jsonPath = join(ROOT, "content/seed-fragemeister-v2.json");
const sqlPath = join(ROOT, "supabase/migrations/20260825_001_seed_fragemeister_v2.sql");
const seedPath = join(ROOT, "supabase/seed/prompts_fragemeister_v2.sql");

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
console.log("All payload shapes valid.");
