-- Phase C extension: slot-filtered crates + daily deal.
-- Adds Mimik-Kiste (face), Hut-Kiste (hat), Extra-Kiste (extra).
-- Hirnkiste remains the only crate that drops body_tint items.
-- Daily deal: deterministic rotation of 30 % off one crate per UTC day.

-- ── allowed_slots column ────────────────────────────────────────────
-- NULL = all slots (Hirnkiste). Non-null = only those slots.
ALTER TABLE lootbox_defs
  ADD COLUMN IF NOT EXISTS allowed_slots text[];

UPDATE lootbox_defs SET allowed_slots = NULL WHERE id = 'lootbox_basic';

-- ── Seed three slot crates ──────────────────────────────────────────
INSERT INTO lootbox_defs (
  id, price_hc,
  weight_gewoehnlich, weight_selten, weight_legendaer,
  dupe_hc_gewoehnlich, dupe_hc_selten, dupe_hc_legendaer,
  art_closed, art_open, active, allowed_slots
) VALUES
  ('lootbox_face', 240,
   70, 24, 6,
   15, 35, 60,
   '/rp/schleimi/lootbox_closed.png',
   '/rp/schleimi/lootbox_open.png',
   true, ARRAY['face']),
  ('lootbox_hat', 240,
   70, 24, 6,
   15, 35, 60,
   '/rp/schleimi/lootbox_closed.png',
   '/rp/schleimi/lootbox_open.png',
   true, ARRAY['hat']),
  ('lootbox_extra', 240,
   70, 24, 6,
   15, 35, 60,
   '/rp/schleimi/lootbox_closed.png',
   '/rp/schleimi/lootbox_open.png',
   true, ARRAY['extra'])
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

-- ── Daily deal: deterministic rotation ──────────────────────────────
-- Uses UTC date. Index = (date - epoch) mod 4.
-- Order: lootbox_basic, lootbox_face, lootbox_hat, lootbox_extra.
-- Discount: 30 % off → price * 0.7, rounded up.
CREATE OR REPLACE FUNCTION daily_deal_box_id(d date DEFAULT CURRENT_DATE)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (ARRAY['lootbox_basic','lootbox_face','lootbox_hat','lootbox_extra'])[
    ((d - DATE '1970-01-01') % 4) + 1
  ];
$$;

CREATE OR REPLACE FUNCTION daily_deal_price(base_price integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ceil(base_price * 0.7)::integer;
$$;

-- ── Updated open_lootbox with slot filter + daily deal ──────────────
CREATE OR REPLACE FUNCTION open_lootbox(
  box_id text,
  request_id uuid DEFAULT NULL,
  use_deal boolean DEFAULT false
)
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
  _effective_price integer;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  IF COALESCE((SELECT is_anonymous FROM auth.users WHERE id = _uid), false) THEN
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

  _effective_price := _def.price_hc;
  IF use_deal THEN
    IF daily_deal_box_id() <> _def.id THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Kein Deal für diese Box heute');
    END IF;
    _effective_price := daily_deal_price(_def.price_hc);
  END IF;

  SELECT hirncoins INTO _balance FROM profiles WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Kein Profil');
  END IF;

  PERFORM set_config('ratepanik.grant_economy', '1', true);

  IF request_id IS NOT NULL THEN
    SELECT * INTO _existing
    FROM lootbox_opens o
    WHERE o.user_id = _uid AND o.request_id = open_lootbox.request_id;
    IF FOUND THEN
      RETURN (_existing.result - 'hirncoins') || jsonb_build_object('hirncoins', _balance);
    END IF;
  END IF;

  IF _balance < _effective_price THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht genug Hirncoins');
  END IF;

  UPDATE profiles
    SET hirncoins = hirncoins - _effective_price, updated_at = now()
    WHERE id = _uid;
  _balance := _balance - _effective_price;

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
    AND (_def.allowed_slots IS NULL OR c.slot = ANY(_def.allowed_slots))
  ORDER BY random()
  LIMIT 1;

  IF NOT FOUND THEN
    UPDATE profiles
      SET hirncoins = hirncoins + _effective_price, updated_at = now()
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
    _uid, _def.id, request_id, _effective_price,
    _rarity, _item.id, _duplicate, _consolation, _payload
  );

  RETURN _payload;
END;
$$;

REVOKE ALL ON FUNCTION open_lootbox(text, uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION open_lootbox(text, uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION open_lootbox(text, uuid, boolean) TO authenticated;

-- Grant read on daily deal helpers (pure functions, no secrets).
GRANT EXECUTE ON FUNCTION daily_deal_box_id(date) TO authenticated;
GRANT EXECUTE ON FUNCTION daily_deal_price(integer) TO authenticated;
