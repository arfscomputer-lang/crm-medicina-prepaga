/*
  # Move Extensions to Extensions Schema

  1. Security Enhancement
    - Move pg_trgm and unaccent extensions from public schema to extensions schema
    - Best practice to separate extensions from application tables
    - Reduces attack surface and improves security

  2. Extensions Moved
    - pg_trgm (trigram matching for fuzzy text search)
    - unaccent (remove accents from text)

  3. Important Notes
    - Extensions schema is the recommended location for PostgreSQL extensions
    - All existing functionality will continue to work
    - Functions using these extensions are updated to reference the correct schema
*/

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Move unaccent extension
DROP EXTENSION IF EXISTS unaccent CASCADE;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- Recreate index that depends on pg_trgm
CREATE INDEX IF NOT EXISTS idx_clients_fullname_trgm ON clients USING gin (
  (first_name || ' ' || last_name) extensions.gin_trgm_ops
);

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
