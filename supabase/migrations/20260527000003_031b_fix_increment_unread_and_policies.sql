/*
  # Fix increment_unread search_path + add missing tag policies
  (Corrected version — uses dynamic signature lookup for increment_unread)
*/

-- ============================================================
-- Fix increment_unread: find actual signature dynamically
-- ============================================================
DO $$
DECLARE
  func_oid OID;
  func_args TEXT;
BEGIN
  SELECT p.oid, pg_get_function_identity_arguments(p.oid)
  INTO func_oid, func_args
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'increment_unread'
  LIMIT 1;

  IF func_oid IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.increment_unread(%s) SET search_path = public, auth', func_args);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.increment_unread(%s) FROM PUBLIC', func_args);
    EXECUTE format('GRANT  EXECUTE ON FUNCTION public.increment_unread(%s) TO authenticated', func_args);
  END IF;
END $$;

-- ============================================================
-- Add RLS policies for contact_tags (if table exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_tags') THEN
    -- contact_tags has org_id column
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_tags' AND policyname = 'contact_tags_select') THEN
      EXECUTE $p$CREATE POLICY "contact_tags_select" ON contact_tags FOR SELECT TO authenticated USING (org_id = get_user_org_id())$p$;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_tags' AND policyname = 'contact_tags_insert') THEN
      EXECUTE $p$CREATE POLICY "contact_tags_insert" ON contact_tags FOR INSERT TO authenticated WITH CHECK (org_id = get_user_org_id())$p$;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_tags' AND policyname = 'contact_tags_update') THEN
      EXECUTE $p$CREATE POLICY "contact_tags_update" ON contact_tags FOR UPDATE TO authenticated USING (org_id = get_user_org_id())$p$;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_tags' AND policyname = 'contact_tags_delete') THEN
      EXECUTE $p$CREATE POLICY "contact_tags_delete" ON contact_tags FOR DELETE TO authenticated USING (org_id = get_user_org_id() AND get_user_role() IN ('admin','superadmin'))$p$;
    END IF;
  END IF;
END $$;

-- ============================================================
-- Add RLS policies for client_tag_assignments (if table exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_tag_assignments') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_tag_assignments' AND policyname = 'client_tag_assignments_select') THEN
      EXECUTE $p$CREATE POLICY "client_tag_assignments_select" ON client_tag_assignments FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()))$p$;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_tag_assignments' AND policyname = 'client_tag_assignments_insert') THEN
      EXECUTE $p$CREATE POLICY "client_tag_assignments_insert" ON client_tag_assignments FOR INSERT TO authenticated WITH CHECK (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()))$p$;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_tag_assignments' AND policyname = 'client_tag_assignments_delete') THEN
      EXECUTE $p$CREATE POLICY "client_tag_assignments_delete" ON client_tag_assignments FOR DELETE TO authenticated USING (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()))$p$;
    END IF;
  END IF;
END $$;
