-- Schleimi 2.1 — catalog expansion (+35 items).
-- More shapes/colors/eyes/mouths/backgrounds with a richer selten/legendaer tier.
-- Parts render as inline SVG (asset_path = logical 'svg:<id>' key).

INSERT INTO cosmetic_items (id, slot, rarity, name_de, asset_path, sort_order) VALUES
  ('shape_bean',   'shape', 'gewoehnlich', 'Bohnenschleim',  'svg:shape_bean',   42),
  ('shape_puddle', 'shape', 'gewoehnlich', 'Pfützenschleim', 'svg:shape_puddle', 44),
  ('shape_heart',  'shape', 'selten',      'Herzschleim',    'svg:shape_heart',  72),
  ('shape_cat',    'shape', 'selten',      'Katzenschleim',  'svg:shape_cat',    74),
  ('shape_crown',  'shape', 'legendaer',   'Kronenschleim',  'svg:shape_crown',  82),
  ('shape_ufo',    'shape', 'legendaer',   'UFO-Schleim',    'svg:shape_ufo',    84),

  ('tint_lemon',  'body_tint', 'gewoehnlich', 'Zitrone',         'svg:tint_lemon',  162),
  ('tint_cocoa',  'body_tint', 'gewoehnlich', 'Kakao',           'svg:tint_cocoa',  164),
  ('tint_lava',   'body_tint', 'selten',      'Lava-Glibber',    'svg:tint_lava',   192),
  ('tint_ocean',  'body_tint', 'selten',      'Ozeanschleim',    'svg:tint_ocean',  194),
  ('tint_candy',  'body_tint', 'selten',      'Zuckerwatte',     'svg:tint_candy',  196),
  ('tint_galaxy', 'body_tint', 'legendaer',   'Galaxie-Schleim', 'svg:tint_galaxy', 220),
  ('tint_aurora', 'body_tint', 'legendaer',   'Aurora-Schleim',  'svg:tint_aurora', 230),

  ('eyes_uwu',    'eyes', 'gewoehnlich', 'UwU-Augen',     'svg:eyes_uwu',    372),
  ('eyes_side',   'eyes', 'gewoehnlich', 'Seitenblick',   'svg:eyes_side',   374),
  ('eyes_bored',  'eyes', 'gewoehnlich', 'Null Bock',     'svg:eyes_bored',  376),
  ('eyes_starry', 'eyes', 'selten',      'Sternenaugen',  'svg:eyes_starry', 402),
  ('eyes_teary',  'eyes', 'selten',      'Glubschtränen', 'svg:eyes_teary',  404),
  ('eyes_grumpy', 'eyes', 'selten',      'Grummelblick',  'svg:eyes_grumpy', 406),
  ('eyes_laser',  'eyes', 'legendaer',   'Laserblick',    'svg:eyes_laser',  420),
  ('eyes_galaxy', 'eyes', 'legendaer',   'Galaxie-Augen', 'svg:eyes_galaxy', 430),

  ('mouth_cat',        'mouth', 'gewoehnlich', 'Katzenmund',     'svg:mouth_cat',        562),
  ('mouth_meh',        'mouth', 'gewoehnlich', 'Meh-Mund',       'svg:mouth_meh',        564),
  ('mouth_fangs',      'mouth', 'selten',      'Vampirzähnchen', 'svg:mouth_fangs',      592),
  ('mouth_braces',     'mouth', 'selten',      'Zahnspange',     'svg:mouth_braces',     594),
  ('mouth_drool',      'mouth', 'selten',      'Sabbermund',     'svg:mouth_drool',      596),
  ('mouth_gold_grill', 'mouth', 'legendaer',   'Gold-Grill',     'svg:mouth_gold_grill', 620),
  ('mouth_flame',      'mouth', 'legendaer',   'Feueratem',      'svg:mouth_flame',      630),

  ('bg_peach',    'background', 'gewoehnlich', 'Pfirsichwolke',  'svg:bg_peach',    742),
  ('bg_grid',     'background', 'gewoehnlich', 'Karopapier',     'svg:bg_grid',     744),
  ('bg_rain',     'background', 'selten',      'Regenschauer',   'svg:bg_rain',     772),
  ('bg_confetti', 'background', 'selten',      'Konfettiregen',  'svg:bg_confetti', 774),
  ('bg_pixel',    'background', 'selten',      'Pixelwelt',      'svg:bg_pixel',    776),
  ('bg_galaxy',   'background', 'legendaer',   'Galaxien-Nebel', 'svg:bg_galaxy',   800),
  ('bg_disco',    'background', 'legendaer',   'Disco-Fieber',   'svg:bg_disco',    810)
ON CONFLICT (id) DO UPDATE SET
  slot = EXCLUDED.slot,
  rarity = EXCLUDED.rarity,
  name_de = EXCLUDED.name_de,
  asset_path = EXCLUDED.asset_path,
  sort_order = EXCLUDED.sort_order,
  active = true;
