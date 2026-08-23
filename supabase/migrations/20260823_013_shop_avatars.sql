-- Avatar shop MVP: ownership + Hirncoin purchases.
-- Catalog is a STATIC manifest in src/lib/shop-catalog.ts (keep prices in sync).
-- Lootboxes are out of scope.

-- ============================================================
-- TABLE: user_cosmetics (owned avatar looks)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_cosmetics (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id),
  CONSTRAINT user_cosmetics_avatar_id
    CHECK (item_id IN (
      'default_01', 'default_02', 'default_03',
      'default_04', 'default_05', 'default_06'
    ))
);

CREATE INDEX IF NOT EXISTS user_cosmetics_user_idx ON user_cosmetics (user_id);

ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_cosmetics_select_own" ON user_cosmetics;
CREATE POLICY "user_cosmetics_select_own" ON user_cosmetics
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies — mutations are RPC-only.

-- ============================================================
-- Starter grant: every profile owns default_01
-- ============================================================

CREATE OR REPLACE FUNCTION grant_starter_avatar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_cosmetics (user_id, item_id)
    VALUES (NEW.id, 'default_01')
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_grant_starter_avatar ON profiles;
CREATE TRIGGER profiles_grant_starter_avatar
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE grant_starter_avatar();

INSERT INTO user_cosmetics (user_id, item_id)
  SELECT id, 'default_01' FROM profiles
  ON CONFLICT DO NOTHING;

INSERT INTO user_cosmetics (user_id, item_id)
  SELECT id, avatar_id FROM profiles
  WHERE avatar_id IN (
    'default_01', 'default_02', 'default_03',
    'default_04', 'default_05', 'default_06'
  )
  ON CONFLICT DO NOTHING;

-- ============================================================
-- Price helper (must match src/lib/shop-catalog.ts)
-- ============================================================

CREATE OR REPLACE FUNCTION avatar_shop_price(item_id text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE item_id
    WHEN 'default_01' THEN 0
    WHEN 'default_02' THEN 40
    WHEN 'default_03' THEN 60
    WHEN 'default_04' THEN 80
    WHEN 'default_05' THEN 100
    WHEN 'default_06' THEN 140
    ELSE NULL
  END;
$$;

-- ============================================================
-- RPC: purchase_avatar
-- ============================================================

CREATE OR REPLACE FUNCTION purchase_avatar(item_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _price integer;
  _balance integer;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  _price := avatar_shop_price(item_id);
  IF _price IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unbekanntes Item');
  END IF;
  IF _price = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Starter ist kostenlos');
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_cosmetics c
    WHERE c.user_id = _uid AND c.item_id = purchase_avatar.item_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Schon im Besitz');
  END IF;

  SELECT hirncoins INTO _balance FROM profiles WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Kein Profil');
  END IF;
  IF _balance < _price THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht genug Hirncoins');
  END IF;

  UPDATE profiles
    SET hirncoins = hirncoins - _price, updated_at = now()
    WHERE id = _uid;

  INSERT INTO user_cosmetics (user_id, item_id)
    VALUES (_uid, purchase_avatar.item_id);

  RETURN jsonb_build_object(
    'ok', true,
    'hirncoins', _balance - _price,
    'item_id', purchase_avatar.item_id
  );
END;
$$;

-- ============================================================
-- RPC: equip_avatar
-- ============================================================

CREATE OR REPLACE FUNCTION equip_avatar(item_id text)
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

  IF avatar_shop_price(item_id) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unbekanntes Item');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM user_cosmetics c
    WHERE c.user_id = _uid AND c.item_id = equip_avatar.item_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht im Besitz');
  END IF;

  UPDATE profiles
    SET avatar_id = equip_avatar.item_id, updated_at = now()
    WHERE id = _uid;

  RETURN jsonb_build_object('ok', true, 'avatar_id', equip_avatar.item_id);
END;
$$;

-- ============================================================
-- RPC: grant_onboarding_avatar (one free look at first pick)
-- ============================================================

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

  IF avatar_shop_price(item_id) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unbekanntes Item');
  END IF;

  INSERT INTO user_cosmetics (user_id, item_id)
    VALUES (_uid, 'default_01')
    ON CONFLICT DO NOTHING;

  INSERT INTO user_cosmetics (user_id, item_id)
    VALUES (_uid, grant_onboarding_avatar.item_id)
    ON CONFLICT DO NOTHING;

  UPDATE profiles
    SET
      avatar_id = grant_onboarding_avatar.item_id,
      avatar_onboarding_done = true,
      updated_at = now()
    WHERE id = _uid;

  RETURN jsonb_build_object('ok', true, 'avatar_id', grant_onboarding_avatar.item_id);
END;
$$;

-- Tighten update_own_profile: cannot equip an unowned look.
CREATE OR REPLACE FUNCTION update_own_profile(
  new_username text DEFAULT NULL,
  new_avatar_id text DEFAULT NULL,
  new_avatar_onboarding_done boolean DEFAULT NULL
)
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

  IF new_avatar_id IS NOT NULL THEN
    IF avatar_shop_price(new_avatar_id) IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Unbekanntes Item');
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM user_cosmetics c
      WHERE c.user_id = _uid AND c.item_id = new_avatar_id
    ) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Nicht im Besitz');
    END IF;
  END IF;

  UPDATE profiles
  SET
    username = COALESCE(new_username, username),
    avatar_id = COALESCE(new_avatar_id, avatar_id),
    avatar_onboarding_done = COALESCE(new_avatar_onboarding_done, avatar_onboarding_done),
    updated_at = now()
  WHERE id = _uid;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION grant_starter_avatar() FROM PUBLIC;
REVOKE ALL ON FUNCTION avatar_shop_price(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION purchase_avatar(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION equip_avatar(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION grant_onboarding_avatar(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION update_own_profile(text, text, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION avatar_shop_price(text) TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_avatar(text) TO authenticated;
GRANT EXECUTE ON FUNCTION equip_avatar(text) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_onboarding_avatar(text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_own_profile(text, text, boolean) TO authenticated;
