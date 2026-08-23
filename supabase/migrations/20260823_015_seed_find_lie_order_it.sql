-- Seed: find_lie + order_it v1 (64 prompts)
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
  (
    '015e0823-4a15-4000-8000-000000000001'::uuid,
    $s$gaming$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Welche Aussage ist falsch?$p$,
    $h$Igel, blau, sehr schnell — kein Beuteltier.$h$,
    $j${"statements":["Super Mario trägt meist einen roten Hut.","Pikachu ist ein Elektro-Pokémon.","Die Steine in Tetris heißen Tetrominos.","Sonic the Hedgehog ist ein gelbes Känguru."],"lie_index":3}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000002'::uuid,
    $s$gaming$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Drei stimmen — eine ist gelogen. Welche?$p$,
    $h$Minecraft baut mit Würfeln, nicht mit Pyramiden-Mesh.$h$,
    $j${"statements":["Minecraft spielt in einer Welt aus Dreiecken.","Die Nintendo Switch hat abnehmbare Joy-Con.","Pokémon hat Typen wie Feuer, Wasser und Pflanze.","Ein Game Over bedeutet meist: Runde vorbei."],"lie_index":0}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000003'::uuid,
    $s$gaming$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Eine flunkert. Welche?$p$,
    $h$Denk an Steckmodul vs. Silberscheibe.$h$,
    $j${"statements":["Die PlayStation kommt ursprünglich von Sony.","Xbox ist eine Marke von Microsoft.","Die Wii wurde mit Bewegungssteuerung bekannt.","Die Nintendo 64 kam serienmäßig mit CD-Laufwerk wie die erste PlayStation."],"lie_index":3}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000004'::uuid,
    $s$gaming$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Welche ist die Lüge?$p$,
    $h$Kanto startet kleiner als Johto-Nationaldex.$h$,
    $j${"statements":["Doom gilt als Meilenstein der Ego-Shooter.","Die erste Pokémon-Generation hatte 251 Arten im Pokédex.","Lara Croft ist die Heldin von Tomb Raider.","Tetris wurde von Alexei Paschitnow entwickelt."],"lie_index":1}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000005'::uuid,
    $s$gaming$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne die Nintendo-Heimkonsolen nach Erscheinen (älteste zuerst).$p$,
    $h$8-Bit, dann 16-Bit, dann der Analogstick, dann der Würfel.$h$,
    $j${"items":["GameCube","NES","Nintendo 64","SNES"],"correct_order":[1,3,2,0],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000006'::uuid,
    $s$gaming$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne die GTA-Teile nach Erstveröffentlichung (älteste zuerst).$p$,
    $h$Erst Liberty City in 3D, dann 80er-Neon, dann San Andreas, dann Los Santos im HD-Look.$h$,
    $j${"items":["San Andreas","GTA V","GTA III","Vice City"],"correct_order":[2,3,0,1],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000007'::uuid,
    $s$gaming$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne die Pokémon-Regionen nach Debüt-Spielen (älteste zuerst).$p$,
    $h$Die Reise beginnt in Kanto — Sinnoh kommt deutlich später.$h$,
    $j${"items":["Sinnoh (Diamant/Perl)","Johto (Gold/Silber)","Kanto (Rot/Blau)","Hoenn (Rubin/Saphir)"],"correct_order":[2,1,3,0],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000008'::uuid,
    $s$gaming$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne die Spiele nach Erstveröffentlichung (älteste zuerst).$p$,
    $h$Arcade-Klassiker vor Puzzle-Ikone, dann NES-Helden nacheinander.$h$,
    $j${"items":["The Legend of Zelda","Pac-Man","Super Mario Bros.","Tetris"],"correct_order":[1,3,2,0],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000009'::uuid,
    $s$geschichte$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Welche Aussage ist falsch?$p$,
    $h$Das Schiff liegt auf dem Grund des Atlantiks, nicht an der Elbe.$h$,
    $j${"statements":["Die Berliner Mauer stand in Berlin.","Napoleon war ein französischer Feldherr.","Kleopatra lebte im alten Ägypten.","Die Titanic ist unversehrt im Hamburger Hafen ausgestellt."],"lie_index":3}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000000a'::uuid,
    $s$geschichte$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Drei stimmen — eine ist gelogen. Welche?$p$,
    $h$Cäsaren eher Tiber als Ostsee.$h$,
    $j${"statements":["Die Französische Revolution begann im 18. Jahrhundert.","Das Römische Reich hatte seinen Sitz dauerhaft in Stockholm.","Martin Luther trat als Reformator auf.","Die Pyramiden von Gizeh stehen in Ägypten."],"lie_index":1}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000000b'::uuid,
    $s$geschichte$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Eine flunkert. Welche?$p$,
    $h$Kaiserkrönung eher Petersdom als Shibuya.$h$,
    $j${"statements":["Die Hanse war ein Handelsbund im Norden Europas.","Die Weimarer Republik folgte auf das Kaiserreich.","Karl der Große wurde in Tokio zum Kaiser gekrönt.","Der Westfälische Frieden beendete den Dreißigjährigen Krieg."],"lie_index":2}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000000c'::uuid,
    $s$geschichte$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Welche ist die Lüge?$p$,
    $h$Osmanen am Bosporus, nicht am Oslofjord.$h$,
    $j${"statements":["Das Osmanische Reich hatte seine Hauptstadt in Oslo.","Die Magna Carta stammt aus England.","Die Berliner Luftbrücke versorgte West-Berlin.","Der Wiener Kongress ordnete Europa nach Napoleon."],"lie_index":0}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000000d'::uuid,
    $s$geschichte$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne chronologisch (frühestes zuerst).$p$,
    $h$Steine vor Kaisern, Segel vor Raketen.$h$,
    $j${"items":["Mondlandung","Kolumbus erreicht Amerika","Pyramiden von Gizeh entstehen","Augustus wird erster römischer Kaiser"],"correct_order":[2,3,1,0],"order_axis":"chronologisch"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000000e'::uuid,
    $s$geschichte$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne die deutschen Staatsformen chronologisch (früheste zuerst).$p$,
    $h$Erst Kaiser, dann Republik, dann Diktatur, dann Neubeginn im Westen.$h$,
    $j${"items":["Bundesrepublik wird gegründet","NS-Zeit beginnt","Kaiserreich wird ausgerufen","Weimarer Republik beginnt"],"correct_order":[2,3,1,0],"order_axis":"chronologisch"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000000f'::uuid,
    $s$geschichte$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne die Erfindungen nach dem, was zuerst da war (frühestes zuerst).$p$,
    $h$Lettern vor Dampf, Flieger vor Touchscreen.$h$,
    $j${"items":["Erstes iPhone","Buchdruck mit beweglichen Lettern","Erster Motorflug der Gebrüder Wright","Dampfmaschine wird alltagstauglich"],"correct_order":[1,3,2,0],"order_axis":"chronologisch"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000010'::uuid,
    $s$geschichte$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne die Dokumente / Friedensschlüsse chronologisch (frühestes zuerst).$p$,
    $h$England im Mittelalter, dann Dreißigjähriger, dann Napoleon, dann Weltkrieg.$h$,
    $j${"items":["Versailler Vertrag","Wiener Kongress","Magna Carta","Westfälischer Frieden"],"correct_order":[2,3,1,0],"order_axis":"chronologisch"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000011'::uuid,
    $s$wissenschaft-natur$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Welche Aussage ist falsch?$p$,
    $h$Pinguine mögen Kälte und Küste, keine Sanddünen.$h$,
    $j${"statements":["Wasser gefriert bei 0 °C (unter Normaldruck).","Die Erde kreist um die Sonne.","Menschen atmen Sauerstoff.","Pinguine brüten wild in der Sahara."],"lie_index":3}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000012'::uuid,
    $s$wissenschaft-natur$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Drei stimmen — eine ist gelogen. Welche?$p$,
    $h$Planeten kreisen — die große heiße Kugel ist selbst der Stern.$h$,
    $j${"statements":["Der Mond umkreist die Erde.","Bienen erzeugen Honig.","Die Sonne ist ein Planet.","Diamanten bestehen aus Kohlenstoff."],"lie_index":2}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000013'::uuid,
    $s$wissenschaft-natur$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Eine flunkert. Welche?$p$,
    $h$Edelmetall bleibt glänzend, Eisen nicht.$h$,
    $j${"statements":["Gold rostet an der Luft genauso schnell wie Eisen.","DNA trägt Erbinformation.","Photosynthese braucht Licht.","Blitze sind elektrische Entladungen."],"lie_index":0}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000014'::uuid,
    $s$wissenschaft-natur$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Welche ist die Lüge?$p$,
    $h$Schnupfen ist oft viral — Tabletten gegen Bakterien helfen dann nicht.$h$,
    $j${"statements":["Pluto gilt offiziell als Zwergplanet.","Antibiotika wirken gegen Viren genauso zuverlässig wie gegen Bakterien.","Tomaten sind botanisch Früchte.","Der Mount Everest ist kein aktiver Vulkan."],"lie_index":1}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000015'::uuid,
    $s$wissenschaft-natur$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne nach Größe (kleinstes zuerst).$p$,
    $h$Nager, Stubentiger, Reittier, Meeresriese.$h$,
    $j${"items":["Pferd","Blauwal","Hausmaus","Hauskatze"],"correct_order":[2,3,0,1],"order_axis":"Größe"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000016'::uuid,
    $s$wissenschaft-natur$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne die Planeten nach Abstand zur Sonne (nächster zuerst).$p$,
    $h$Merkur klebt an der Sonne, Mars ist der rote Nachbar hinter uns.$h$,
    $j${"items":["Erde","Merkur","Mars","Venus"],"correct_order":[1,3,0,2],"order_axis":"Abstand zur Sonne"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000017'::uuid,
    $s$wissenschaft-natur$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne nach Tempo (langsamstes zuerst).$p$,
    $h$Schleimspur, Jogging, Savanne, dann die Wolkenkratzer-Route.$h$,
    $j${"items":["Gepard","Weinbergschnecke","Passagierflugzeug","Jogender Mensch"],"correct_order":[1,3,0,2],"order_axis":"Geschwindigkeit"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000018'::uuid,
    $s$wissenschaft-natur$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne vom Kleinsten zum Größten (Maßstab: Teilchen bis Tier).$p$,
    $h$Baustein der Materie, dann Infektion ohne Zelle, dann Mikrobe, dann Insekt.$h$,
    $j${"items":["Ameise","Virus","Atom","Bakterium"],"correct_order":[2,1,3,0],"order_axis":"Größe"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000019'::uuid,
    $s$sport$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Welche Aussage ist falsch?$p$,
    $h$Elfmeter heißt nicht ohne Grund so — und liegt vor dem Tor.$h$,
    $j${"statements":["Ein Fußballspiel hat zwei Halbzeiten.","Beim Tennis gibt es Aufschlag-Aces.","Ein Elfmeter wird vom Mittelkreis geschossen.","Olympia gibt es als Sommer- und Winterspiele."],"lie_index":2}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000001a'::uuid,
    $s$sport$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Drei stimmen — eine ist gelogen. Welche?$p$,
    $h$Feldspieler: Füße ja, Hände eher peinlich.$h$,
    $j${"statements":["Beim Fußball dürfen Feldspieler den Ball nur mit der Hand ins Tor bugsieren.","Usain Bolt ist Sprint-Legende.","Ein Marathon ist deutlich länger als 5 km.","Basketball-Körbe hängen oben am Brett."],"lie_index":0}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000001b'::uuid,
    $s$sport$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Eine flunkert. Welche?$p$,
    $h$Korb vs. Puck: andere Liga, anderes Eis.$h$,
    $j${"statements":["Wimbledon wird auf Rasen gespielt.","Die Tour de France ist ein Radrennen.","Der Super Bowl ist das Finale der NFL.","Die NBA ist die Top-Liga im Eishockey."],"lie_index":3}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000001c'::uuid,
    $s$sport$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Welche ist die Lüge?$p$,
    $h$Majors im Tennis: eine Hand voll minus den Daumen.$h$,
    $j${"statements":["Ein Cricket-Test kann über mehrere Tage gehen.","Ein Grand Slam im Tennis besteht aus fünf Majors plus Olympia.","Abseits gibt es im Fußball.","Die Tour de France hat Bergetappen."],"lie_index":1}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000001d'::uuid,
    $s$sport$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne nach Distanz (kürzeste zuerst).$p$,
    $h$Bahn-Sprint, dann Runde, dann Mittelstrecke, dann Straßenqual.$h$,
    $j${"items":["Marathon","400 Meter","100-Meter-Sprint","1500-Meter-Lauf"],"correct_order":[2,1,3,0],"order_axis":"Distanz"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000001e'::uuid,
    $s$sport$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne die Gewichtsklassen (leichteste zuerst).$p$,
    $h$Fliegen ist winzig, Schwer ist das andere Ende.$h$,
    $j${"items":["Schwergewicht","Fliegengewicht","Mittelgewicht","Weltergewicht"],"correct_order":[1,3,2,0],"order_axis":"Gewichtsklasse"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000001f'::uuid,
    $s$sport$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne nach Geburtsjahr (älteste Person zuerst).$p$,
    $h$Brasilianische Legende, dann Chicago, dann Jamaika, dann Norwegen jetzt.$h$,
    $j${"items":["Usain Bolt","Pelé","Erling Haaland","Michael Jordan"],"correct_order":[1,3,0,2],"order_axis":"Geburtsjahr"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000020'::uuid,
    $s$sport$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne die Grand-Slam-Turniere im Kalenderjahr (frühestes zuerst).$p$,
    $h$Sommer Down Under, dann Sand, dann Rasen, dann US-Hardcourt.$h$,
    $j${"items":["Wimbledon","US Open","Australian Open","French Open"],"correct_order":[2,3,0,1],"order_axis":"Saisonkalender"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000021'::uuid,
    $s$musik$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Welche Aussage ist falsch?$p$,
    $h$Blasen, nicht streichen — trotz Blech-Look.$h$,
    $j${"statements":["Ein DJ legt Tracks auf.","Gitarren haben Saiten.","Ein Mikrofon nimmt Schall auf.","Ein Saxophon ist ein Streichinstrument."],"lie_index":3}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000022'::uuid,
    $s$musik$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Drei stimmen — eine ist gelogen. Welche?$p$,
    $h$Mehr Köttbullar als Fondue.$h$,
    $j${"statements":["Queen hatte Freddie Mercury als Sänger.","ABBA kommt aus der Schweiz.","Hip-Hop entstand in New York.","Beethoven komponierte Sinfonien."],"lie_index":1}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000023'::uuid,
    $s$musik$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Eine flunkert. Welche?$p$,
    $h$Taktstock reicht. Marshall-Stack ist optional.$h$,
    $j${"statements":["Ein Dirigent braucht zwingend eine E-Gitarre.","Rap lebt von Rhythmus und Sprache.","Die EU-Hymne basiert auf Beethovens Ode an die Freude.","Ein Taktstrich teilt die Musik in Takte."],"lie_index":0}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000024'::uuid,
    $s$musik$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Welche ist die Lüge?$p$,
    $h$Zwölfton ist Wiener Schule, nicht Graceland.$h$,
    $j${"statements":["Die Zauberflöte stammt von Mozart.","Woodstock fand in den USA statt.","Die Zwölftontechnik stammt von Elvis Presley.","Miles Davis ist eine Jazz-Ikone."],"lie_index":2}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000025'::uuid,
    $s$musik$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne die Epochen chronologisch (früheste zuerst).$p$,
    $h$Perücke und Generalbass, dann Wiener Klarheit, dann Gefühl, dann elektrischer Wackelpo.$h$,
    $j${"items":["Rock ’n’ Roll","Barock","Romantik","Wiener Klassik"],"correct_order":[1,3,2,0],"order_axis":"chronologisch"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000026'::uuid,
    $s$musik$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne nach Tonlage (höchste zuerst).$p$,
    $h$Winzige Flöte piepst oben, der Kasten mit Stachel brummt unten.$h$,
    $j${"items":["Cello","Kontrabass","Piccoloflöte","Violine"],"correct_order":[2,3,0,1],"order_axis":"Tonlage"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000027'::uuid,
    $s$musik$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne nach Durchbruch (früheste Ära zuerst).$p$,
    $h$Liverpool, dann Stockholm, dann Seattle, dann Teen-Pop-Ära am Handy.$h$,
    $j${"items":["Billie Eilish","Nirvana","The Beatles","ABBA"],"correct_order":[2,3,1,0],"order_axis":"Ära"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000028'::uuid,
    $s$musik$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne chronologisch (frühestes zuerst).$p$,
    $h$Kloster, dann Opernhaus, dann Clubs am Mississippi, dann Bronx-Blockparty.$h$,
    $j${"items":["Hip-Hop in der Bronx","Frühe Oper in Italien","Gregorianischer Choral","Jazz in New Orleans"],"correct_order":[2,1,3,0],"order_axis":"chronologisch"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000029'::uuid,
    $s$film-serie$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Welche Aussage ist falsch?$p$,
    $h$Elsa braucht Schnee, kein Kamel.$h$,
    $j${"statements":["Harry Potter geht nach Hogwarts.","Darth Vader gehört zu Star Wars.","Titanic handelt von einem Schiffsunglück.","Frozen spielt hauptsächlich in der Sahara."],"lie_index":3}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000002a'::uuid,
    $s$film-serie$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Drei stimmen — eine ist gelogen. Welche?$p$,
    $h$Bond, James Bond — nicht Bond, Klassenlehrer.$h$,
    $j${"statements":["Sherlock Holmes ist Detektiv.","James Bond unterrichtet fest als Dorflehrer in Bielefeld.","Der Joker ist Batmans Gegenspieler.","Pixar hat Toy Story gemacht."],"lie_index":1}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000002b'::uuid,
    $s$film-serie$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Eine flunkert. Welche?$p$,
    $h$Eis und Feuer, nicht Hogwarts.$h$,
    $j${"statements":["Game of Thrones basiert auf Büchern von J. K. Rowling.","Die Simpsons leben in Springfield.","Der Herr der Ringe spielt in Mittelerde.","Marvel und DC sind verschiedene Universen."],"lie_index":0}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000002c'::uuid,
    $s$film-serie$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Welche ist die Lüge?$p$,
    $h$Passagierschiff ≠ Schlachtschiff.$h$,
    $j${"statements":["Stranger Things spielt optisch stark in den 80ern.","Studio Ghibli kommt aus Japan.","Der Film Titanic handelt vom Untergang der Bismarck.","Netflix ist ein Streamingdienst."],"lie_index":2}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000002d'::uuid,
    $s$film-serie$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne die Harry-Potter-Filme nach Kinostart (älteste zuerst).$p$,
    $h$Erst der Stein, dann die Kammer, dann Askaban, dann der Kelch.$h$,
    $j${"items":["Feuerkelch","Stein der Weisen","Der Gefangene von Askaban","Kammer des Schreckens"],"correct_order":[1,3,2,0],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000002e'::uuid,
    $s$film-serie$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne nach Kinostart (älteste zuerst).$p$,
    $h$Erst der Anzug, dann der Crossover, dann das Schnappen, dann das Ende.$h$,
    $j${"items":["Avengers: Endgame","Iron Man","Avengers: Infinity War","The Avengers"],"correct_order":[1,3,2,0],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000002f'::uuid,
    $s$film-serie$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne nach Kinostart (älteste zuerst) — nicht nach Buchchronologie.$p$,
    $h$Erst die Trilogie im Kino, der Hobbit kam als Prequel später in die Läden.$h$,
    $j${"items":["Der Hobbit: Eine unerwartete Reise","Die zwei Türme","Die Gefährten","Die Rückkehr des Königs"],"correct_order":[2,1,3,0],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000030'::uuid,
    $s$film-serie$s$,
    $m$order_it$m$,
    $d$schwer$d$,
    $p$Ordne die Pixar-Filme nach Kinostart (älteste zuerst).$p$,
    $h$Spielzeug zuerst, dann Riff, dann Luftballons, dann Gefühle im Kopf.$h$,
    $j${"items":["Oben","Toy Story","Alles steht Kopf","Findet Nemo"],"correct_order":[1,3,0,2],"order_axis":"Release"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000031'::uuid,
    $s$reise-orte$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Welche Aussage ist falsch?$p$,
    $h$Eiffel guckt auf die Seine, nicht auf die Spree.$h$,
    $j${"statements":["Paris ist die Hauptstadt von Frankreich.","Die Alpen liegen in Europa.","Japan ist ein Inselstaat.","Der Eiffelturm steht in Berlin."],"lie_index":3}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000032'::uuid,
    $s$reise-orte$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Drei stimmen — eine ist gelogen. Welche?$p$,
    $h$Samba und Amazonas, nicht Alpenvorland.$h$,
    $j${"statements":["Italien hat ungefähr Stiefelform.","Brasilien liegt in Europa.","Die Sahara ist eine Wüste.","New York liegt in den USA."],"lie_index":1}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000033'::uuid,
    $s$reise-orte$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Eine flunkert. Welche?$p$,
    $h$Freistehender Gipfel in Ostafrika, nicht Zugspitz-Nachbar.$h$,
    $j${"statements":["Der Kilimandscharo liegt in den Alpen.","Der Amazonas fließt durch Südamerika.","Die Anden liegen in Südamerika.","Der Nil mündet ins Mittelmeer."],"lie_index":0}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000034'::uuid,
    $s$reise-orte$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Welche ist die Lüge?$p$,
    $h$Hauptstadt ≠ größte Stadt. Opernhaus und Hafen gewinnen die Einwohner-Liga.$h$,
    $j${"statements":["Istanbul liegt teils in Europa, teils in Asien.","Der Vatikan ist ein eigener Staat.","Canberra ist die einwohnerstärkste Stadt Australiens.","Die Donau fließt durch mehrere Länder."],"lie_index":2}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000035'::uuid,
    $s$reise-orte$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne von Westen nach Osten.$p$,
    $h$Atlantikküste, dann Mitte Europas, dann Bosporus, dann Fernost.$h$,
    $j${"items":["Tokio","Berlin","Lissabon","Istanbul"],"correct_order":[2,1,3,0],"order_axis":"West → Ost"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000036'::uuid,
    $s$reise-orte$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne nach Gipfelhöhe (niedrigstes zuerst).$p$,
    $h$Harz-Hausberg, dann Deutschland-Dach, dann Alpenkrone, dann Himalaya.$h$,
    $j${"items":["Mont Blanc","Brocken","Mount Everest","Zugspitze"],"correct_order":[1,3,0,2],"order_axis":"Höhe"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000037'::uuid,
    $s$reise-orte$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne nach Landesfläche (kleinste zuerst).$p$,
    $h$Ein Stadtstaat, dann Mitteleuropa, dann Ahorn-Riese, dann das flächengrößte Land.$h$,
    $j${"items":["Kanada","Vatikanstadt","Russland","Deutschland"],"correct_order":[1,3,0,2],"order_axis":"Fläche"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000038'::uuid,
    $s$reise-orte$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne von Norden nach Süden.$p$,
    $h$Fjorde, dann Spree, dann Dolce Vita, dann Nil-Delta.$h$,
    $j${"items":["Rom","Oslo","Kairo","Berlin"],"correct_order":[1,3,0,2],"order_axis":"Nord → Süd"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000039'::uuid,
    $s$alltag-peinlich$s$,
    $m$find_lie$m$,
    $d$leicht$d$,
    $p$Welche Aussage ist falsch?$p$,
    $h$Erst die Unterwäsche, dann die Jeans — außer als Statement.$h$,
    $j${"statements":["„Guten Morgen“ passt am Vormittag.","Toast kann man rösten.","Ampeln haben Rot und Grün.","Die Unterhose zieht man üblicherweise über die Jeans."],"lie_index":3}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000003a'::uuid,
    $s$alltag-peinlich$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Drei stimmen — eine ist gelogen. Welche?$p$,
    $h$Augen wollen Kochsalz, kein Nivea-Spa.$h$,
    $j${"statements":["Ein Schaltjahr hat einen 29. Februar.","Kontaktlinsen putzt man am besten mit Handcreme.","Eine PIN sollte man nicht laut hersagen.","In Deutschland gilt oft rechts vor links, wenn nichts anderes da ist."],"lie_index":1}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000003b'::uuid,
    $s$alltag-peinlich$s$,
    $m$find_lie$m$,
    $d$mittel$d$,
    $p$Eine flunkert. Welche?$p$,
    $h$Trauerfeier ≠ Junggesellenabschied.$h$,
    $j${"statements":["Auf einer Beerdigung ruft man traditionell „Hoch die Tassen, JGA!“.","Smalltalk übers Wetter ist ein Klassiker.","„Du hast was im Zahn“ sagt man lieber leise.","Zur Begrüßung gibt man sich oft die Hand."],"lie_index":0}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000003c'::uuid,
    $s$alltag-peinlich$s$,
    $m$find_lie$m$,
    $d$schwer$d$,
    $p$Welche ist die Lüge?$p$,
    $h$Fünf Ziffern auf dem Brief — nicht die Hausnummer-Länge.$h$,
    $j${"statements":["Die Telefon-Vorwahl Deutschlands ist +49.","In Deutschland gibt es Mülltrennung.","Deutsche Postleitzahlen haben immer genau drei Stellen.","Ein Schuko-Stecker hat Schutzkontakt."],"lie_index":2}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000003d'::uuid,
    $s$alltag-peinlich$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne im Tagesablauf (frühestes zuerst).$p$,
    $h$Licht, dann Hunger, dann Couch, dann Geisterstunde.$h$,
    $j${"items":["Mitternacht","Mittagessen","Sonnenaufgang","Feierabend"],"correct_order":[2,1,3,0],"order_axis":"Tagesablauf"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000003e'::uuid,
    $s$alltag-peinlich$s$,
    $m$order_it$m$,
    $d$leicht$d$,
    $p$Ordne die Anzieh-Reihenfolge (zuerst angezogene Sache zuerst).$p$,
    $h$Hautnah zuerst, dann Beine, dann halt der Hose, dann die Schicht nach draußen.$h$,
    $j${"items":["Jacke","Gürtel","Unterwäsche","Hose"],"correct_order":[2,3,1,0],"order_axis":"Anziehen"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-00000000003f'::uuid,
    $s$alltag-peinlich$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne den Nudel-Ablauf (erster Schritt zuerst).$p$,
    $h$Topf, kochen, Sieb, dann die Soße — nicht umgekehrt, außer du magst Kleister.$h$,
    $j${"items":["Sauce untermengen","Nudeln abgießen","Wasser aufsetzen","Nudeln ins kochende Wasser"],"correct_order":[2,3,1,0],"order_axis":"Zubereitung"}$j$::jsonb
  ),
  (
    '015e0823-4a15-4000-8000-000000000040'::uuid,
    $s$alltag-peinlich$s$,
    $m$order_it$m$,
    $d$mittel$d$,
    $p$Ordne den Kuchen-Ablauf (erster Schritt zuerst).$p$,
    $h$Rühren, hitzen, warten, dann erst die süße Krone — sonst rutscht sie in den Teig.$h$,
    $j${"items":["Glasur drauf","Teig rühren","auskühlen lassen","Kuchen in den Ofen"],"correct_order":[1,3,2,0],"order_axis":"Backen"}$j$::jsonb
  )
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
