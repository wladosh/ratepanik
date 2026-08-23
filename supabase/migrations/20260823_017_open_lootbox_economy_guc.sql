-- P0: open_lootbox must set ratepanik.grant_economy or
-- trg_profiles_protect_economy silently keeps hirncoins unchanged.
-- Canonical body lives in 20260823_016_phase_c_lootbox.sql.

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

REVOKE ALL ON FUNCTION open_lootbox(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION open_lootbox(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION open_lootbox(text, uuid) TO authenticated;
