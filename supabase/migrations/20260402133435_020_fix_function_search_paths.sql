/*
  # Fix Function Search Paths

  1. Security Enhancement
    - Set search_path for all functions to prevent security vulnerabilities
    - Ensures functions only access intended schemas
    - Prevents malicious schema injection attacks

  2. Functions Updated
    - create_renewal_reminder
    - inc_template_usage
    - format_wa_py (character varying)
    - update_whatsapp_config_timestamp
    - generate_commission
    - update_timestamp
    - sync_client_status
    - update_last_contact

  3. Security Note
    - Setting search_path to a fixed value prevents attackers from creating
      malicious schemas that could hijack function behavior
*/

-- Fix create_renewal_reminder function
ALTER FUNCTION create_renewal_reminder() SET search_path = public, pg_temp;

-- Fix inc_template_usage function
ALTER FUNCTION inc_template_usage() SET search_path = public, pg_temp;

-- Fix format_wa_py function (with varchar parameter)
ALTER FUNCTION format_wa_py(character varying) SET search_path = public, pg_temp;

-- Fix update_whatsapp_config_timestamp function
ALTER FUNCTION update_whatsapp_config_timestamp() SET search_path = public, pg_temp;

-- Fix generate_commission function
ALTER FUNCTION generate_commission() SET search_path = public, pg_temp;

-- Fix update_timestamp function
ALTER FUNCTION update_timestamp() SET search_path = public, pg_temp;

-- Fix sync_client_status function
ALTER FUNCTION sync_client_status() SET search_path = public, pg_temp;

-- Fix update_last_contact function
ALTER FUNCTION update_last_contact() SET search_path = public, pg_temp;
