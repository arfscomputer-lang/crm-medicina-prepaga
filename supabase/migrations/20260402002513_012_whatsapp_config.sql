/*
  # WhatsApp Business API Configuration

  1. New Tables
    - `whatsapp_config`
      - `id` (uuid, primary key)
      - `org_id` (uuid, foreign key to organizations)
      - `access_token` (text, encrypted WhatsApp API token)
      - `phone_number_id` (text, WhatsApp phone number ID)
      - `business_account_id` (text, WhatsApp Business Account ID)
      - `webhook_verify_token` (text, for webhook verification)
      - `is_active` (boolean, whether config is active)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `whatsapp_config` table
    - Add policies for authenticated users to manage their org's config
*/

CREATE TABLE IF NOT EXISTS whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  access_token text NOT NULL,
  phone_number_id text NOT NULL,
  business_account_id text,
  webhook_verify_token text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id)
);

ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org WhatsApp config"
  ON whatsapp_config FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert WhatsApp config"
  ON whatsapp_config FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update WhatsApp config"
  ON whatsapp_config FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete WhatsApp config"
  ON whatsapp_config FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_config_timestamp
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_config_timestamp();