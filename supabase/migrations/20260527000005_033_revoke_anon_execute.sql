/*
  # Revoke EXECUTE from anon role explicitly

  Supabase sets ALTER DEFAULT PRIVILEGES that auto-grants EXECUTE to anon/authenticated
  on every function. REVOKE FROM PUBLIC is not enough — must revoke from anon directly.
*/

-- Remove anon access to all SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.get_user_org_id()              FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role()                FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(TEXT)      FROM anon;

-- handle_new_user is a trigger function — authenticated users should not call it directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM authenticated;

-- Also revoke from PUBLIC just in case
REVOKE EXECUTE ON FUNCTION public.get_user_org_id()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role()                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(TEXT)      FROM PUBLIC;

-- Re-grant only to authenticated for the RLS helper functions
GRANT  EXECUTE ON FUNCTION public.get_user_org_id()              TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_role()                TO authenticated;
GRANT  EXECUTE ON FUNCTION public.user_has_permission(TEXT)      TO authenticated;

-- Fix increment_unread if it exists
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'increment_unread'
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.increment_unread(%s) FROM anon', rec.args);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.increment_unread(%s) FROM PUBLIC', rec.args);
      EXECUTE format('GRANT  EXECUTE ON FUNCTION public.increment_unread(%s) TO authenticated', rec.args);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'increment_unread(%): %', rec.args, SQLERRM;
    END;
  END LOOP;
END $$;
