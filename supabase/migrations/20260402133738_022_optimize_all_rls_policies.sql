/*
  # Optimize All RLS Policies for Performance

  1. Performance Enhancement
    - Replace all auth.jwt() calls with (SELECT auth.jwt()) in RLS policies
    - This prevents re-evaluation for each row and dramatically improves query performance at scale
    - Applies to all tables with RLS policies

  2. Tables Updated
    - whatsapp_config (re-optimized)
    - organizations
    - users
    - plan_catalog
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

  3. Important Note
    - Using (SELECT auth.jwt()) evaluates once per query instead of once per row
    - This is critical for performance at scale
*/

-- Recreate all policies with optimized auth calls using a single user email lookup
DO $$
DECLARE
  user_email text := (SELECT auth.jwt()->>'email');
BEGIN
  -- Drop and recreate organizations policies
  DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
  CREATE POLICY "Users can view own organization"
    ON organizations FOR SELECT
    TO authenticated
    USING (
      id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate users policies
  DROP POLICY IF EXISTS "Users can view own user record" ON users;
  DROP POLICY IF EXISTS "Users can view org users" ON users;
  
  CREATE POLICY "Users can view org users"
    ON users FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate plan_catalog policies
  DROP POLICY IF EXISTS "Users can view plan catalog" ON plan_catalog;
  DROP POLICY IF EXISTS "Admins can insert plans" ON plan_catalog;
  DROP POLICY IF EXISTS "Admins can update plans" ON plan_catalog;
  
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

  -- Drop and recreate plan_documents policies
  DROP POLICY IF EXISTS "Users can view plan documents" ON plan_documents;
  
  CREATE POLICY "Users can view plan documents"
    ON plan_documents FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate clients policies
  DROP POLICY IF EXISTS "Users can view org clients" ON clients;
  DROP POLICY IF EXISTS "Users can insert clients" ON clients;
  DROP POLICY IF EXISTS "Users can update clients" ON clients;
  
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

  -- Drop and recreate beneficiaries policies
  DROP POLICY IF EXISTS "Users can view beneficiaries" ON beneficiaries;
  DROP POLICY IF EXISTS "Users can insert beneficiaries" ON beneficiaries;
  
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

  -- Drop and recreate client_plans policies
  DROP POLICY IF EXISTS "Users can view org client plans" ON client_plans;
  DROP POLICY IF EXISTS "Users can insert client plans" ON client_plans;
  DROP POLICY IF EXISTS "Users can update client plans" ON client_plans;
  
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

  -- Drop and recreate quotations policies
  DROP POLICY IF EXISTS "Users can view org quotations" ON quotations;
  DROP POLICY IF EXISTS "Users can insert quotations" ON quotations;
  
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

  -- Drop and recreate quotation_items policies
  DROP POLICY IF EXISTS "Users can view quotation items" ON quotation_items;
  
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

  -- Drop and recreate payments policies
  DROP POLICY IF EXISTS "Users can view org payments" ON payments;
  DROP POLICY IF EXISTS "Users can insert payments" ON payments;
  
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

  -- Drop and recreate commissions policies
  DROP POLICY IF EXISTS "Users can view org commissions" ON commissions;
  
  CREATE POLICY "Users can view org commissions"
    ON commissions FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate activities policies
  DROP POLICY IF EXISTS "Users can view org activities" ON activities;
  DROP POLICY IF EXISTS "Users can insert activities" ON activities;
  
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

  -- Drop and recreate whatsapp_templates policies
  DROP POLICY IF EXISTS "Users can view org whatsapp templates" ON whatsapp_templates;
  
  CREATE POLICY "Users can view org whatsapp templates"
    ON whatsapp_templates FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate whatsapp_conversations policies
  DROP POLICY IF EXISTS "Users can view org whatsapp conversations" ON whatsapp_conversations;
  
  CREATE POLICY "Users can view org whatsapp conversations"
    ON whatsapp_conversations FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate whatsapp_messages policies
  DROP POLICY IF EXISTS "Users can view whatsapp messages" ON whatsapp_messages;
  
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

  -- Drop and recreate messenger_templates policies
  DROP POLICY IF EXISTS "Users can view org messenger templates" ON messenger_templates;
  
  CREATE POLICY "Users can view org messenger templates"
    ON messenger_templates FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate messenger_conversations policies
  DROP POLICY IF EXISTS "Users can view org messenger conversations" ON messenger_conversations;
  
  CREATE POLICY "Users can view org messenger conversations"
    ON messenger_conversations FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate messenger_messages policies
  DROP POLICY IF EXISTS "Users can view messenger messages" ON messenger_messages;
  
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

  -- Drop and recreate campaigns policies
  DROP POLICY IF EXISTS "Users can view org campaigns" ON campaigns;
  
  CREATE POLICY "Users can view org campaigns"
    ON campaigns FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate campaign_recipients policies
  DROP POLICY IF EXISTS "Users can view campaign recipients" ON campaign_recipients;
  
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

  -- Drop and recreate invoices policies
  DROP POLICY IF EXISTS "Users can view org invoices" ON invoices;
  
  CREATE POLICY "Users can view org invoices"
    ON invoices FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate reminders policies
  DROP POLICY IF EXISTS "Users can view org reminders" ON reminders;
  
  CREATE POLICY "Users can view org reminders"
    ON reminders FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate documents policies
  DROP POLICY IF EXISTS "Users can view org documents" ON documents;
  
  CREATE POLICY "Users can view org documents"
    ON documents FOR SELECT
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
      )
    );

  -- Drop and recreate audit_log policies
  DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
  
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

  -- Drop and recreate system_config policies
  DROP POLICY IF EXISTS "Admins can view system config" ON system_config;
  DROP POLICY IF EXISTS "Admins can update system config" ON system_config;
  
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
END $$;
