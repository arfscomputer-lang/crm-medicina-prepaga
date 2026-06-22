/*
  # Final Security Advisor fixes

  1. Recreate all 4 known SECURITY DEFINER functions with SET search_path = public, auth
  2. REVOKE EXECUTE FROM PUBLIC, GRANT TO authenticated (exact signatures from Security Advisor CSV)
  3. Fix increment_unread dynamically (signature unknown)
  4. Create contact_tags RLS policies (org_id is TEXT — cast get_user_org_id()::text)
  5. Create client_tag_assignments RLS policies
  6. Manual step required: enable Leaked Password Protection in Dashboard
*/

-- ============================================================
-- 1. Recreate functions with fixed search_path
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
BEGIN
  RETURN (
    SELECT org_id FROM public.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE public.users
  SET auth_user_id = NEW.id, email_verified = true
  WHERE email = NEW.email AND auth_user_id IS NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
DECLARE
  user_org_id UUID;
  user_role_val user_role;
BEGIN
  SELECT org_id, role INTO user_org_id, user_role_val
  FROM public.users
  WHERE auth_user_id = auth.uid();

  IF user_org_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions rp
    WHERE rp.org_id = user_org_id
      AND rp.role = user_role_val
      AND CASE permission_name
        WHEN 'can_create_clients'   THEN rp.can_create_clients
        WHEN 'can_edit_clients'     THEN rp.can_edit_clients
        WHEN 'can_delete_clients'   THEN rp.can_delete_clients
        WHEN 'can_view_all_clients' THEN rp.can_view_all_clients
        WHEN 'can_create_plans'     THEN rp.can_create_plans
        WHEN 'can_edit_plans'       THEN rp.can_edit_plans
        WHEN 'can_delete_plans'     THEN rp.can_delete_plans
        WHEN 'can_manage_users'     THEN rp.can_manage_users
        ELSE false
      END
  );
END;
$$;

-- ============================================================
-- 2. Restrict execute: revoke from public, grant to authenticated
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_user_org_id()               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role()                  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(TEXT)        FROM PUBLIC;

GRANT  EXECUTE ON FUNCTION public.get_user_org_id()               TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_role()                  TO authenticated;
-- handle_new_user is a trigger function — no user call needed
GRANT  EXECUTE ON FUNCTION public.user_has_permission(TEXT)        TO authenticated;

-- ============================================================
-- 3. Fix increment_unread (dynamic — signature varies per DB)
-- ============================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT p.oid, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'increment_unread'
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION public.increment_unread(%s) SET search_path = public, auth',
        rec.args
      );
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION public.increment_unread(%s) FROM PUBLIC',
        rec.args
      );
      EXECUTE format(
        'GRANT EXECUTE ON FUNCTION public.increment_unread(%s) TO authenticated',
        rec.args
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log but don't fail if function can't be altered
      RAISE WARNING 'Could not alter increment_unread(%): %', rec.args, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================
-- 4. RLS policies for contact_tags
--    NOTE: contact_tags.org_id is type TEXT — cast uuid to text
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contact_tags'
  ) THEN

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_tags' AND policyname = 'contact_tags_select') THEN
      EXECUTE $p$
        CREATE POLICY "contact_tags_select" ON contact_tags
        FOR SELECT TO authenticated
        USING (org_id = get_user_org_id()::text)
      $p$;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_tags' AND policyname = 'contact_tags_insert') THEN
      EXECUTE $p$
        CREATE POLICY "contact_tags_insert" ON contact_tags
        FOR INSERT TO authenticated
        WITH CHECK (org_id = get_user_org_id()::text)
      $p$;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_tags' AND policyname = 'contact_tags_update') THEN
      EXECUTE $p$
        CREATE POLICY "contact_tags_update" ON contact_tags
        FOR UPDATE TO authenticated
        USING (org_id = get_user_org_id()::text)
      $p$;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_tags' AND policyname = 'contact_tags_delete') THEN
      EXECUTE $p$
        CREATE POLICY "contact_tags_delete" ON contact_tags
        FOR DELETE TO authenticated
        USING (org_id = get_user_org_id()::text AND get_user_role() IN ('admin','superadmin'))
      $p$;
    END IF;

  END IF;
END $$;

-- ============================================================
-- 5. RLS policies for client_tag_assignments
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_tag_assignments'
  ) THEN

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_tag_assignments' AND policyname = 'client_tag_assignments_select') THEN
      EXECUTE $p$
        CREATE POLICY "client_tag_assignments_select" ON client_tag_assignments
        FOR SELECT TO authenticated
        USING (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()))
      $p$;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_tag_assignments' AND policyname = 'client_tag_assignments_insert') THEN
      EXECUTE $p$
        CREATE POLICY "client_tag_assignments_insert" ON client_tag_assignments
        FOR INSERT TO authenticated
        WITH CHECK (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()))
      $p$;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_tag_assignments' AND policyname = 'client_tag_assignments_delete') THEN
      EXECUTE $p$
        CREATE POLICY "client_tag_assignments_delete" ON client_tag_assignments
        FOR DELETE TO authenticated
        USING (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()))
      $p$;
    END IF;

  END IF;
END $$;
