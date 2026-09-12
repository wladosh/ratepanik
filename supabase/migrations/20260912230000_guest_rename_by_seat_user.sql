-- Guest lobby rename was rejected with registered_users_cannot_rename
-- even for anonymous seats. The original trigger looked up auth.users
-- via auth.uid(); cookie / SSR guest PATCHes often arrive with a NULL
-- uid (anon key only), so _is_anon was NULL and `IS NOT TRUE` fired.
--
-- Product rule: lock display_name for registered accounts; guests may
-- rename. Decide from the seat owner (players.user_id), not the JWT.

CREATE OR REPLACE FUNCTION enforce_guest_only_rename()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _is_anon boolean;
BEGIN
  IF NEW.display_name IS DISTINCT FROM OLD.display_name THEN
    SELECT COALESCE(u.is_anonymous, false)
      OR COALESCE(u.raw_app_meta_data->>'provider', '') = 'anonymous'
    INTO _is_anon
    FROM auth.users u
    WHERE u.id = NEW.user_id;

    IF _is_anon IS NOT TRUE THEN
      RAISE EXCEPTION 'registered_users_cannot_rename'
        USING HINT = 'Registered users cannot change their display name in the lobby.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
