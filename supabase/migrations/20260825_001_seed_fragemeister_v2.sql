-- Seed: Fragemeister v2 (~10 prompts per mode, all 8 themes)
-- Also deactivates the trivial 10.000-steps × 365 Schätzfrage.
-- Idempotent via ON CONFLICT (id). Does not rewrite older packs.
-- Source: content/seed-fragemeister-v2.json
--
-- Apply on project uwbhgveknypqvrwazleq:
--   Dashboard → SQL Editor → paste this file → Run

UPDATE prompts
SET active = false
WHERE id = 'f2391b41-fbc3-483e-957c-0de213ad5581'::uuid
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
  (
    '025e0825-4a15-4000-8000-000000000001'::uuid,
    $s$gaming$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele Pokémon-Sammelkarten wurden ungefähr weltweit schon gedruckt (Stand 2026)?$p$,
    $h$$h$,
    $j${"answer":85000000000,"unit":null,"plausibility_note":"The Pokémon Company: über 85 Milliarden Karten bis März 2026."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000002'::uuid,
    $s$gaming$s$,
    $m$number_guess$m$,
    $d$mittel$d$,
    $p$Wie viele Spiele sind ungefähr jemals auf Steam erschienen (Größenordnung, Stand 2026)?$p$,
    $h$$h$,
    $j${"answer":130000,"unit":null,"plausibility_note":"SteamDB lag 2026 bei grob 130.000 jemals erschienenen Titeln (Store schwankt durch Delistings)."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000003'::uuid,
    $s$geschichte$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele Menschen sind ungefähr jemals geboren worden — alle Generationen zusammen, nicht nur die heute Lebenden?$p$,
    $h$$h$,
    $j${"answer":117000000000,"unit":null,"plausibility_note":"Population Reference Bureau 2022: ca. 117 Milliarden Geburten seit dem Auftreten des Homo sapiens."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000004'::uuid,
    $s$wissenschaft-natur$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele Bäume stehen ungefähr auf der ganzen Erde?$p$,
    $h$$h$,
    $j${"answer":3000000000000,"unit":null,"plausibility_note":"Crowther et al., Nature 2015: ca. 3,04 Billionen Bäume (deutsche Billion = 10^12)."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000005'::uuid,
    $s$wissenschaft-natur$s$,
    $m$number_guess$m$,
    $d$mittel$d$,
    $p$Wie viele Nervenzellen (Neuronen) hat ein menschliches Gehirn ungefähr?$p$,
    $h$$h$,
    $j${"answer":86000000000,"unit":null,"plausibility_note":"Azevedo / Herculano-Houzel: im Schnitt ca. 86 Milliarden Neuronen."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000006'::uuid,
    $s$sport$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele Tennisbälle werden ungefähr während eines kompletten Wimbledon-Turniers verbraucht?$p$,
    $h$$h$,
    $j${"answer":55000,"unit":null,"plausibility_note":"AELTC-Angaben liegen typischerweise bei grob 54.000–65.000 Bällen; gängige Größe 55.000."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000007'::uuid,
    $s$musik$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele Menschen waren ungefähr beim Rekord-Open-Air von Rod Stewart an der Copacabana (Silvester 1994) live vor Ort?$p$,
    $h$$h$,
    $j${"answer":3500000,"unit":null,"plausibility_note":"Guinness / Stadt Rio: ca. 3,5 Millionen, inkl. Silvester-Feuerwerk-Publikum am Strand."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000008'::uuid,
    $s$film-serie$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele Statisten kamen ungefähr in der Beerdigungsszene von „Gandhi“ (1982) zum Einsatz?$p$,
    $h$$h$,
    $j${"answer":300000,"unit":null,"plausibility_note":"Guinness World Records: über 300.000 Extras, oft als Film-Rekord zitiert."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000009'::uuid,
    $s$reise-orte$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele Nieten halten ungefähr den Eiffelturm zusammen?$p$,
    $h$$h$,
    $j${"answer":2500000,"unit":null,"plausibility_note":"Offizielle Angabe der Turmverwaltung: ca. 2,5 Millionen Nieten."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000000a'::uuid,
    $s$alltag-peinlich$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele Bläschen entstehen ungefähr, wenn eine 0,75-Liter-Flasche Champagner komplett ausperlt?$p$,
    $h$$h$,
    $j${"answer":50000000,"unit":null,"plausibility_note":"Theoretische CO₂-Bilanz (Uni Reims / Liger-Belair-Umrechnung): grob 49 Millionen mögliche Blasen; Party-Ziel 50 Millionen."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000000b'::uuid,
    $s$gaming$s$,
    $m$pick_correct$m$,
    $d$schwer$d$,
    $p$Welche Spiele hat Hideo Kojima maßgeblich als Autor oder Regisseur verantwortet?$p$,
    $h$$h$,
    $j${"cards":["Silent Hill 2","Metal Gear Solid","Resident Evil 4","Death Stranding","Bloodborne","Snatcher","The Last of Us","P.T."],"correct_indices":[1,3,5,7]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000000c'::uuid,
    $s$geschichte$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche Ereignisse lagen zeitlich vor Kolumbus’ erster Landung in der Karibik?$p$,
    $h$$h$,
    $j${"cards":["Fall Konstantinopels","95 Thesen Luthers","Wikinger erreichen Vinland","Magellan sticht zur Weltumsegelung in See","Buchdruck mit beweglichen Lettern in Mainz","Französische Revolution","Azteken gründen Tenochtitlán","Erste iPhone-Keynote"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000000d'::uuid,
    $s$geschichte$s$,
    $m$pick_correct$m$,
    $d$schwer$d$,
    $p$Welche Personen herrschten wirklich als Königin oder Kaiserin aus eigenem Recht — nicht nur als Gemahlin?$p$,
    $h$$h$,
    $j${"cards":["Hatschepsut","Marie-Antoinette","Elisabeth I. von England","Eva Perón","Maria Theresia","Jackie Kennedy","Katharina die Große","Wallis Simpson"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000000e'::uuid,
    $s$wissenschaft-natur$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche Einheiten messen Energie — nicht Kraft, nicht Leistung, nicht Druck?$p$,
    $h$$h$,
    $j${"cards":["Joule","Newton","Kilowattstunde","Watt","Kalorie","Pascal","Elektronenvolt","Ampere"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000000f'::uuid,
    $s$sport$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche Sportarten waren mindestens einmal olympisch, stehen 2026 aber nicht im Sommer- oder Winterprogramm?$p$,
    $h$$h$,
    $j${"cards":["Tauziehen","Schwimmen","Polo zu Pferd","Leichtathletik","Jeu de Paume","Turnen","Croquet","Fechten"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000010'::uuid,
    $s$musik$s$,
    $m$pick_correct$m$,
    $d$schwer$d$,
    $p$Welche Werke sind Opern — keine Musicals und keine Operetten?$p$,
    $h$$h$,
    $j${"cards":["Carmen","Cats","La Traviata","Die Fledermaus","Tosca","Hamilton","Die Zauberflöte","West Side Story"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000011'::uuid,
    $s$film-serie$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche Serien liefen ursprünglich als HBO-Eigenproduktion — nicht Netflix, AMC oder BBC?$p$,
    $h$$h$,
    $j${"cards":["The Sopranos","Breaking Bad","Succession","Stranger Things","The Wire","The Office (US)","True Detective","Sherlock"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000012'::uuid,
    $s$film-serie$s$,
    $m$pick_correct$m$,
    $d$schwer$d$,
    $p$Welche Filme hat Hayao Miyazaki selbst inszeniert — nicht nur „irgendwas von Ghibli“?$p$,
    $h$$h$,
    $j${"cards":["Chihiros Reise ins Zauberland","Die letzten Glühwürmchen","Prinzessin Mononoke","Perfect Blue","Mein Nachbar Totoro","Akira","Das wandelnde Schloss","Your Name"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000013'::uuid,
    $s$reise-orte$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche dieser Hauptstädte liegen südlich des Äquators?$p$,
    $h$$h$,
    $j${"cards":["Canberra","Mexiko-Stadt","Brasília","Kairo","Wellington","Bangkok","Buenos Aires","Madrid"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000014'::uuid,
    $s$alltag-peinlich$s$,
    $m$pick_correct$m$,
    $d$schwer$d$,
    $p$Welche Aussagen über Essen und Körper stimmen wirklich?$p$,
    $h$$h$,
    $j${"cards":["Bananen sind botanisch Beeren","Man nutzt nur 10 % des Gehirns","Erdnüsse sind keine Nüsse, sondern Hülsenfrüchte","Goldfische vergessen alles nach drei Sekunden","Viel Carotin kann die Haut leicht orange färben","Man verliert die meiste Körperwärme über den Kopf","Tomaten sind botanisch Früchte","Ein Blitz schlägt nie zweimal an derselben Stelle ein"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000015'::uuid,
    $s$gaming$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Spielegeschichte: eine Behauptung ist gelogen. Welche?$p$,
    $h$$h$,
    $j${"statements":["Counter-Strike entstand als Half-Life-Mod.","Halo: Combat Evolved war ein Launch-Titel der originalen Xbox.","Final Fantasy VII erschien zuerst exklusiv auf dem Super Nintendo.","The Legend of Zelda: Ocarina of Time erschien zuerst auf dem Nintendo 64."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000016'::uuid,
    $s$geschichte$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Weltgeschichte: drei stimmen, eine ist Quatsch. Welche?$p$,
    $h$$h$,
    $j${"statements":["Die Magna Carta wurde in England besiegelt.","Das Byzantinische Reich endete mit dem Fall Konstantinopels.","Die Unabhängigkeitserklärung der USA wurde in Philadelphia verabschiedet.","Napoleon Bonaparte wurde auf Korsika als französischer Kronprinz geboren."],"lie_index":3}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000017'::uuid,
    $s$wissenschaft-natur$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Naturwissenschaft: welche Aussage ist falsch?$p$,
    $h$$h$,
    $j${"statements":["Die Venus rotiert im Vergleich zu den meisten Planeten rückwärts.","Diamanten und Graphit bestehen beide aus Kohlenstoff.","Die DNA in einer menschlichen Zelle wäre ausgerollt rund zwei Meter lang.","Glas ist bei Zimmertemperatur eine extrem zähe Flüssigkeit — deshalb sind alte Kirchenfenster unten dicker."],"lie_index":3}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000018'::uuid,
    $s$sport$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Sportrekorde: eine flunkert. Welche?$p$,
    $h$$h$,
    $j${"statements":["Ein NBA-Korb hängt 10 Fuß (3,05 m) über dem Parkett.","Eliud Kipchoge unterbot 2019 offiziell die 2-Stunden-Marke und hält seitdem den World-Athletics-Weltrekord.","Ein Eishockey-Puck besteht hauptsächlich aus vulkanisiertem Gummi.","Beim modernen Fußball-Anstoß darf der Ball auch nach hinten gespielt werden."],"lie_index":1}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000019'::uuid,
    $s$sport$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Fußballregeln: welche Aussage ist falsch?$p$,
    $h$$h$,
    $j${"statements":["Ein gültiges Tor direkt aus einem Einwurf ist nach den FIFA-Regeln nicht möglich.","Der Video-Assistent (VAR) wurde bei einer WM erstmals 2018 in Russland eingesetzt.","Ein Elfmeter wird von der Strafraumgrenze aus ausgeführt — also aus 16,5 Metern.","Ein Spiel hat zwei Halbzeiten à 45 Minuten plus Nachspielzeit."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000001a'::uuid,
    $s$musik$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Musikgeschichte: welche Behauptung ist falsch?$p$,
    $h$$h$,
    $j${"statements":["Queen verzichtet in „Bohemian Rhapsody“ bewusst auf einen klassischen, sich wiederholenden Refrain.","Beethoven komponierte auch nach seiner Ertaubung weiter.","Die Beatles spielten ihr letztes Dachkonzert auf dem Empire State Building.","Ein Standard-Konzertflügel hat 88 Tasten."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000001b'::uuid,
    $s$film-serie$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Filmzitate und Fakten: eine Aussage lügt. Welche?$p$,
    $h$$h$,
    $j${"statements":["Der erste abendfüllende Pixar-Film war Toy Story.","In Casablanca fällt der Satz „Play it again, Sam“ wortwörtlich genau so.","Der Herr der Ringe: Die Rückkehr des Königs gewann 11 Oscars.","2001: Odyssee im Weltraum entstand unter der Regie von Stanley Kubrick."],"lie_index":1}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000001c'::uuid,
    $s$reise-orte$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Geografie für Fortgeschrittene: welche Aussage ist falsch?$p$,
    $h$$h$,
    $j${"statements":["Lesotho liegt als Binnenstaat komplett innerhalb Südafrikas.","Der Titicacasee liegt auf der Grenze zwischen Peru und Bolivien.","Der Nil entspringt ausschließlich in Ägypten.","Kaliningrad gehört zu Russland, liegt aber zwischen Polen und Litauen."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000001d'::uuid,
    $s$reise-orte$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Länderkunde: eine flunkert. Welche?$p$,
    $h$$h$,
    $j${"statements":["Istanbul war früher unter anderem als Konstantinopel bekannt.","Die Große Mauer verläuft im Wesentlichen durch das heutige China.","Der Äquator durchquert den afrikanischen Kontinent.","Finnland hat mehr Vulkane als Seen."],"lie_index":3}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000001e'::uuid,
    $s$alltag-peinlich$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Küchenmythen: welche ist gelogen?$p$,
    $h$$h$,
    $j${"statements":["Bananen reifen nach, weil sie Ethylengas abgeben.","Honig kann jahrzehntelang haltbar sein, wenn er trocken und dicht verschlossen bleibt.","Chili-Schärfe sitzt vor allem in den Samen — die weißen Innenrippen sind harmlos.","Koriander schmeckt einem Teil der Menschen seifig, weil eine Genvariante die Wahrnehmung verändert."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000001f'::uuid,
    $s$gaming$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne diese FromSoftware-Spiele nach Erstveröffentlichung (älteste zuerst).$p$,
    $h$$h$,
    $j${"items":["Elden Ring","Demon's Souls","Bloodborne","Dark Souls"],"correct_order":[1,3,2,0],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000020'::uuid,
    $s$geschichte$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne diese Schrift- und Druckmeilensteine (frühestes zuerst).$p$,
    $h$$h$,
    $j${"items":["Gutenberg-Bibel","Rosetta-Stein","Keilschrift-Tafeln aus Uruk","Magna Carta"],"correct_order":[2,1,3,0],"order_axis":"chronologisch"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000021'::uuid,
    $s$wissenschaft-natur$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne nach typischer Wellenlänge (längste Welle zuerst).$p$,
    $h$$h$,
    $j${"items":["Röntgenstrahlung","UKW-Radio","sichtbares Licht","Mikrowelle"],"correct_order":[1,3,2,0],"order_axis":"Wellenlänge"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000022'::uuid,
    $s$sport$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne die Bälle nach offiziellem Durchmesser (kleinster zuerst).$p$,
    $h$$h$,
    $j${"items":["Fußball (Größe 5)","Golfball","Basketball","Tennisball"],"correct_order":[1,3,0,2],"order_axis":"Durchmesser"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000023'::uuid,
    $s$musik$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne die Alben nach Erstveröffentlichung (älteste zuerst).$p$,
    $h$$h$,
    $j${"items":["Nevermind (Nirvana)","Thriller (Michael Jackson)","OK Computer (Radiohead)","The Dark Side of the Moon"],"correct_order":[3,1,0,2],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000024'::uuid,
    $s$musik$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne die Komponisten nach Geburtsjahr (früher geboren zuerst).$p$,
    $h$$h$,
    $j${"items":["Mozart","Johann Sebastian Bach","Beethoven","Chopin"],"correct_order":[1,0,2,3],"order_axis":"Geburtsjahr"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000025'::uuid,
    $s$film-serie$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne die Filme nach US-Kinostart (älteste zuerst).$p$,
    $h$$h$,
    $j${"items":["Jurassic Park","The Matrix","Der weiße Hai","Avatar"],"correct_order":[2,0,1,3],"order_axis":"Kinostart"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000026'::uuid,
    $s$reise-orte$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne die Flüsse nach Länge (kürzester zuerst).$p$,
    $h$$h$,
    $j${"items":["Jangtse","Themse","Donau","Rhein"],"correct_order":[1,3,2,0],"order_axis":"Länge"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000027'::uuid,
    $s$alltag-peinlich$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne die Alltagsdinge nach Erfindung (frühestes zuerst).$p$,
    $h$$h$,
    $j${"items":["World Wide Web","Mikrowellenherd","Kugelschreiber","Reißverschluss"],"correct_order":[3,2,1,0],"order_axis":"Erfindung"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000028'::uuid,
    $s$alltag-peinlich$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne nach typischer Haltbarkeit ungeöffnet im Vorratsschrank (kürzeste zuerst).$p$,
    $h$$h$,
    $j${"items":["Weißbrot","Honig","H-Milch","Dosentomaten"],"correct_order":[0,2,3,1],"order_axis":"Haltbarkeit"}$j$::jsonb
  )
) AS v(id, theme_slug, mode, difficulty, prompt, hint, payload)
JOIN themes t ON t.slug = v.theme_slug
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE n int;
DECLARE steps_active boolean;
BEGIN
  SELECT count(*) INTO n
  FROM prompts
  WHERE id >= '025e0825-4a15-4000-8000-000000000001'::uuid
    AND id <= '025e0825-4a15-4000-8000-000000000028'::uuid;
  IF n < 40 THEN
    RAISE EXCEPTION 'fragemeister v2 seed: expected 40 rows, got % — check theme slugs', n;
  END IF;

  SELECT active INTO steps_active
  FROM prompts
  WHERE id = 'f2391b41-fbc3-483e-957c-0de213ad5581'::uuid;
  IF steps_active IS TRUE THEN
    RAISE EXCEPTION 'fragemeister v2 seed: steps-per-year prompt is still active';
  END IF;
END $$;
