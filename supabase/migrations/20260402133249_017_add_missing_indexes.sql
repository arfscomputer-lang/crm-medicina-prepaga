/*
  # Add Missing Indexes for Foreign Keys

  1. Performance Improvements
    - Add indexes for all unindexed foreign keys across all tables
    - This dramatically improves JOIN performance and query execution
    - Resolves suboptimal query performance warnings

  2. Tables Affected
    - activities: client_plan_id, followup_completed_by
    - audit_log: org_id
    - campaign_recipients: client_id
    - campaigns: approved_by, created_by, fb_template_id, wa_template_id
    - client_plans: created_by, plan_catalog_id, renewed_from_id
    - clients: referred_by
    - commissions: approved_by, org_id, payment_id
    - documents: org_id, uploaded_by
    - invoices: issued_by, org_id, payment_id
    - messenger_conversations: org_id
    - messenger_messages: sent_by, template_id
    - messenger_templates: created_by, org_id
    - payments: agent_id, org_id, recorded_by
    - plan_documents: org_id, uploaded_by
    - quotation_items: plan_catalog_id, quotation_id
    - quotations: agent_id, client_id, org_id
    - reminders: client_id, client_plan_id, completed_by, org_id
    - system_config: updated_by
    - whatsapp_conversations: org_id
    - whatsapp_messages: sent_by, template_id
    - whatsapp_templates: created_by, org_id
*/

-- Activities table indexes
CREATE INDEX IF NOT EXISTS idx_activities_client_plan ON activities(client_plan_id);
CREATE INDEX IF NOT EXISTS idx_activities_followup_completed ON activities(followup_completed_by);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(org_id);

-- Campaign recipients indexes
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_client ON campaign_recipients(client_id);

-- Campaigns table indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_approved_by ON campaigns(approved_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_fb_template ON campaigns(fb_template_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_wa_template ON campaigns(wa_template_id);

-- Client plans indexes
CREATE INDEX IF NOT EXISTS idx_client_plans_created_by ON client_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_client_plans_plan_catalog ON client_plans(plan_catalog_id);
CREATE INDEX IF NOT EXISTS idx_client_plans_renewed_from ON client_plans(renewed_from_id);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_referred_by ON clients(referred_by);

-- Commissions indexes
CREATE INDEX IF NOT EXISTS idx_commissions_approved_by ON commissions(approved_by);
CREATE INDEX IF NOT EXISTS idx_commissions_org_id ON commissions(org_id);
CREATE INDEX IF NOT EXISTS idx_commissions_payment ON commissions(payment_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_issued_by ON invoices(issued_by);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment ON invoices(payment_id);

-- Messenger conversations indexes
CREATE INDEX IF NOT EXISTS idx_messenger_conversations_org ON messenger_conversations(org_id);

-- Messenger messages indexes
CREATE INDEX IF NOT EXISTS idx_messenger_messages_sent_by ON messenger_messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_messenger_messages_template ON messenger_messages(template_id);

-- Messenger templates indexes
CREATE INDEX IF NOT EXISTS idx_messenger_templates_created_by ON messenger_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_messenger_templates_org ON messenger_templates(org_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_agent ON payments(agent_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_id ON payments(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_recorded_by ON payments(recorded_by);

-- Plan documents indexes
CREATE INDEX IF NOT EXISTS idx_plan_documents_org ON plan_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_plan_documents_uploaded_by ON plan_documents(uploaded_by);

-- Quotation items indexes
CREATE INDEX IF NOT EXISTS idx_quotation_items_plan_catalog ON quotation_items(plan_catalog_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);

-- Quotations indexes
CREATE INDEX IF NOT EXISTS idx_quotations_agent ON quotations(agent_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_org_id ON quotations(org_id);

-- Reminders indexes
CREATE INDEX IF NOT EXISTS idx_reminders_client ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_client_plan ON reminders(client_plan_id);
CREATE INDEX IF NOT EXISTS idx_reminders_completed_by ON reminders(completed_by);
CREATE INDEX IF NOT EXISTS idx_reminders_org_id ON reminders(org_id);

-- System config indexes
CREATE INDEX IF NOT EXISTS idx_system_config_updated_by ON system_config(updated_by);

-- WhatsApp conversations indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_org ON whatsapp_conversations(org_id);

-- WhatsApp messages indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_by ON whatsapp_messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_template ON whatsapp_messages(template_id);

-- WhatsApp templates indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_created_by ON whatsapp_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_org ON whatsapp_templates(org_id);
