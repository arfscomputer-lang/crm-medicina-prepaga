/*
  # Fix remaining Security Advisor warnings

  1. Fix "Function Search Path Mutable" — add SET search_path to all SECURITY DEFINER functions
  2. Fix "Public Can Execute SECURITY DEFINER Function" — revoke from public, grant to authenticated only
  3. Fix "RLS Enabled No Policy" — add policies for client_tag_assignments and contact_tags
*/

-- ============================================================
-- 1. Fix search_path + restrict execution on helper functions
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
        WHEN 'can_create_clients'  THEN rp.can_create_clients
        WHEN 'can_edit_clients'    THEN rp.can_edit_clients
        WHEN 'can_delete_clients'  THEN rp.can_delete_clients
        WHEN 'can_view_all_clients' THEN rp.can_view_all_clients
        WHEN 'can_create_plans'    THEN rp.can_create_plans
        WHEN 'can_edit_plans'      THEN rp.can_edit_plans
        WHEN 'can_delete_plans'    THEN rp.can_delete_plans
        WHEN 'can_manage_users'    THEN rp.can_manage_users
        ELSE false
      END
  );
END;
$$;

-- ============================================================
-- 2. Revoke from public, grant only to authenticated
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_user_org_id()                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role()                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(TEXT)               FROM PUBLIC;

GRANT  EXECUTE ON FUNCTION public.get_user_org_id()                       TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_role()                         TO authenticated;
GRANT  EXECUTE ON FUNCTION public.user_has_permission(TEXT)               TO authenticated;
-- handle_new_user is a trigger function — no need to grant to authenticated

-- Fix increment_unread if it exists (seen in warnings)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_unread' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE $f$
      ALTER FUNCTION public.increment_unread() SET search_path = public, auth;
      REVOKE EXECUTE ON FUNCTION public.increment_unread() FROM PUBLIC;
      GRANT  EXECUTE ON FUNCTION public.increment_unread() TO authenticated;
    $f$;
  END IF;
END $$;

-- ============================================================
-- 3. Add RLS policies for contact_tags and client_tag_assignments
-- ============================================================

-- contact_tags: lookup table scoped to org
CREATE POLICY "contact_tags_select" ON contact_tags FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "contact_tags_insert" ON contact_tags FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "contact_tags_update" ON contact_tags FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "contact_tags_delete" ON contact_tags FOR DELETE TO authenticated
  USING (org_id = get_user_org_id() AND get_user_role() IN ('admin','superadmin'));

-- client_tag_assignments: assignments linked to clients in same org
CREATE POLICY "client_tag_assignments_select" ON client_tag_assignments FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id())
  );

CREATE POLICY "client_tag_assignments_insert" ON client_tag_assignments FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id())
  );

CREATE POLICY "client_tag_assignments_delete" ON client_tag_assignments FOR DELETE TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id())
  );
