export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = "rp_locale";

export function parseLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "de";
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? ""),
  );
}

const de = {
  common: {
    loading: "Laden...",
    back: "Zurück",
    soon: "Bald",
    guest: "Gast",
    or: "oder",
    player: "Spieler",
  },
  auth: {
    rateLimit:
      "Bestätigungs-Mails sind gerade voll (ca. 2 pro Stunde).",
    bypassHint:
      "Tipp: Google nutzen — oder mit einem bestehenden Testkonto anmelden.",
    emailNotConfirmed:
      "Diese E-Mail ist noch nicht bestätigt. Schau im Postfach (und Spam) nach dem Link.",
    emailNotConfirmedHint:
      "Keine neue Mail anstoßen: Limit ca. 2 pro Stunde. Google oder ein bestätigtes Testkonto geht sofort.",
    invalidCredentials: "E-Mail oder Passwort stimmt nicht.",
    alreadyRegistered: "Diese E-Mail hat schon ein Konto.",
    alreadyRegisteredHint:
      "Einfach anmelden — oder Google / ein bestätigtes Testkonto nutzen.",
    generic: "Das hat nicht geklappt. Versuch's nochmal.",
  },
  settings: {
    title: "Einstellungen",
    language: "Sprache",
    languageHint:
      "Menüs und Buttons wechseln. Quiz-Fragen bleiben vorerst auf Deutsch.",
    german: "Deutsch",
    english: "English",
    account: "Konto",
    playingAsGuest: "Du spielst als Gast",
    guestHint: "Mit einem Konto bleiben XP, Avatare und Freunde gespeichert.",
    signedInAs: "Angemeldet als",
    logout: "Ausloggen",
    loggingOut: "Wird abgemeldet…",
  },
  home: {
    partyPlayer: "Party-Spieler",
    settingsAria: "Einstellungen",
    avatarAria: "Avatar",
    shopNeedsAccount: "Shop braucht ein Konto",
    joinCodeLength: "Code muss genau 6 Zeichen haben.",
    navStart: "Start",
    navQuiz: "Quiz",
    navPlay: "Spielen",
    navRank: "Rangliste",
    navProfile: "Profil",
    streakAria: "Feuer",
    streakLoading: "Kalendertage in Folge gespielt.",
    streakNull: "Kalendertage in Folge — noch nicht gespeichert.",
    streakZero: "Nach einem Match zählt der erste Tag.",
    streakBuilding: "Spiele an 3 Tagen in Folge für den Streak-Erfolg.",
    streakActive: "Kalendertage in Folge gespielt.",
    streakTitle: "Streak",
    championKicker: "Dein nächstes Ziel",
    championTitle: "Werde",
    championAccent: "Ratepanik-Champion",
    championBody: "Gewinne Runden, sammle Punkte und hol dir den Pokal.",
    createKicker: "Du bist der Host",
    createTitle: "Raum erstellen",
    createLoading: "Raum wird erstellt…",
    createBody: "Quiz wählen, Freunde einladen, losraten.",
    joinKicker: "Raumcode bereit?",
    joinTitle: "Spiel beitreten",
    joinCodeAria: "Sechsstelligen Raumcode eingeben",
    joinButton: "Beitreten",
    joinChars: "{n}/6 Zeichen",
    friends: "Freunde",
    stats: "Statistik",
    achievements: "Erfolge",
    shop: "Shop",
    shopMeta: "Hirnkiste",
    connectAccount: "Konto verbinden",
    loadingMeta: "Wird geladen",
    buildCrew: "Crew aufbauen",
    friendOne: "1 Freund",
    friendsMany: "{n} Freunde",
    levelGames: "Level {level} · {games} Spiele",
    levelOnly: "Level {level}",
    achievementsProgress: "{unlocked} von {total}",
  },
  cosmetics: {
    customize: "Schleimi",
    customizeAria: "Schleimi anpassen",
    customizeNeedsAccountHeadline: "Schleimi braucht ein Konto",
    customizeNeedsAccountBody:
      "Als Gast bleibt der Schleim nackt. Anmelden — dann bleiben Looks gespeichert.",
    shopNeedsAccountHeadline: "Shop braucht ein Konto",
    shopNeedsAccountBody:
      "Als Gast kannst du keine Hirnkiste öffnen. Melde dich an — Hirncoins nimmst du aus Matches mit.",
    hirncoins: "Hirncoins",
    boxName: "Hirnkiste",
    open: "Öffnen",
    opening: "Wird geöffnet…",
    notEnough: "Nicht genug Hirncoins. Spiel ein Match!",
    shopFinePrint:
      "Eine Kiste, drei Seltenheiten. Duplikate werden zu ein paar Hirncoins. Kein Echtgeld.",
    emptySlot: "Leer",
  },
  landing: {
    guestTitle: "Als Gast beitreten",
    guestSubtitle: "Du hast einen Raum-Code?",
    joining: "Tritt bei…",
    join: "Beitreten",
    register: "Registrieren",
    login: "Anmelden",
    footer: "Als Gast brauchst du nur den Code vom Host.",
    codeError: "Code muss genau 6 Zeichen haben.",
    connectionError: "Verbindungsfehler. Bitte versuche es erneut.",
    trophyAria: "Pokal feiern lassen",
    tagline: "Wer falsch liegt, lebt gefährlich.",
  },
  login: {
    subtitle: "Anmelden zum Spielen",
    emailLabel: "Mit E-Mail anmelden",
    email: "E-Mail",
    password: "Passwort",
    submit: "Anmelden",
    noAccount: "Noch kein Konto? Registrieren",
    moreOptions: "Weitere Optionen",
    google: "Mit Google anmelden",
    guest: "Als Gast beitreten (nur mitspielen)",
    backHome: "← Zurück zur Startseite",
  },
  signup: {
    subtitle: "Konto erstellen",
    google: "Mit Google registrieren",
    namePlaceholder: "Anzeigename (min. 3 Zeichen)",
    email: "E-Mail",
    password: "Passwort (min. 6 Zeichen)",
    submit: "Registrieren",
    hasAccount: "Schon ein Konto? Anmelden",
    nameTooShort: "Name zu kurz (min. 3 Zeichen)",
    nameAvailable: "Name verfügbar!",
    claimFailed: "Name konnte nicht reserviert werden",
    confirmTitle: "Bestätigungs-Mail ist unterwegs",
    confirmBody:
      "Prüfe Postfach und Spam, dann den Link antippen. Supabase schickt nur ca. 2 Bestätigungen pro Stunde — wenn nichts kommt, einfach warten.",
    confirmHint:
      "Sofort spielen: Google, oder ein bestehendes Testkonto (schon bestätigt).",
    backToLogin: "Zurück zum Login",
  },
} as const;

type StringTree<T> = {
  [K in keyof T]: T[K] extends string ? string : StringTree<T[K]>;
};

const en: StringTree<typeof de> = {
  common: {
    loading: "Loading...",
    back: "Back",
    soon: "Soon",
    guest: "Guest",
    or: "or",
    player: "Player",
  },
  auth: {
    rateLimit:
      "Confirmation emails are capped right now (about 2 per hour).",
    bypassHint:
      "Tip: use Google — or sign in with an existing test account.",
    emailNotConfirmed:
      "This email is not confirmed yet. Check your inbox (and spam) for the link.",
    emailNotConfirmedHint:
      "Don’t request another mail: limit is about 2 per hour. Google or a confirmed test account works now.",
    invalidCredentials: "Email or password doesn’t match.",
    alreadyRegistered: "This email already has an account.",
    alreadyRegisteredHint:
      "Just log in — or use Google / a confirmed test account.",
    generic: "That didn’t work. Try again.",
  },
  settings: {
    title: "Settings",
    language: "Language",
    languageHint:
      "Menus and buttons switch. Quiz questions stay in German for now.",
    german: "Deutsch",
    english: "English",
    account: "Account",
    playingAsGuest: "You’re playing as a guest",
    guestHint: "Sign in to keep XP, avatars, and friends.",
    signedInAs: "Signed in as",
    logout: "Log out",
    loggingOut: "Signing out…",
  },
  home: {
    partyPlayer: "Party player",
    settingsAria: "Settings",
    avatarAria: "Avatar",
    shopNeedsAccount: "Shop needs an account",
    joinCodeLength: "Code must be exactly 6 characters.",
    navStart: "Home",
    navQuiz: "Quiz",
    navPlay: "Play",
    navRank: "Ranks",
    navProfile: "Profile",
    streakAria: "Fire",
    streakLoading: "Calendar days played in a row.",
    streakNull: "Calendar-day streak — not saved yet.",
    streakZero: "Finish a match to start day one.",
    streakBuilding: "Play on 3 days in a row for the streak achievement.",
    streakActive: "Calendar days played in a row.",
    streakTitle: "Streak",
    championKicker: "Your next goal",
    championTitle: "Become",
    championAccent: "Ratepanik champion",
    championBody: "Win rounds, collect points, and take the trophy.",
    createKicker: "You’re the host",
    createTitle: "Create room",
    createLoading: "Creating room…",
    createBody: "Pick a quiz, invite friends, start guessing.",
    joinKicker: "Got a room code?",
    joinTitle: "Join game",
    joinCodeAria: "Enter six-character room code",
    joinButton: "Join",
    joinChars: "{n}/6 characters",
    friends: "Friends",
    stats: "Stats",
    achievements: "Achievements",
    shop: "Shop",
    shopMeta: "Brain crate",
    connectAccount: "Connect account",
    loadingMeta: "Loading",
    buildCrew: "Build your crew",
    friendOne: "1 friend",
    friendsMany: "{n} friends",
    levelGames: "Level {level} · {games} games",
    levelOnly: "Level {level}",
    achievementsProgress: "{unlocked} of {total}",
  },
  cosmetics: {
    customize: "Schleimi",
    customizeAria: "Customize Schleimi",
    customizeNeedsAccountHeadline: "Schleimi needs an account",
    customizeNeedsAccountBody:
      "Guests keep a bare slime. Sign in to save looks.",
    shopNeedsAccountHeadline: "Shop needs an account",
    shopNeedsAccountBody:
      "Guests can’t open a brain crate. Sign in — Hirncoins come from matches.",
    hirncoins: "Hirncoins",
    boxName: "Brain crate",
    open: "Open",
    opening: "Opening…",
    notEnough: "Not enough Hirncoins. Play a match!",
    shopFinePrint:
      "One crate, three rarities. Duplicates become a few Hirncoins. No real money.",
    emptySlot: "Empty",
  },
  landing: {
    guestTitle: "Join as guest",
    guestSubtitle: "Got a room code?",
    joining: "Joining…",
    join: "Join",
    register: "Sign up",
    login: "Log in",
    footer: "As a guest you only need the host’s code.",
    codeError: "Code must be exactly 6 characters.",
    connectionError: "Connection error. Please try again.",
    trophyAria: "Celebrate the trophy",
    tagline: "Guess wrong and live dangerously.",
  },
  login: {
    subtitle: "Log in to play",
    emailLabel: "Log in with email",
    email: "Email",
    password: "Password",
    submit: "Log in",
    noAccount: "No account yet? Sign up",
    moreOptions: "More options",
    google: "Continue with Google",
    guest: "Join as guest (play only)",
    backHome: "← Back to home",
  },
  signup: {
    subtitle: "Create account",
    google: "Sign up with Google",
    namePlaceholder: "Display name (min. 3 characters)",
    email: "Email",
    password: "Password (min. 6 characters)",
    submit: "Sign up",
    hasAccount: "Already have an account? Log in",
    nameTooShort: "Name too short (min. 3 characters)",
    nameAvailable: "Name available!",
    claimFailed: "Couldn’t reserve that name",
    confirmTitle: "Confirmation email is on its way",
    confirmBody:
      "Check inbox and spam, then tap the link. Supabase only sends about 2 confirmations per hour — if nothing arrives, just wait.",
    confirmHint:
      "Play now: Google, or an existing test account that’s already confirmed.",
    backToLogin: "Back to login",
  },
};

export type Messages = StringTree<typeof de>;
export const messages: Record<Locale, Messages> = { de, en };
