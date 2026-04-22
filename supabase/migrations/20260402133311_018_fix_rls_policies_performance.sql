/*
  # Fix RLS Policies Performance

  1. Performance Optimization
    - Replace auth.<function>() with (SELECT auth.<function>()) in RLS policies
    - This prevents re-evaluation for each row and dramatically improves query performance
    - Applies to all whatsapp_config table policies

  2. Security
    - Maintains same security requirements
    - Only changes implementation for performance
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own org WhatsApp config" ON whatsapp_config;
DROP POLICY IF EXISTS "Admins can insert WhatsApp config" ON whatsapp_config;
DROP POLICY IF EXISTS "Admins can update WhatsApp config" ON whatsapp_config;
DROP POLICY IF EXISTS "Admins can delete WhatsApp config" ON whatsapp_config;

-- Recreate policies with optimized auth calls
CREATE POLICY "Users can view own org WhatsApp config"
  ON whatsapp_config
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE email = (SELECT auth.jwt()->>'email')
    )
  );

CREATE POLICY "Admins can insert WhatsApp config"
  ON whatsapp_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = (SELECT auth.jwt()->>'email')
      AND role = 'admin'
      AND org_id = whatsapp_config.org_id
    )
  );

CREATE POLICY "Admins can update WhatsApp config"
  ON whatsapp_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = (SELECT auth.jwt()->>'email')
      AND role = 'admin'
      AND org_id = whatsapp_config.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = (SELECT auth.jwt()->>'email')
      AND role = 'admin'
      AND org_id = whatsapp_config.org_id
    )
  );

CREATE POLICY "Admins can delete WhatsApp config"
  ON whatsapp_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = (SELECT auth.jwt()->>'email')
      AND role = 'admin'
      AND org_id = whatsapp_config.org_id
    )
  );
