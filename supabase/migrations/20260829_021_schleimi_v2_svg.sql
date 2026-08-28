-- Schleimi 2.0: parametric SVG avatar.
-- Slots change from (body_tint, face, hat, extra) to
-- (shape, body_tint, eyes, mouth, background). Parts render as inline SVG
-- (asset_path stores a logical 'svg:<id>' key, no raster files).
--
-- Migration of user data:
--   * body_tint items/loadout/ownership carry over unchanged.
--   * face_*   → decomposed into an eyes+mouth pair (LEGACY_FACE_MAP in TS).
--   * hat_*/extra_* → removed; owners are refunded Hirncoins by rarity
--     (gewoehnlich 60 / selten 150 / legendaer 400), logged in
--     schleimi_v2_refunds so the migration is idempotent.
--   * Everyone gets the starter shape and starter eyes/mouth.
-- Crates: hat/extra/face crates deactivate; form/gesicht/hintergrund crates
-- appear. Daily deal rotation switches to the new crate ids.

-- ── 1. Slot constraints ─────────────────────────────────────────────
-- cosmetic_items keeps legacy slot values (retired rows stay for FK history).
ALTER TABLE cosmetic_items DROP CONSTRAINT IF EXISTS cosmetic_items_slot_check;
ALTER TABLE cosmetic_items ADD CONSTRAINT cosmetic_items_slot_check
  CHECK (slot IN ('shape', 'body_tint', 'eyes', 'mouth', 'background', 'face', 'hat', 'extra'));

-- user_loadout still contains legacy face/hat/extra rows here; its new
-- constraint is added in section 6 after those rows are migrated/deleted.
ALTER TABLE user_loadout DROP CONSTRAINT IF EXISTS user_loadout_slot_check;

-- ── 2. New catalog items ────────────────────────────────────────────
INSERT INTO cosmetic_items (id, slot, rarity, name_de, asset_path, sort_order) VALUES
  ('shape_classic',  'shape', 'gewoehnlich', 'Klecks',         'svg:shape_classic',  10),
  ('shape_round',    'shape', 'gewoehnlich', 'Kugelschleim',   'svg:shape_round',    20),
  ('shape_egg',      'shape', 'gewoehnlich', 'Glibber-Ei',     'svg:shape_egg',      30),
  ('shape_squircle', 'shape', 'gewoehnlich', 'Würfelschleim',  'svg:shape_squircle', 40),
  ('shape_ghost',    'shape', 'selten',      'Geisterschleim', 'svg:shape_ghost',    50),
  ('shape_tall',     'shape', 'selten',      'Turmschleim',    'svg:shape_tall',     60),
  ('shape_wobble',   'shape', 'selten',      'Wackelpudding',  'svg:shape_wobble',   70),
  ('shape_star',     'shape', 'legendaer',   'Sternschleim',   'svg:shape_star',     80),

  ('eyes_dots',    'eyes', 'gewoehnlich', 'Knopfaugen',    'svg:eyes_dots',    310),
  ('eyes_happy',   'eyes', 'gewoehnlich', 'Lachaugen',     'svg:eyes_happy',   320),
  ('eyes_wink',    'eyes', 'gewoehnlich', 'Zwinker',       'svg:eyes_wink',    330),
  ('eyes_wide',    'eyes', 'gewoehnlich', 'Staunaugen',    'svg:eyes_wide',    340),
  ('eyes_shy',     'eyes', 'gewoehnlich', 'Schüchtern',    'svg:eyes_shy',     350),
  ('eyes_sleepy',  'eyes', 'gewoehnlich', 'Müde',          'svg:eyes_sleepy',  360),
  ('eyes_panic',   'eyes', 'gewoehnlich', 'Panik-Augen',   'svg:eyes_panic',   370),
  ('eyes_sparkle', 'eyes', 'selten',      'Glitzerblick',  'svg:eyes_sparkle', 380),
  ('eyes_hearts',  'eyes', 'selten',      'Herzchenblick', 'svg:eyes_hearts',  390),
  ('eyes_cool',    'eyes', 'selten',      'Sonnenbrille',  'svg:eyes_cool',    400),
  ('eyes_glitch',  'eyes', 'legendaer',   'Glitch-Augen',  'svg:eyes_glitch',  410),

  ('mouth_grin',    'mouth', 'gewoehnlich', 'Grinser',            'svg:mouth_grin',    510),
  ('mouth_smile',   'mouth', 'gewoehnlich', 'Lächeln',            'svg:mouth_smile',   520),
  ('mouth_oops',    'mouth', 'gewoehnlich', 'Oops-Mund',          'svg:mouth_oops',    530),
  ('mouth_shy',     'mouth', 'gewoehnlich', 'Piepsmund',          'svg:mouth_shy',     540),
  ('mouth_wavy',    'mouth', 'gewoehnlich', 'Wellenmund',         'svg:mouth_wavy',    550),
  ('mouth_panic',   'mouth', 'gewoehnlich', 'Schreckmund',        'svg:mouth_panic',   560),
  ('mouth_smirk',   'mouth', 'selten',      'Cooler Smirk',       'svg:mouth_smirk',   570),
  ('mouth_kiss',    'mouth', 'selten',      'Kussmund',           'svg:mouth_kiss',    580),
  ('mouth_tongue',  'mouth', 'selten',      'Frechzunge',         'svg:mouth_tongue',  590),
  ('mouth_rainbow', 'mouth', 'legendaer',   'Regenbogen-Grinser', 'svg:mouth_rainbow', 600),
  ('mouth_glitch',  'mouth', 'legendaer',   'Glitch-Mund',        'svg:mouth_glitch',  610),

  ('bg_cream',   'background', 'gewoehnlich', 'Cremewölkchen',  'svg:bg_cream',   710),
  ('bg_mint',    'background', 'gewoehnlich', 'Mintwiese',      'svg:bg_mint',    720),
  ('bg_sky',     'background', 'gewoehnlich', 'Himmelchen',     'svg:bg_sky',     730),
  ('bg_lilac',   'background', 'gewoehnlich', 'Lavendel',       'svg:bg_lilac',   740),
  ('bg_sunset',  'background', 'selten',      'Sonnenuntergang','svg:bg_sunset',  750),
  ('bg_bubbles', 'background', 'selten',      'Blasenbad',      'svg:bg_bubbles', 760),
  ('bg_stars',   'background', 'selten',      'Sternenhimmel',  'svg:bg_stars',   770),
  ('bg_gold',    'background', 'legendaer',   'Goldrausch',     'svg:bg_gold',    780),
  ('bg_holo',    'background', 'legendaer',   'Holo-Traum',     'svg:bg_holo',    790)
ON CONFLICT (id) DO UPDATE SET
  slot = EXCLUDED.slot,
  rarity = EXCLUDED.rarity,
  name_de = EXCLUDED.name_de,
  asset_path = EXCLUDED.asset_path,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- Tints stay active; refresh their sort order + logical asset path.
UPDATE cosmetic_items SET asset_path = 'svg:' || id, active = true,
  sort_order = CASE id
    WHEN 'tint_peach' THEN 110
    WHEN 'tint_mint' THEN 120
    WHEN 'tint_sky' THEN 130
    WHEN 'tint_lilac' THEN 140
    WHEN 'tint_mango' THEN 150
    WHEN 'tint_blush' THEN 160
    WHEN 'tint_grape_jelly' THEN 170
    WHEN 'tint_matcha_swirl' THEN 180
    WHEN 'tint_midnight' THEN 190
    WHEN 'tint_gold' THEN 200
    WHEN 'tint_holo' THEN 210
    ELSE sort_order
  END
WHERE slot = 'body_tint';

-- Retire legacy face/hat/extra items (rows kept for lootbox_opens FK history).
UPDATE cosmetic_items SET active = false WHERE slot IN ('face', 'hat', 'extra');

-- ── 3. Face → eyes+mouth decomposition map ──────────────────────────
CREATE TEMP TABLE _face_map (
  face_id text PRIMARY KEY,
  eyes_id text NOT NULL,
  mouth_id text NOT NULL
) ON COMMIT DROP;

INSERT INTO _face_map (face_id, eyes_id, mouth_id) VALUES
  ('face_grin',    'eyes_dots',    'mouth_grin'),
  ('face_wink',    'eyes_wink',    'mouth_smile'),
  ('face_oops',    'eyes_wide',    'mouth_oops'),
  ('face_shy',     'eyes_shy',     'mouth_shy'),
  ('face_sleepy',  'eyes_sleepy',  'mouth_wavy'),
  ('face_panic',   'eyes_panic',   'mouth_panic'),
  ('face_sparkle', 'eyes_sparkle', 'mouth_smile'),
  ('face_hearts',  'eyes_hearts',  'mouth_kiss'),
  ('face_cool',    'eyes_cool',    'mouth_smirk'),
  ('face_rainbow', 'eyes_happy',   'mouth_rainbow'),
  ('face_glitch',  'eyes_glitch',  'mouth_glitch');

-- ── 4. Ownership migration ──────────────────────────────────────────
-- 4a. Owned faces grant their eyes+mouth pair (keep acquisition source).
INSERT INTO user_cosmetics (user_id, item_id, source)
  SELECT uc.user_id, fm.eyes_id, uc.source
  FROM user_cosmetics uc
  JOIN _face_map fm ON fm.face_id = uc.item_id
  ON CONFLICT DO NOTHING;
INSERT INTO user_cosmetics (user_id, item_id, source)
  SELECT uc.user_id, fm.mouth_id, uc.source
  FROM user_cosmetics uc
  JOIN _face_map fm ON fm.face_id = uc.item_id
  ON CONFLICT DO NOTHING;

-- 4b. Everyone gets the starters (shape + eyes + mouth; tint already owned).
INSERT INTO user_cosmetics (user_id, item_id, source)
  SELECT id, 'shape_classic', 'starter' FROM profiles
  ON CONFLICT DO NOTHING;
INSERT INTO user_cosmetics (user_id, item_id, source)
  SELECT id, 'eyes_dots', 'starter' FROM profiles
  ON CONFLICT DO NOTHING;
INSERT INTO user_cosmetics (user_id, item_id, source)
  SELECT id, 'mouth_grin', 'starter' FROM profiles
  ON CONFLICT DO NOTHING;

-- ── 5. Hat/Extra refunds ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schleimi_v2_refunds (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  rarity text NOT NULL,
  refund_hc integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

ALTER TABLE schleimi_v2_refunds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON schleimi_v2_refunds FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  -- Allow hirncoins updates despite trg_profiles_protect_economy.
  PERFORM set_config('ratepanik.grant_economy', '1', true);

  -- Log refunds first (idempotent via PK — reruns skip existing rows).
  WITH owned AS (
    SELECT uc.user_id, uc.item_id, ci.rarity,
      CASE ci.rarity
        WHEN 'gewoehnlich' THEN 60
        WHEN 'selten' THEN 150
        WHEN 'legendaer' THEN 400
      END AS refund_hc
    FROM user_cosmetics uc
    JOIN cosmetic_items ci ON ci.id = uc.item_id
    WHERE ci.slot IN ('hat', 'extra')
  ), logged AS (
    INSERT INTO schleimi_v2_refunds (user_id, item_id, rarity, refund_hc)
      SELECT user_id, item_id, rarity, refund_hc FROM owned
      ON CONFLICT DO NOTHING
      RETURNING user_id, refund_hc
  )
  UPDATE profiles p
    SET hirncoins = p.hirncoins + s.total, updated_at = now()
    FROM (
      SELECT user_id, sum(refund_hc)::integer AS total
      FROM logged GROUP BY user_id
    ) s
    WHERE p.id = s.user_id;
END;
$$;

-- Remove retired ownership rows (faces are decomposed, hats/extras refunded).
DELETE FROM user_cosmetics uc
  USING cosmetic_items ci
  WHERE ci.id = uc.item_id AND ci.slot IN ('face', 'hat', 'extra');

-- ── 6. Loadout migration ─────────────────────────────────────────────
-- Equipped face → eyes + mouth rows.
INSERT INTO user_loadout (user_id, slot, item_id)
  SELECT ul.user_id, 'eyes', fm.eyes_id
  FROM user_loadout ul
  JOIN _face_map fm ON fm.face_id = ul.item_id
  WHERE ul.slot = 'face'
  ON CONFLICT (user_id, slot) DO UPDATE SET item_id = EXCLUDED.item_id, updated_at = now();
INSERT INTO user_loadout (user_id, slot, item_id)
  SELECT ul.user_id, 'mouth', fm.mouth_id
  FROM user_loadout ul
  JOIN _face_map fm ON fm.face_id = ul.item_id
  WHERE ul.slot = 'face'
  ON CONFLICT (user_id, slot) DO UPDATE SET item_id = EXCLUDED.item_id, updated_at = now();

-- Every profile gets shape / eyes / mouth / background rows.
INSERT INTO user_loadout (user_id, slot, item_id)
  SELECT id, 'shape', 'shape_classic' FROM profiles
  ON CONFLICT (user_id, slot) DO NOTHING;
INSERT INTO user_loadout (user_id, slot, item_id)
  SELECT id, 'eyes', 'eyes_dots' FROM profiles
  ON CONFLICT (user_id, slot) DO NOTHING;
INSERT INTO user_loadout (user_id, slot, item_id)
  SELECT id, 'mouth', 'mouth_grin' FROM profiles
  ON CONFLICT (user_id, slot) DO NOTHING;
INSERT INTO user_loadout (user_id, slot, item_id)
  SELECT id, 'background', NULL FROM profiles
  ON CONFLICT (user_id, slot) DO NOTHING;

-- Drop legacy loadout rows, then enforce the new slot set.
DELETE FROM user_loadout WHERE slot IN ('face', 'hat', 'extra');

ALTER TABLE user_loadout ADD CONSTRAINT user_loadout_slot_check
  CHECK (slot IN ('shape', 'body_tint', 'eyes', 'mouth', 'background'));

-- ── 7. Crates ────────────────────────────────────────────────────────
UPDATE lootbox_defs SET active = false
  WHERE id IN ('lootbox_face', 'lootbox_hat', 'lootbox_extra');

INSERT INTO lootbox_defs (
  id, price_hc,
  weight_gewoehnlich, weight_selten, weight_legendaer,
  dupe_hc_gewoehnlich, dupe_hc_selten, dupe_hc_legendaer,
  art_closed, art_open, active, allowed_slots
) VALUES
  ('lootbox_form', 240,
   70, 24, 6,
   15, 35, 60,
   '/rp/schleimi/lootbox_form_closed.png',
   '/rp/schleimi/lootbox_form_open.png',
   true, ARRAY['shape']),
  ('lootbox_gesicht', 240,
   70, 24, 6,
   15, 35, 60,
   '/rp/schleimi/lootbox_face_closed.png',
   '/rp/schleimi/lootbox_face_open.png',
   true, ARRAY['eyes', 'mouth']),
  ('lootbox_hintergrund', 240,
   70, 24, 6,
   15, 35, 60,
   '/rp/schleimi/lootbox_deko_closed.png',
   '/rp/schleimi/lootbox_deko_open.png',
   true, ARRAY['background'])
ON CONFLICT (id) DO UPDATE SET
  price_hc = EXCLUDED.price_hc,
  weight_gewoehnlich = EXCLUDED.weight_gewoehnlich,
  weight_selten = EXCLUDED.weight_selten,
  weight_legendaer = EXCLUDED.weight_legendaer,
  dupe_hc_gewoehnlich = EXCLUDED.dupe_hc_gewoehnlich,
  dupe_hc_selten = EXCLUDED.dupe_hc_selten,
  dupe_hc_legendaer = EXCLUDED.dupe_hc_legendaer,
  art_closed = EXCLUDED.art_closed,
  art_open = EXCLUDED.art_open,
  active = true,
  allowed_slots = EXCLUDED.allowed_slots;

-- Daily deal rotation now cycles the new crate ids.
CREATE OR REPLACE FUNCTION daily_deal_box_id(d date DEFAULT CURRENT_DATE)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (ARRAY['lootbox_basic','lootbox_form','lootbox_gesicht','lootbox_hintergrund'])[
    ((d - DATE '1970-01-01') % 4) + 1
  ];
$$;

-- ── 8. RPCs ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION grant_schleimi_starter(_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_cosmetics (user_id, item_id, source)
    VALUES
      (_uid, 'shape_classic', 'starter'),
      (_uid, 'tint_peach', 'starter'),
      (_uid, 'eyes_dots', 'starter'),
      (_uid, 'mouth_grin', 'starter')
    ON CONFLICT DO NOTHING;

  INSERT INTO user_loadout (user_id, slot, item_id)
    VALUES
      (_uid, 'shape', 'shape_classic'),
      (_uid, 'body_tint', 'tint_peach'),
      (_uid, 'eyes', 'eyes_dots'),
      (_uid, 'mouth', 'mouth_grin'),
      (_uid, 'background', NULL)
    ON CONFLICT (user_id, slot) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION equip_slot(p_slot text, p_item_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _item cosmetic_items%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  IF p_slot NOT IN ('shape', 'body_tint', 'eyes', 'mouth', 'background') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unbekannter Slot');
  END IF;

  IF p_item_id IS NULL OR btrim(p_item_id) = '' THEN
    IF p_slot <> 'background' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Dieser Slot bleibt an');
    END IF;
    INSERT INTO user_loadout (user_id, slot, item_id, updated_at)
      VALUES (_uid, p_slot, NULL, now())
      ON CONFLICT (user_id, slot) DO UPDATE
        SET item_id = NULL, updated_at = now();
    RETURN jsonb_build_object('ok', true, 'slot', p_slot, 'item_id', NULL);
  END IF;

  SELECT * INTO _item FROM cosmetic_items c WHERE c.id = p_item_id AND c.active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unbekanntes Item');
  END IF;
  IF _item.slot <> p_slot THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Passt nicht in den Slot');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM user_cosmetics uc
    WHERE uc.user_id = _uid AND uc.item_id = p_item_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht im Besitz');
  END IF;

  INSERT INTO user_loadout (user_id, slot, item_id, updated_at)
    VALUES (_uid, p_slot, p_item_id, now())
    ON CONFLICT (user_id, slot) DO UPDATE
      SET item_id = EXCLUDED.item_id, updated_at = now();

  RETURN jsonb_build_object('ok', true, 'slot', p_slot, 'item_id', p_item_id);
END;
$$;
