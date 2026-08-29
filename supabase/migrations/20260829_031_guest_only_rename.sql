-- Registered (non-anonymous) users must not change their display_name.
-- Only guests / anonymous players are allowed to rename in the lobby.

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
    SELECT u.is_anonymous INTO _is_anon
    FROM auth.users u
    WHERE u.id = auth.uid();

    IF _is_anon IS NOT TRUE THEN
      RAISE EXCEPTION 'registered_users_cannot_rename'
        USING HINT = 'Registered users cannot change their display name in the lobby.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_guest_only_rename ON public.players;

CREATE TRIGGER trg_enforce_guest_only_rename
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION enforce_guest_only_rename();
