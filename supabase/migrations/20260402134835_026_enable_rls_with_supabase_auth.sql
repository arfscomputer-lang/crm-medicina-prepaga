/*
  # Re-enable RLS with Supabase Auth Integration

  1. Changes
    - Re-enable RLS on all tables
    - Create policies using auth.uid() via helper functions
    - Use get_user_org_id() and get_user_role() for performance
    
  2. Security
    - All tables protected by RLS
    - Users can only access data from their organization
    - Role-based permissions enforced at database level
*/

-- Drop ALL existing policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Re-enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_coverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT TO authenticated
  USING (id = get_user_org_id());

-- Users
CREATE POLICY "Users can view org users"
  ON users FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Role permissions
CREATE POLICY "Users can view own role permissions"
  ON role_permissions FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- User sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Plan catalog
CREATE POLICY "Users can view plan catalog"
  ON plan_catalog FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Admins can insert plans"
  ON plan_catalog FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update plans"
  ON plan_catalog FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- Plan coverages
CREATE POLICY "Users can view plan coverages"
  ON plan_coverages FOR SELECT TO authenticated
  USING (plan_catalog_id IN (SELECT id FROM plan_catalog WHERE org_id = get_user_org_id()));

-- Coverage services
CREATE POLICY "Users can view coverage services"
  ON coverage_services FOR SELECT TO authenticated
  USING (coverage_id IN (
    SELECT id FROM plan_coverages 
    WHERE plan_catalog_id IN (SELECT id FROM plan_catalog WHERE org_id = get_user_org_id())
  ));

-- Plan documents
CREATE POLICY "Users can view plan documents"
  ON plan_documents FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Clients
CREATE POLICY "Users can view org clients"
  ON clients FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert clients"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update clients"
  ON clients FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id());

-- Beneficiaries
CREATE POLICY "Users can view beneficiaries"
  ON beneficiaries FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()));

CREATE POLICY "Users can insert beneficiaries"
  ON beneficiaries FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE org_id = get_user_org_id()));

-- Client plans
CREATE POLICY "Users can view org client plans"
  ON client_plans FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert client plans"
  ON client_plans FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update client plans"
  ON client_plans FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id());

-- Quotations
CREATE POLICY "Users can view org quotations"
  ON quotations FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert quotations"
  ON quotations FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

-- Quotation items
CREATE POLICY "Users can view quotation items"
  ON quotation_items FOR SELECT TO authenticated
  USING (quotation_id IN (SELECT id FROM quotations WHERE org_id = get_user_org_id()));

-- Payments
CREATE POLICY "Users can view org payments"
  ON payments FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

-- Commissions
CREATE POLICY "Users can view org commissions"
  ON commissions FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Activities
CREATE POLICY "Users can view org activities"
  ON activities FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can insert activities"
  ON activities FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

-- WhatsApp
CREATE POLICY "Users can view org whatsapp templates"
  ON whatsapp_templates FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can view org whatsapp conversations"
  ON whatsapp_conversations FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can view whatsapp messages"
  ON whatsapp_messages FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT id FROM whatsapp_conversations WHERE org_id = get_user_org_id()));

CREATE POLICY "Users can view own org WhatsApp config"
  ON whatsapp_config FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Admins can insert WhatsApp config"
  ON whatsapp_config FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update WhatsApp config"
  ON whatsapp_config FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete WhatsApp config"
  ON whatsapp_config FOR DELETE TO authenticated
  USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- Messenger
CREATE POLICY "Users can view org messenger templates"
  ON messenger_templates FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can view org messenger conversations"
  ON messenger_conversations FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can view messenger messages"
  ON messenger_messages FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT id FROM messenger_conversations WHERE org_id = get_user_org_id()));

-- Campaigns
CREATE POLICY "Users can view org campaigns"
  ON campaigns FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can view campaign recipients"
  ON campaign_recipients FOR SELECT TO authenticated
  USING (campaign_id IN (SELECT id FROM campaigns WHERE org_id = get_user_org_id()));

-- Invoices
CREATE POLICY "Users can view org invoices"
  ON invoices FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Reminders
CREATE POLICY "Users can view org reminders"
  ON reminders FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Documents
CREATE POLICY "Users can view org documents"
  ON documents FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

-- Audit log
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT TO authenticated
  USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- System config
CREATE POLICY "Admins can view system config"
  ON system_config FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can update system config"
  ON system_config FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');
