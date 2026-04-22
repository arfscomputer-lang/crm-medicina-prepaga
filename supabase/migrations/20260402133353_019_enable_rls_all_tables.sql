/*
  # Enable RLS on All Public Tables

  1. Security Enhancement
    - Enable Row Level Security on all public tables
    - Critical security requirement to prevent unauthorized data access
    - Tables without RLS can be accessed by anyone with database credentials

  2. Tables Affected
    - organizations
    - users
    - role_permissions
    - user_sessions
    - plan_catalog
    - plan_coverages
    - coverage_services
    - plan_documents
    - clients
    - beneficiaries
    - client_plans
    - quotations
    - quotation_items
    - payments
    - commissions
    - activities
    - whatsapp_templates
    - whatsapp_conversations
    - whatsapp_messages
    - messenger_templates
    - messenger_conversations
    - messenger_messages
    - campaigns
    - campaign_recipients
    - invoices
    - reminders
    - documents
    - audit_log
    - system_config

  3. Important Notes
    - This migration only enables RLS
    - Specific policies must be created based on business requirements
    - Until policies are created, tables will be locked down by default
    - This is a security-first approach
*/

-- Enable RLS on all tables
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

-- Create basic policies for organizations
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for users
CREATE POLICY "Users can view own user record"
  ON users FOR SELECT
  TO authenticated
  USING (email = (SELECT auth.jwt()->>'email'));

CREATE POLICY "Users can view org users"
  ON users FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for role_permissions
CREATE POLICY "Users can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Create basic policies for plan_catalog
CREATE POLICY "Users can view plan catalog"
  ON plan_catalog FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Admins can insert plans"
  ON plan_catalog FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = (SELECT auth.jwt()->>'email')
      AND role = 'admin'
      AND org_id = plan_catalog.org_id
    )
  );

CREATE POLICY "Admins can update plans"
  ON plan_catalog FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = (SELECT auth.jwt()->>'email')
      AND role = 'admin'
      AND org_id = plan_catalog.org_id
    )
  );

-- Create basic policies for plan_coverages
CREATE POLICY "Users can view plan coverages"
  ON plan_coverages FOR SELECT
  TO authenticated
  USING (true);

-- Create basic policies for coverage_services
CREATE POLICY "Users can view coverage services"
  ON coverage_services FOR SELECT
  TO authenticated
  USING (true);

-- Create basic policies for plan_documents
CREATE POLICY "Users can view plan documents"
  ON plan_documents FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for clients
CREATE POLICY "Users can view org clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for beneficiaries
CREATE POLICY "Users can view beneficiaries"
  ON beneficiaries FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    )
  );

CREATE POLICY "Users can insert beneficiaries"
  ON beneficiaries FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    )
  );

-- Create basic policies for client_plans
CREATE POLICY "Users can view org client plans"
  ON client_plans FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Users can insert client plans"
  ON client_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Users can update client plans"
  ON client_plans FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for quotations
CREATE POLICY "Users can view org quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Users can insert quotations"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for quotation_items
CREATE POLICY "Users can view quotation items"
  ON quotation_items FOR SELECT
  TO authenticated
  USING (
    quotation_id IN (
      SELECT id FROM quotations WHERE org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    )
  );

-- Create basic policies for payments
CREATE POLICY "Users can view org payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Users can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for commissions
CREATE POLICY "Users can view org commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for activities
CREATE POLICY "Users can view org activities"
  ON activities FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Users can insert activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for whatsapp_templates
CREATE POLICY "Users can view org whatsapp templates"
  ON whatsapp_templates FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for whatsapp_conversations
CREATE POLICY "Users can view org whatsapp conversations"
  ON whatsapp_conversations FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for whatsapp_messages
CREATE POLICY "Users can view whatsapp messages"
  ON whatsapp_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM whatsapp_conversations WHERE org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    )
  );

-- Create basic policies for messenger_templates
CREATE POLICY "Users can view org messenger templates"
  ON messenger_templates FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for messenger_conversations
CREATE POLICY "Users can view org messenger conversations"
  ON messenger_conversations FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for messenger_messages
CREATE POLICY "Users can view messenger messages"
  ON messenger_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM messenger_conversations WHERE org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    )
  );

-- Create basic policies for campaigns
CREATE POLICY "Users can view org campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for campaign_recipients
CREATE POLICY "Users can view campaign recipients"
  ON campaign_recipients FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    )
  );

-- Create basic policies for invoices
CREATE POLICY "Users can view org invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for reminders
CREATE POLICY "Users can view org reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for documents
CREATE POLICY "Users can view org documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

-- Create basic policies for audit_log
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = (SELECT auth.jwt()->>'email')
      AND role = 'admin'
      AND org_id = audit_log.org_id
    )
  );

-- Create basic policies for system_config
CREATE POLICY "Admins can view system config"
  ON system_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = (SELECT auth.jwt()->>'email')
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update system config"
  ON system_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = (SELECT auth.jwt()->>'email')
      AND role = 'admin'
    )
  );
