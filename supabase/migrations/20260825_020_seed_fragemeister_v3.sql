-- Seed: Fragemeister v3 (another ~10 prompts per mode, all 8 themes)
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
  (
    '025e0825-4a15-4000-8000-000000000029'::uuid,
    $s$gaming$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele Tetris-Einheiten wurden ungefähr weltweit verkauft — alle offiziellen Versionen zusammen (Stand 2026)?$p$,
    $h$$h$,
    $j${"answer":520000000,"unit":null,"plausibility_note":"The Tetris Company: über 520 Millionen verkaufte Einheiten (Pressemitteilungen 2024–2026)."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000002a'::uuid,
    $s$gaming$s$,
    $m$number_guess$m$,
    $d$mittel$d$,
    $p$Wie viele Exemplare von Grand Theft Auto V wurden ungefähr verkauft (alle Plattformen, Stand 2026)?$p$,
    $h$$h$,
    $j${"answer":230000000,"unit":null,"plausibility_note":"Take-Two Interactive, Investorenupdate August 2026: über 230 Millionen Einheiten."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000002b'::uuid,
    $s$geschichte$s$,
    $m$number_guess$m$,
    $d$mittel$d$,
    $p$Wie viele Einwanderer wurden ungefähr über Ellis Island abgefertigt, solange die Station in Betrieb war?$p$,
    $h$$h$,
    $j${"answer":12000000,"unit":null,"plausibility_note":"U.S. National Park Service: rund 12 Millionen Menschen zwischen 1892 und 1954."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000002c'::uuid,
    $s$wissenschaft-natur$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele Ameisen leben ungefähr gleichzeitig auf der Erde — einzelne Tiere, nicht Arten?$p$,
    $h$$h$,
    $j${"answer":20000000000000000,"unit":null,"plausibility_note":"Schultheiss et al., PNAS 2022: konservativ etwa 20×10^15 Tiere, also 20 Billiarden."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000002d'::uuid,
    $s$sport$s$,
    $m$number_guess$m$,
    $d$mittel$d$,
    $p$Wie viele Menschen laufen ungefähr weltweit in einem starken Jahr einen Marathon zu Ende (Finisher)?$p$,
    $h$$h$,
    $j${"answer":1100000,"unit":null,"plausibility_note":"RunRepeat-Auswertung der großen Stadtmarathons: Größenordnung 1,1 Millionen Finisher in Spitzenjahren."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000002e'::uuid,
    $s$musik$s$,
    $m$number_guess$m$,
    $d$mittel$d$,
    $p$Wie viele Besucher waren ungefähr beim Original-Woodstock-Festival 1969 über das ganze Wochenende auf dem Gelände?$p$,
    $h$$h$,
    $j${"answer":450000,"unit":null,"plausibility_note":"Keine amtliche Zählung; gängige Schätzungen liegen zwischen 400.000 und 500.000, oft bei 450.000."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000002f'::uuid,
    $s$film-serie$s$,
    $m$number_guess$m$,
    $d$mittel$d$,
    $p$Wie viele Kinoleinwände (einzelne Screens, nicht Kinosäle-Gebäude) gibt es ungefähr weltweit?$p$,
    $h$$h$,
    $j${"answer":220000,"unit":null,"plausibility_note":"European Audiovisual Observatory, FOCUS 2025/26: mehr als 220.000 Leinwände (vor der Pandemie ~200.000)."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000030'::uuid,
    $s$reise-orte$s$,
    $m$number_guess$m$,
    $d$mittel$d$,
    $p$Wie viele lebende Sprachen gibt es ungefähr auf der Welt — nicht Dialekte, sondern katalogisierte Einzelsprachen?$p$,
    $h$$h$,
    $j${"answer":7200,"unit":null,"plausibility_note":"Ethnologue 28./29. Edition: rund 7.160–7.170 lebende Sprachen; Schätzfrage zielt auf 7.200."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000031'::uuid,
    $s$reise-orte$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele planmäßige Linienflüge starten ungefähr an einem durchschnittlichen Tag weltweit?$p$,
    $h$$h$,
    $j${"answer":100000,"unit":null,"plausibility_note":"ICAO 2024: 37,4 Millionen Abflüge im Jahr → grob 100.000 pro Tag; OAG lag 2026 ähnlich."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000032'::uuid,
    $s$alltag-peinlich$s$,
    $m$number_guess$m$,
    $d$schwer$d$,
    $p$Wie viele E-Mails werden ungefähr weltweit an einem Tag verschickt und empfangen (Stand 2026)?$p$,
    $h$$h$,
    $j${"answer":390000000000,"unit":null,"plausibility_note":"Statista-Schätzung: etwa 376 Milliarden (2025) bzw. 393 Milliarden (2026) E-Mails pro Tag."}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000033'::uuid,
    $s$gaming$s$,
    $m$pick_correct$m$,
    $d$schwer$d$,
    $p$Welche Spiele kamen zuerst exklusiv auf einer PlayStation-Konsole heraus — nicht Xbox, nicht Nintendo?$p$,
    $h$$h$,
    $j${"cards":["Halo: Combat Evolved","Metal Gear Solid","The Legend of Zelda: Breath of the Wild","Bloodborne","Gears of War","The Last of Us","Super Mario Odyssey","God of War (Kratos in Midgard)"],"correct_indices":[1,3,5,7]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000034'::uuid,
    $s$geschichte$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche Ereignisse gehören in die Zeit des Kalten Krieges (ungefähr 1947 bis 1991)?$p$,
    $h$$h$,
    $j${"cards":["Sputnik startet","Fall Konstantinopels","Kubakrise","Französische Revolution","Bau der Berliner Mauer","Kolumbus landet in der Karibik","Reaktorunglück Tschernobyl","Anschläge vom 11. September"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000035'::uuid,
    $s$wissenschaft-natur$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche Tiere sind Vögel — keine Säugetiere, keine Insekten, keine ausgestorbenen Flugsaurier?$p$,
    $h$$h$,
    $j${"cards":["Pinguin","Fledermaus","Strauß","Delfin","Kiwi","Schmetterling","Buntspecht","Pteranodon"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000036'::uuid,
    $s$wissenschaft-natur$s$,
    $m$pick_correct$m$,
    $d$schwer$d$,
    $p$Welche Größen sind SI-Basiseinheiten — keine abgeleiteten Einheiten und kein Alltagsgrad?$p$,
    $h$$h$,
    $j${"cards":["Joule","Meter","Liter","Sekunde","Newton","Kelvin","Grad Celsius","Ampere"],"correct_indices":[1,3,5,7]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000037'::uuid,
    $s$sport$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche Sportarten werden auf Eis ausgetragen — nicht auf Schnee?$p$,
    $h$$h$,
    $j${"cards":["Eiskunstlauf","Ski alpin","Eishockey","Snowboard","Curling","Biathlon","Shorttrack","Skispringen"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000038'::uuid,
    $s$musik$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche Instrumente gehören zur Holzbläserfamilie — nicht zu den Blechbläsern?$p$,
    $h$$h$,
    $j${"cards":["Querflöte","Trompete","Klarinette","Posaune","Oboe","Waldhorn","Fagott","Tuba"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000039'::uuid,
    $s$film-serie$s$,
    $m$pick_correct$m$,
    $d$schwer$d$,
    $p$Welche Filme hat Alfred Hitchcock selbst inszeniert?$p$,
    $h$$h$,
    $j${"cards":["Citizen Kane","Psycho","Der weiße Hai","Das Fenster zum Hof","Shining","Vertigo","Casablanca","Die Vögel"],"correct_indices":[1,3,5,7]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000003a'::uuid,
    $s$film-serie$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche Serien starteten als Netflix-Eigenproduktion — nicht HBO, AMC oder US-Network?$p$,
    $h$$h$,
    $j${"cards":["Stranger Things","Breaking Bad","The Crown","The Sopranos","House of Cards","Game of Thrones","Orange Is the New Black","The Office (US)"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000003b'::uuid,
    $s$reise-orte$s$,
    $m$pick_correct$m$,
    $d$schwer$d$,
    $p$Welche Städte liegen nördlich des Polarkreises?$p$,
    $h$$h$,
    $j${"cards":["Tromsø","Reykjavík","Murmansk","Helsinki","Longyearbyen","Oslo","Narvik","Stockholm"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000003c'::uuid,
    $s$alltag-peinlich$s$,
    $m$pick_correct$m$,
    $d$mittel$d$,
    $p$Welche Lebensmittel fermentieren in der klassischen Herstellung — Mikroben arbeiten mit?$p$,
    $h$$h$,
    $j${"cards":["Joghurt","Mineralwasser","Sauerkraut","Olivenöl extra vergine","Kimchi","Bienenhonig aus dem Glas","Sauerteigbrot","H-Milch"],"correct_indices":[0,2,4,6]}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000003d'::uuid,
    $s$gaming$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Nintendo-Hardware: eine Behauptung ist gelogen. Welche?$p$,
    $h$$h$,
    $j${"statements":["Die Wii hieß intern während der Entwicklung „Revolution“.","Der originale Game Boy erschien in Japan 1989.","Super Mario Bros. erschien zuerst exklusiv auf dem Nintendo 64.","Die Switch kann sowohl angedockt am Fernseher als auch als Handheld gespielt werden."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000003e'::uuid,
    $s$geschichte$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Antike und Kaiser: drei stimmen, eine ist Quatsch. Welche?$p$,
    $h$$h$,
    $j${"statements":["Kleopatra lebte zeitlich näher an der ersten iPhone-Keynote als am Bau der Pyramiden von Gizeh.","Julius Caesar war der erste römische Kaiser im Sinn des Prinzipats.","Die Berliner Mauer fiel 1989.","Die Titanic sank auf ihrer Jungfernfahrt."],"lie_index":1}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000003f'::uuid,
    $s$geschichte$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Weltreiche: eine flunkert. Welche?$p$,
    $h$$h$,
    $j${"statements":["Das Osmanische Reich endete in den Jahren nach dem Ersten Weltkrieg.","Die Inka errichteten Machu Picchu.","Wikinger erreichten Amerika vor Kolumbus.","Das Heilige Römische Reich war räumlich deckungsgleich mit dem heutigen Italien."],"lie_index":3}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000040'::uuid,
    $s$wissenschaft-natur$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Physik im Alltag: welche Aussage ist falsch?$p$,
    $h$$h$,
    $j${"statements":["Reines Wasser hat bei etwa 4 °C seine größte Dichte.","Diamanten sind härter als Graphit, obwohl beide aus Kohlenstoff bestehen.","Die Erde ist der Sonne im Juli näher als im Januar.","Sonnenlicht braucht grob acht Minuten bis zur Erde."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000041'::uuid,
    $s$sport$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Sportregeln und Maße: eine flunkert. Welche?$p$,
    $h$$h$,
    $j${"statements":["Die Marathon-Distanz beträgt 42,195 Kilometer.","Beim Tennis zählt man in einem Spiel 15, 30, 40.","Ein internationales Fußballfeld muss exakt 100 Meter lang sein — keinen Meter anders.","Ein Distanzwurf hinter der Dreierlinie zählt im Basketball drei Punkte."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000042'::uuid,
    $s$musik$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Pop und Klassik: welche Behauptung ist falsch?$p$,
    $h$$h$,
    $j${"statements":["Eine Standard-Gitarre hat sechs Saiten.","Beethoven schrieb neun Sinfonien.","ABBA gewann den Eurovision Song Contest für Norwegen.","Das Kammerton-A liegt heute üblicherweise bei 440 Hertz."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000043'::uuid,
    $s$film-serie$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Hollywood-Fakten: eine Aussage lügt. Welche?$p$,
    $h$$h$,
    $j${"statements":["Der Pate entstand unter der Regie von Francis Ford Coppola.","Titanic spielt zur Zeit des Untergangs 1912.","E.T. – Der Außerirdische stammt von Steven Spielberg.","Der erste Kinofilm der Star-Wars-Saga hieß im Original „Return of the Jedi“."],"lie_index":3}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000044'::uuid,
    $s$reise-orte$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Kontinente und Staaten: welche Aussage ist falsch?$p$,
    $h$$h$,
    $j${"statements":["Australien ist zugleich Kontinent und Staat.","Der Vatikan ist der flächenmäßig kleinste anerkannte Staat der Welt.","Die Sahara liegt ausschließlich in Ägypten.","Japan besteht aus mehreren Hauptinseln, nicht nur aus einer."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000045'::uuid,
    $s$alltag-peinlich$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Küche und Technik: welche ist gelogen?$p$,
    $h$$h$,
    $j${"statements":["Rohes Hühnchen sollte man nicht auf demselben ungereinigten Brett wie Salat schneiden.","Auf Meereshöhe kocht Wasser bei etwa 100 °C.","Die Mikrowelle macht Speisen radioaktiv.","Backhefe braucht Zucker oder Stärke, um Teig aufgehen zu lassen."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000046'::uuid,
    $s$alltag-peinlich$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Handy, WLAN, Alltag: eine flunkert. Welche?$p$,
    $h$$h$,
    $j${"statements":["In Deutschland darf man am Steuer nur mit Freisprecheinrichtung telefonieren.","QWERTZ tauscht gegenüber QWERTY unter anderem Y und Z.","Das WLAN aus dem Heimrouter kocht das Gehirn wie ein Mikrowellenherd.","USB-C kann je nach Gerät Laden und Datenübertragung."],"lie_index":2}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000047'::uuid,
    $s$gaming$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne diese Videospiel-Klassiker nach Erstveröffentlichung (älteste zuerst).$p$,
    $h$$h$,
    $j${"items":["Minecraft","Pac-Man","Doom","Tetris"],"correct_order":[1,3,2,0],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000048'::uuid,
    $s$geschichte$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne diese Bauwerke nach Fertigstellung (frühestes zuerst).$p$,
    $h$$h$,
    $j${"items":["Eiffelturm","Kolosseum","Machu Picchu","Pyramiden von Gizeh"],"correct_order":[3,1,2,0],"order_axis":"chronologisch"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000049'::uuid,
    $s$wissenschaft-natur$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne diese Erdzeitalter (ältestes zuerst).$p$,
    $h$$h$,
    $j${"items":["Jura","Quartär","Kambrium","Kreide"],"correct_order":[2,0,3,1],"order_axis":"Erdgeschichte"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000004a'::uuid,
    $s$sport$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne nach der ersten Fußball-WM, die in diesem Land ausgetragen wurde (früheste zuerst).$p$,
    $h$$h$,
    $j${"items":["England","Uruguay","Deutschland","Italien"],"correct_order":[1,3,0,2],"order_axis":"erste WM-Austragung"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000004b'::uuid,
    $s$sport$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne die Spielflächen nach Größe (kleinste zuerst).$p$,
    $h$$h$,
    $j${"items":["Fußballfeld","Tischtennisplatte","Basketballfeld","Tennisplatz"],"correct_order":[1,3,2,0],"order_axis":"Spielfläche"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000004c'::uuid,
    $s$musik$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne diese Jazz- und Rock-Alben nach Erstveröffentlichung (älteste zuerst).$p$,
    $h$$h$,
    $j${"items":["Rumours (Fleetwood Mac)","Kind of Blue (Miles Davis)","What's Going On (Marvin Gaye)","Highway 61 Revisited (Bob Dylan)"],"correct_order":[1,3,2,0],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000004d'::uuid,
    $s$musik$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne diese Beatles-Alben nach UK-Erstveröffentlichung (älteste zuerst).$p$,
    $h$$h$,
    $j${"items":["Abbey Road","Please Please Me","Sgt. Pepper","Rubber Soul"],"correct_order":[1,3,2,0],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000004e'::uuid,
    $s$film-serie$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne diese Marvel-Filme nach US-Kinostart (älteste zuerst).$p$,
    $h$$h$,
    $j${"items":["The Avengers","Iron Man","Captain America: The First Avenger","Thor"],"correct_order":[1,3,2,0],"order_axis":"Kinostart"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-00000000004f'::uuid,
    $s$reise-orte$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne die Bauwerke nach Höhe (niedrigstes zuerst).$p$,
    $h$$h$,
    $j${"items":["Empire State Building","Schiefer Turm von Pisa","Burj Khalifa","Eiffelturm"],"correct_order":[1,3,0,2],"order_axis":"Höhe"}$j$::jsonb
  ),
  (
    '025e0825-4a15-4000-8000-000000000050'::uuid,
    $s$alltag-peinlich$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne nach typischer Haltbarkeit im Kühlschrank nach dem Öffnen bzw. Frischkauf (kürzeste zuerst).$p$,
    $h$$h$,
    $j${"items":["Hartkäse","rohes Hackfleisch","Hühnereier","geöffnete Frischmilch"],"correct_order":[1,3,2,0],"order_axis":"Haltbarkeit"}$j$::jsonb
  )
) AS v(id, theme_slug, mode, difficulty, prompt, hint, payload)
JOIN themes t ON t.slug = v.theme_slug
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM prompts
  WHERE id >= '025e0825-4a15-4000-8000-000000000029'::uuid
    AND id <= '025e0825-4a15-4000-8000-000000000050'::uuid;
  IF n < 40 THEN
    RAISE EXCEPTION 'fragemeister v3 seed: expected 40 rows, got % — check theme slugs', n;
  END IF;
END $$;
