-- Friends MVP: friend codes, last-seen, request/accept friendships.
-- Mutations go through security-definer RPCs; clients may only SELECT own rows.

-- ============================================================
-- profiles: shareable friend_code + last_seen_at
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS friend_code text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_friend_code
  ON profiles (friend_code);

-- Internal helper: random 6-char code from the room-code alphabet.
CREATE OR REPLACE FUNCTION _new_friend_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text;
  i int;
  attempts int := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, 1 + floor(random() * 32)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE friend_code = result);
    attempts := attempts + 1;
    IF attempts > 32 THEN
      RAISE EXCEPTION 'friend_code generation failed';
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION profiles_set_friend_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.friend_code IS NULL OR NEW.friend_code = '' THEN
    NEW.friend_code := _new_friend_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_friend_code_before_ins ON profiles;
CREATE TRIGGER profiles_friend_code_before_ins
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE profiles_set_friend_code();

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE friend_code IS NULL LOOP
    UPDATE profiles SET friend_code = _new_friend_code() WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE profiles
  ALTER COLUMN friend_code SET NOT NULL;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS friend_code_format;
ALTER TABLE profiles
  ADD CONSTRAINT friend_code_format
  CHECK (friend_code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$');

-- ============================================================
-- TABLE: friendships
-- ============================================================

CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_no_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_pair UNIQUE (requester_id, addressee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS friendships_unordered_pair
  ON friendships (
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  );

CREATE INDEX IF NOT EXISTS friendships_requester_idx ON friendships (requester_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships (addressee_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships_select_own" ON friendships;
CREATE POLICY "friendships_select_own" ON friendships
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- No INSERT/UPDATE/DELETE policies — mutations are RPC-only.

-- ============================================================
-- RPC: request_friend
-- ============================================================

CREATE OR REPLACE FUNCTION request_friend(identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _ident text;
  _target uuid;
  _existing friendships%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = _uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Kein Profil');
  END IF;

  _ident := trim(identifier);
  IF _ident = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Name oder Code fehlt');
  END IF;

  IF char_length(_ident) = 6 THEN
    SELECT id INTO _target
      FROM profiles
      WHERE friend_code = upper(_ident);
  END IF;

  IF _target IS NULL THEN
    SELECT id INTO _target
      FROM profiles
      WHERE lower(username) = lower(_ident)
      LIMIT 1;
  END IF;

  IF _target IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Spieler nicht gefunden');
  END IF;

  IF _target = _uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Das bist du selbst');
  END IF;

  SELECT * INTO _existing
    FROM friendships
    WHERE LEAST(requester_id, addressee_id) = LEAST(_uid, _target)
      AND GREATEST(requester_id, addressee_id) = GREATEST(_uid, _target);

  IF FOUND THEN
    IF _existing.status = 'accepted' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Bereits befreundet');
    END IF;
    IF _existing.addressee_id = _uid THEN
      UPDATE friendships
        SET status = 'accepted', updated_at = now()
        WHERE id = _existing.id;
      RETURN jsonb_build_object('ok', true, 'accepted', true);
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'Anfrage läuft bereits');
  END IF;

  INSERT INTO friendships (requester_id, addressee_id, status)
    VALUES (_uid, _target, 'pending');

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================
-- RPC: respond_friend
-- ============================================================

CREATE OR REPLACE FUNCTION respond_friend(friendship_id uuid, accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row friendships%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  SELECT * INTO _row FROM friendships WHERE id = friendship_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Anfrage nicht gefunden');
  END IF;

  IF _row.addressee_id <> _uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Keine Berechtigung');
  END IF;

  IF _row.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Bereits beantwortet');
  END IF;

  IF accept THEN
    UPDATE friendships
      SET status = 'accepted', updated_at = now()
      WHERE id = friendship_id;
  ELSE
    DELETE FROM friendships WHERE id = friendship_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================
-- RPC: remove_friend
-- ============================================================

CREATE OR REPLACE FUNCTION remove_friend(friendship_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row friendships%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  SELECT * INTO _row FROM friendships WHERE id = friendship_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Eintrag nicht gefunden');
  END IF;

  IF _row.requester_id <> _uid AND _row.addressee_id <> _uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Keine Berechtigung');
  END IF;

  DELETE FROM friendships WHERE id = friendship_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================
-- RPC: touch_last_seen
-- ============================================================

CREATE OR REPLACE FUNCTION touch_last_seen()
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

  UPDATE profiles SET last_seen_at = now() WHERE id = _uid;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================
-- RPC: ensure_friend_code
-- ============================================================

CREATE OR REPLACE FUNCTION ensure_friend_code()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _code text;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  SELECT friend_code INTO _code FROM profiles WHERE id = _uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Kein Profil');
  END IF;

  IF _code IS NULL OR _code = '' THEN
    _code := _new_friend_code();
    UPDATE profiles SET friend_code = _code WHERE id = _uid;
  END IF;

  RETURN jsonb_build_object('ok', true, 'friend_code', _code);
END;
$$;

REVOKE ALL ON FUNCTION _new_friend_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION profiles_set_friend_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION request_friend(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION respond_friend(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION remove_friend(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION touch_last_seen() FROM PUBLIC;
REVOKE ALL ON FUNCTION ensure_friend_code() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION request_friend(text) TO authenticated;
GRANT EXECUTE ON FUNCTION respond_friend(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_friend(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION touch_last_seen() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_friend_code() TO authenticated;
