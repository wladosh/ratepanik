-- Signup (no session yet) needs a read-only availability check.
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;
