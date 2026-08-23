-- Phase C: Schleimi slot cosmetics + one lootbox SKU.
-- Catalog seeded from public/rp/schleimi/MANIFEST.json stub ids.
-- Lootboxes: buy→instant open. No second SKU. Mutations RPC-only.

CREATE TABLE IF NOT EXISTS cosmetic_items (
  id text PRIMARY KEY,
  slot text NOT NULL CHECK (slot IN ('body_tint', 'face', 'hat', 'extra')),
  rarity text NOT NULL CHECK (rarity IN ('gewoehnlich', 'selten', 'legendaer')),
  name_de text NOT NULL,
  asset_path text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cosmetic_items_slot_rarity_idx
  ON cosmetic_items (slot, rarity)
  WHERE active;

CREATE TABLE IF NOT EXISTS lootbox_defs (
  id text PRIMARY KEY,
  price_hc integer NOT NULL CHECK (price_hc > 0),
  weight_gewoehnlich integer NOT NULL CHECK (weight_gewoehnlich >= 0),
  weight_selten integer NOT NULL CHECK (weight_selten >= 0),
  weight_legendaer integer NOT NULL CHECK (weight_legendaer >= 0),
  dupe_hc_gewoehnlich integer NOT NULL CHECK (dupe_hc_gewoehnlich >= 0),
  dupe_hc_selten integer NOT NULL CHECK (dupe_hc_selten >= 0),
  dupe_hc_legendaer integer NOT NULL CHECK (dupe_hc_legendaer >= 0),
  art_closed text NOT NULL,
  art_open text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT lootbox_defs_weights_sum_100 CHECK (
    weight_gewoehnlich + weight_selten + weight_legendaer = 100
  )
);

CREATE TABLE IF NOT EXISTS user_loadout (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot text NOT NULL CHECK (slot IN ('body_tint', 'face', 'hat', 'extra')),
  item_id text REFERENCES cosmetic_items(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, slot)
);

CREATE INDEX IF NOT EXISTS user_loadout_item_idx ON user_loadout (item_id);

CREATE TABLE IF NOT EXISTS lootbox_opens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  def_id text NOT NULL REFERENCES lootbox_defs(id),
  request_id uuid,
  price_paid integer NOT NULL,
  rolled_rarity text NOT NULL CHECK (rolled_rarity IN ('gewoehnlich', 'selten', 'legendaer')),
  rolled_item_id text NOT NULL REFERENCES cosmetic_items(id),
  duplicate boolean NOT NULL,
  consolation_hc integer NOT NULL DEFAULT 0,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lootbox_opens_user_request_uidx
  ON lootbox_opens (user_id, request_id)
  WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS lootbox_opens_user_created_idx
  ON lootbox_opens (user_id, created_at DESC);

ALTER TABLE user_cosmetics DROP CONSTRAINT IF EXISTS user_cosmetics_avatar_id;

ALTER TABLE user_cosmetics ADD COLUMN IF NOT EXISTS source text;

UPDATE user_cosmetics SET source = 'legacy_avatar' WHERE source IS NULL;

ALTER TABLE user_cosmetics ALTER COLUMN source SET DEFAULT 'lootbox';
ALTER TABLE user_cosmetics ALTER COLUMN source SET NOT NULL;

ALTER TABLE user_cosmetics DROP CONSTRAINT IF EXISTS user_cosmetics_source_check;
ALTER TABLE user_cosmetics ADD CONSTRAINT user_cosmetics_source_check
  CHECK (source IN ('starter', 'lootbox', 'legacy_avatar'));

ALTER TABLE cosmetic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootbox_defs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loadout ENABLE ROW LEVEL SECURITY;
ALTER TABLE lootbox_opens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cosmetic_items_select ON cosmetic_items;
CREATE POLICY cosmetic_items_select ON cosmetic_items
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS lootbox_defs_select ON lootbox_defs;
CREATE POLICY lootbox_defs_select ON lootbox_defs
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS user_loadout_select ON user_loadout;
CREATE POLICY user_loadout_select ON user_loadout
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS user_cosmetics_select_own ON user_cosmetics;
CREATE POLICY user_cosmetics_select_own ON user_cosmetics
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS lootbox_opens_select_own ON lootbox_opens;
CREATE POLICY lootbox_opens_select_own ON lootbox_opens
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON cosmetic_items TO authenticated;
GRANT SELECT ON lootbox_defs TO authenticated;
GRANT SELECT ON user_loadout TO authenticated;
GRANT SELECT ON lootbox_opens TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON cosmetic_items FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON lootbox_defs FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON user_loadout FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON lootbox_opens FROM PUBLIC, anon, authenticated;

INSERT INTO cosmetic_items (id, slot, rarity, name_de, asset_path, sort_order) VALUES
  ('tint_peach', 'body_tint', 'gewoehnlich', 'Pfirsich', '/rp/schleimi/slot_body_tint__gewoehnlich__peach.png', 10),
  ('tint_mint', 'body_tint', 'gewoehnlich', 'Minzschleim', '/rp/schleimi/slot_body_tint__gewoehnlich__mint.png', 20),
  ('tint_sky', 'body_tint', 'gewoehnlich', 'Himmelblau', '/rp/schleimi/slot_body_tint__gewoehnlich__sky.png', 30),
  ('tint_lilac', 'body_tint', 'gewoehnlich', 'Flieder', '/rp/schleimi/slot_body_tint__gewoehnlich__lilac.png', 40),
  ('tint_mango', 'body_tint', 'gewoehnlich', 'Mango', '/rp/schleimi/slot_body_tint__gewoehnlich__mango.png', 50),
  ('tint_blush', 'body_tint', 'gewoehnlich', 'Errötend', '/rp/schleimi/slot_body_tint__gewoehnlich__blush.png', 60),
  ('tint_grape_jelly', 'body_tint', 'selten', 'Traubenglibber', '/rp/schleimi/slot_body_tint__selten__grape_jelly.png', 70),
  ('tint_matcha_swirl', 'body_tint', 'selten', 'Matcha-Wirbel', '/rp/schleimi/slot_body_tint__selten__matcha_swirl.png', 80),
  ('tint_midnight', 'body_tint', 'selten', 'Nachtgelee', '/rp/schleimi/slot_body_tint__selten__midnight.png', 90),
  ('tint_gold', 'body_tint', 'legendaer', 'Goldschleim', '/rp/schleimi/slot_body_tint__legendaer__gold.png', 100),
  ('tint_holo', 'body_tint', 'legendaer', 'Holo-Schleim', '/rp/schleimi/slot_body_tint__legendaer__holo.png', 110),
  ('face_grin', 'face', 'gewoehnlich', 'Grinser', '/rp/schleimi/slot_face__gewoehnlich__grin.png', 210),
  ('face_wink', 'face', 'gewoehnlich', 'Zwinker', '/rp/schleimi/slot_face__gewoehnlich__wink.png', 220),
  ('face_oops', 'face', 'gewoehnlich', 'Oops-Mund', '/rp/schleimi/slot_face__gewoehnlich__oops.png', 230),
  ('face_shy', 'face', 'gewoehnlich', 'Schüchtern', '/rp/schleimi/slot_face__gewoehnlich__shy.png', 240),
  ('face_sleepy', 'face', 'gewoehnlich', 'Müde', '/rp/schleimi/slot_face__gewoehnlich__sleepy.png', 250),
  ('face_panic', 'face', 'gewoehnlich', 'Panik-Augen', '/rp/schleimi/slot_face__gewoehnlich__panic.png', 260),
  ('face_sparkle', 'face', 'selten', 'Glitzerblick', '/rp/schleimi/slot_face__selten__sparkle.png', 270),
  ('face_hearts', 'face', 'selten', 'Herzchenblick', '/rp/schleimi/slot_face__selten__hearts.png', 280),
  ('face_cool', 'face', 'selten', 'Cooler Smirk', '/rp/schleimi/slot_face__selten__cool.png', 290),
  ('face_rainbow', 'face', 'legendaer', 'Regenbogen-Grinser', '/rp/schleimi/slot_face__legendaer__rainbow.png', 300),
  ('face_glitch', 'face', 'legendaer', 'Glitch-Mimik', '/rp/schleimi/slot_face__legendaer__glitch.png', 310),
  ('hat_party_cone', 'hat', 'gewoehnlich', 'Partyhütchen', '/rp/schleimi/slot_hat__gewoehnlich__party_cone.png', 410),
  ('hat_paper_boat', 'hat', 'gewoehnlich', 'Papierboot', '/rp/schleimi/slot_hat__gewoehnlich__paper_boat.png', 420),
  ('hat_shower_cap', 'hat', 'gewoehnlich', 'Duschhaube', '/rp/schleimi/slot_hat__gewoehnlich__shower_cap.png', 430),
  ('hat_beanie', 'hat', 'gewoehnlich', 'Beanie', '/rp/schleimi/slot_hat__gewoehnlich__beanie.png', 440),
  ('hat_bow', 'hat', 'gewoehnlich', 'Haarschleife', '/rp/schleimi/slot_hat__gewoehnlich__bow.png', 450),
  ('hat_propeller', 'hat', 'gewoehnlich', 'Propeller-Mütze', '/rp/schleimi/slot_hat__gewoehnlich__propeller.png', 460),
  ('hat_disco', 'hat', 'selten', 'Discokugel', '/rp/schleimi/slot_hat__selten__disco.png', 470),
  ('hat_pretzel', 'hat', 'selten', 'Brezel-Hut', '/rp/schleimi/slot_hat__selten__pretzel.png', 480),
  ('hat_cat_ears', 'hat', 'selten', 'Katzenohren', '/rp/schleimi/slot_hat__selten__cat_ears.png', 490),
  ('hat_gold_crown', 'hat', 'legendaer', 'Goldkrone', '/rp/schleimi/slot_hat__legendaer__gold_crown.png', 500),
  ('hat_neon_halo', 'hat', 'legendaer', 'Neon-Heiligenschein', '/rp/schleimi/slot_hat__legendaer__neon_halo.png', 510),
  ('extra_round_glasses', 'extra', 'gewoehnlich', 'Runde Brille', '/rp/schleimi/slot_extra__gewoehnlich__round_glasses.png', 610),
  ('extra_sweat_drop', 'extra', 'gewoehnlich', 'Schweißtropfen', '/rp/schleimi/slot_extra__gewoehnlich__sweat_drop.png', 620),
  ('extra_party_horn', 'extra', 'gewoehnlich', 'Luftrüssel', '/rp/schleimi/slot_extra__gewoehnlich__party_horn.png', 630),
  ('extra_blush', 'extra', 'gewoehnlich', 'Schamröte', '/rp/schleimi/slot_extra__gewoehnlich__blush.png', 640),
  ('extra_plaster', 'extra', 'gewoehnlich', 'Pflaster', '/rp/schleimi/slot_extra__gewoehnlich__plaster.png', 650),
  ('extra_bowtie', 'extra', 'gewoehnlich', 'Fliege', '/rp/schleimi/slot_extra__gewoehnlich__bowtie.png', 660),
  ('extra_star_shades', 'extra', 'selten', 'Sternenbrille', '/rp/schleimi/slot_extra__selten__star_shades.png', 670),
  ('extra_confetti', 'extra', 'selten', 'Konfetti-Wolke', '/rp/schleimi/slot_extra__selten__confetti.png', 680),
  ('extra_mustache', 'extra', 'selten', 'Schnauzer', '/rp/schleimi/slot_extra__selten__mustache.png', 690),
  ('extra_gold_shades', 'extra', 'legendaer', 'Goldbrille', '/rp/schleimi/slot_extra__legendaer__gold_shades.png', 700),
  ('extra_glitch_aura', 'extra', 'legendaer', 'Glitch-Aura', '/rp/schleimi/slot_extra__legendaer__glitch_aura.png', 710)
ON CONFLICT (id) DO UPDATE SET
  slot = EXCLUDED.slot,
  rarity = EXCLUDED.rarity,
  name_de = EXCLUDED.name_de,
  asset_path = EXCLUDED.asset_path,
  sort_order = EXCLUDED.sort_order,
  active = true;

INSERT INTO lootbox_defs (
  id, price_hc,
  weight_gewoehnlich, weight_selten, weight_legendaer,
  dupe_hc_gewoehnlich, dupe_hc_selten, dupe_hc_legendaer,
  art_closed, art_open, active
) VALUES (
  'lootbox_basic', 100,
  70, 24, 6,
  15, 35, 60,
  '/rp/schleimi/lootbox_closed.png',
  '/rp/schleimi/lootbox_open.png',
  true
)
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
  active = true;

CREATE OR REPLACE FUNCTION grant_schleimi_starter(_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_cosmetics (user_id, item_id, source)
    VALUES (_uid, 'tint_peach', 'starter')
    ON CONFLICT DO NOTHING;
  INSERT INTO user_cosmetics (user_id, item_id, source)
    VALUES (_uid, 'face_grin', 'starter')
    ON CONFLICT DO NOTHING;

  INSERT INTO user_loadout (user_id, slot, item_id)
    VALUES
      (_uid, 'body_tint', 'tint_peach'),
      (_uid, 'face', 'face_grin'),
      (_uid, 'hat', NULL),
      (_uid, 'extra', NULL)
    ON CONFLICT (user_id, slot) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION grant_starter_avatar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_cosmetics (user_id, item_id, source)
    VALUES (NEW.id, 'default_01', 'legacy_avatar')
    ON CONFLICT DO NOTHING;
  PERFORM grant_schleimi_starter(NEW.id);
  RETURN NEW;
END;
$$;

INSERT INTO user_cosmetics (user_id, item_id, source)
  SELECT id, 'tint_peach', 'starter' FROM profiles
  ON CONFLICT DO NOTHING;
INSERT INTO user_cosmetics (user_id, item_id, source)
  SELECT id, 'face_grin', 'starter' FROM profiles
  ON CONFLICT DO NOTHING;

INSERT INTO user_loadout (user_id, slot, item_id)
  SELECT id, 'body_tint', 'tint_peach' FROM profiles
  ON CONFLICT (user_id, slot) DO NOTHING;
INSERT INTO user_loadout (user_id, slot, item_id)
  SELECT id, 'face', 'face_grin' FROM profiles
  ON CONFLICT (user_id, slot) DO NOTHING;
INSERT INTO user_loadout (user_id, slot, item_id)
  SELECT id, 'hat', NULL FROM profiles
  ON CONFLICT (user_id, slot) DO NOTHING;
INSERT INTO user_loadout (user_id, slot, item_id)
  SELECT id, 'extra', NULL FROM profiles
  ON CONFLICT (user_id, slot) DO NOTHING;

CREATE OR REPLACE FUNCTION lootbox_open_payload(
  _item cosmetic_items,
  _duplicate boolean,
  _consolation integer,
  _hirncoins integer
)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'ok', true,
    'duplicate', _duplicate,
    'item_id', _item.id,
    'slot', _item.slot,
    'rarity', _item.rarity,
    'name_de', _item.name_de,
    'asset_path', _item.asset_path,
    'hirncoins', _hirncoins,
    'consolation_hc', _consolation
  );
$$;

CREATE OR REPLACE FUNCTION open_lootbox(box_id text, request_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _def lootbox_defs%ROWTYPE;
  _balance integer;
  _roll integer;
  _rarity text;
  _item cosmetic_items%ROWTYPE;
  _owned boolean;
  _consolation integer := 0;
  _duplicate boolean := false;
  _payload jsonb;
  _existing lootbox_opens%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  IF request_id IS NOT NULL THEN
    SELECT * INTO _existing
    FROM lootbox_opens o
    WHERE o.user_id = _uid AND o.request_id = open_lootbox.request_id;
    IF FOUND THEN
      SELECT hirncoins INTO _balance FROM profiles WHERE id = _uid;
      RETURN (_existing.result - 'hirncoins') || jsonb_build_object('hirncoins', COALESCE(_balance, 0));
    END IF;
  END IF;

  SELECT * INTO _def FROM lootbox_defs d WHERE d.id = box_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unbekannte Box');
  END IF;
  IF NOT _def.active THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Box inaktiv');
  END IF;

  SELECT hirncoins INTO _balance FROM profiles WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Kein Profil');
  END IF;

  IF request_id IS NOT NULL THEN
    SELECT * INTO _existing
    FROM lootbox_opens o
    WHERE o.user_id = _uid AND o.request_id = open_lootbox.request_id;
    IF FOUND THEN
      RETURN (_existing.result - 'hirncoins') || jsonb_build_object('hirncoins', _balance);
    END IF;
  END IF;

  IF _balance < _def.price_hc THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht genug Hirncoins');
  END IF;

  UPDATE profiles
    SET hirncoins = hirncoins - _def.price_hc, updated_at = now()
    WHERE id = _uid;
  _balance := _balance - _def.price_hc;

  _roll := floor(random() * 100)::int;
  IF _roll < _def.weight_gewoehnlich THEN
    _rarity := 'gewoehnlich';
  ELSIF _roll < (_def.weight_gewoehnlich + _def.weight_selten) THEN
    _rarity := 'selten';
  ELSE
    _rarity := 'legendaer';
  END IF;

  SELECT * INTO _item
  FROM cosmetic_items c
  WHERE c.rarity = _rarity AND c.active
  ORDER BY random()
  LIMIT 1;

  IF NOT FOUND THEN
    UPDATE profiles
      SET hirncoins = hirncoins + _def.price_hc, updated_at = now()
      WHERE id = _uid;
    RETURN jsonb_build_object('ok', false, 'error', 'Katalog leer');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_cosmetics uc
    WHERE uc.user_id = _uid AND uc.item_id = _item.id
  ) INTO _owned;

  IF _owned THEN
    _duplicate := true;
    _consolation := CASE _rarity
      WHEN 'gewoehnlich' THEN _def.dupe_hc_gewoehnlich
      WHEN 'selten' THEN _def.dupe_hc_selten
      ELSE _def.dupe_hc_legendaer
    END;
    UPDATE profiles
      SET hirncoins = hirncoins + _consolation, updated_at = now()
      WHERE id = _uid;
    _balance := _balance + _consolation;
  ELSE
    INSERT INTO user_cosmetics (user_id, item_id, source)
      VALUES (_uid, _item.id, 'lootbox');
  END IF;

  _payload := lootbox_open_payload(_item, _duplicate, _consolation, _balance);

  INSERT INTO lootbox_opens (
    user_id, def_id, request_id, price_paid,
    rolled_rarity, rolled_item_id, duplicate, consolation_hc, result
  ) VALUES (
    _uid, _def.id, request_id, _def.price_hc,
    _rarity, _item.id, _duplicate, _consolation, _payload
  );

  RETURN _payload;
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

  IF p_slot NOT IN ('body_tint', 'face', 'hat', 'extra') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unbekannter Slot');
  END IF;

  IF p_item_id IS NULL OR btrim(p_item_id) = '' THEN
    IF p_slot IN ('body_tint', 'face') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Farbe und Gesicht bleiben an');
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

CREATE OR REPLACE FUNCTION purchase_avatar(item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;
  RETURN jsonb_build_object('ok', false, 'error', 'Shop umgestellt');
END;
$$;

CREATE OR REPLACE FUNCTION grant_onboarding_avatar(item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  PERFORM grant_schleimi_starter(_uid);

  UPDATE profiles
    SET avatar_onboarding_done = true, updated_at = now()
    WHERE id = _uid;

  RETURN jsonb_build_object('ok', true, 'avatar_id', 'schleimi');
END;
$$;

REVOKE ALL ON FUNCTION grant_schleimi_starter(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION lootbox_open_payload(cosmetic_items, boolean, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION open_lootbox(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION equip_slot(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION open_lootbox(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION equip_slot(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_avatar(text) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_onboarding_avatar(text) TO authenticated;
GRANT EXECUTE ON FUNCTION equip_avatar(text) TO authenticated;
