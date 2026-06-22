/*
  # Fix RLS: Re-enable Row Level Security on all tables

  Migration 024 disabled RLS when app used custom localStorage auth.
  This migration re-enables RLS now that Supabase Auth is integrated.

  Run this in Supabase Dashboard → SQL Editor.
*/

-- ============================================================
-- Step 1: Add auth_user_id column if not already added (migration 025)
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Helper function: get org_id of the logged-in user
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id FROM public.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: get role of the logged-in user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger: auto-link auth.user to public.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET auth_user_id = NEW.id, email_verified = true
  WHERE email = NEW.email AND auth_user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Step 2: Link existing Supabase Auth users to public.users
-- (for users that existed before the trigger was created)
-- ============================================================
UPDATE public.users u
SET auth_user_id = a.id, email_verified = true
FROM auth.users a
WHERE u.email = a.email AND u.auth_user_id IS NULL;

-- ============================================================
-- Step 3: Re-enable RLS on ALL tables (migration 026)
-- ============================================================
ALTER TABLE organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_catalog          ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_coverages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities            ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns             ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 4: Drop any stale policies and recreate clean ones
-- ============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Organizations
CREATE POLICY "org_select" ON organizations FOR SELECT TO authenticated
  USING (id = get_user_org_id());

-- Users
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "users_update_self" ON users FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- Role permissions
CREATE POLICY "role_perms_select" ON role_permissions FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- User sessions
CREATE POLICY "sessions_select" ON user_sessions FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "sessions_insert" ON user_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "sessions_delete" ON user_sessions FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Plan catalog
CREATE POLICY "plans_select" ON plan_catalog FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "plans_insert" ON plan_catalog FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin','superadmin'));
CREATE POLICY "plans_update" ON plan_catalog FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id() AND get_user_role() IN ('admin','superadmin'));

-- Plan coverages
CREATE POLICY "coverages_select" ON plan_coverages FOR SELECT TO authenticated
  USING (plan_catalog_id IN (SELECT id FROM plan_catalog WHERE org_id = get_user_org_id()));

-- Coverage services
CREATE POLICY "coverage_services_select" ON coverage_services FOR SELECT TO authenticated
  USING (coverage_id IN (
    SELECT id FROM plan_coverages
    WHERE plan_catalog_id IN (SELECT id FROM plan_catalog WHERE org_id = get_user_org_id())
  ));

-- Plan documents
CREATE POLICY "plan_docs_select" ON plan_documents FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Clients
CREATE POLICY "clients_select" ON clients FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "clients_delete" ON clients FOR DELETE TO authenticated
  USING (org_id = get_user_org_id() AND get_user_role() IN ('admin','superadmin'));

-- Beneficiaries
CREATE POLICY "beneficiaries_select" ON beneficiaries FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()));
CREATE POLICY "beneficiaries_insert" ON beneficiaries FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()));
CREATE POLICY "beneficiaries_update" ON beneficiaries FOR UPDATE TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()));

-- Client plans
CREATE POLICY "client_plans_select" ON client_plans FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "client_plans_insert" ON client_plans FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "client_plans_update" ON client_plans FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id());

-- Quotations
CREATE POLICY "quotations_select" ON quotations FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "quotations_insert" ON quotations FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

-- Quotation items
CREATE POLICY "quotation_items_select" ON quotation_items FOR SELECT TO authenticated
  USING (quotation_id IN (SELECT id FROM quotations WHERE org_id = get_user_org_id()));

-- Payments
CREATE POLICY "payments_select" ON payments FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "payments_insert" ON payments FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

-- Commissions
CREATE POLICY "commissions_select" ON commissions FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Activities
CREATE POLICY "activities_select" ON activities FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "activities_insert" ON activities FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

-- WhatsApp
CREATE POLICY "wa_templates_select" ON whatsapp_templates FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "wa_convs_select" ON whatsapp_conversations FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "wa_msgs_select" ON whatsapp_messages FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT id FROM whatsapp_conversations WHERE org_id = get_user_org_id()));
CREATE POLICY "wa_config_select" ON whatsapp_config FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "wa_config_insert" ON whatsapp_config FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin','superadmin'));
CREATE POLICY "wa_config_update" ON whatsapp_config FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id() AND get_user_role() IN ('admin','superadmin'));
CREATE POLICY "wa_config_delete" ON whatsapp_config FOR DELETE TO authenticated
  USING (org_id = get_user_org_id() AND get_user_role() IN ('admin','superadmin'));

-- Messenger
CREATE POLICY "ms_templates_select" ON messenger_templates FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "ms_convs_select" ON messenger_conversations FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "ms_msgs_select" ON messenger_messages FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT id FROM messenger_conversations WHERE org_id = get_user_org_id()));

-- Campaigns
CREATE POLICY "campaigns_select" ON campaigns FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());
CREATE POLICY "campaign_recipients_select" ON campaign_recipients FOR SELECT TO authenticated
  USING (campaign_id IN (SELECT id FROM campaigns WHERE org_id = get_user_org_id()));

-- Invoices
CREATE POLICY "invoices_select" ON invoices FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Reminders
CREATE POLICY "reminders_select" ON reminders FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Documents
CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Audit log (admin only)
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT TO authenticated
  USING (org_id = get_user_org_id() AND get_user_role() IN ('admin','superadmin'));

-- System config (admin only)
CREATE POLICY "system_config_select" ON system_config FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin','superadmin'));
CREATE POLICY "system_config_update" ON system_config FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin','superadmin'));
