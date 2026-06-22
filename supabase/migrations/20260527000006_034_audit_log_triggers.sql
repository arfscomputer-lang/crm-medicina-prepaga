/*
  # Audit Log Triggers

  Creates a generic audit trigger function and attaches it to:
  - clients        (INSERT, UPDATE, DELETE)
  - client_plans   (INSERT, UPDATE, DELETE)
  - payments       (INSERT, UPDATE, DELETE)
  - users          (UPDATE only — track profile/role changes, exclude secrets)
*/

-- ============================================================
-- Generic audit trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id      UUID;
  v_org_id       UUID;
  v_entity_id    UUID;
  v_old          JSONB;
  v_new          JSONB;
  v_changed      TEXT[];
BEGIN
  -- Resolve the calling public.users row from the Supabase JWT
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  -- For users table: strip secrets before logging
  IF TG_TABLE_NAME = 'users' THEN
    IF TG_OP != 'INSERT' THEN
      v_old := to_jsonb(OLD) - 'password_hash' - 'two_factor_secret';
    END IF;
    IF TG_OP != 'DELETE' THEN
      v_new := to_jsonb(NEW) - 'password_hash' - 'two_factor_secret';
    END IF;
  ELSE
    IF TG_OP != 'INSERT' THEN v_old := to_jsonb(OLD); END IF;
    IF TG_OP != 'DELETE' THEN v_new := to_jsonb(NEW); END IF;
  END IF;

  -- Determine org_id and entity_id from the affected row
  IF TG_OP = 'DELETE' THEN
    v_org_id    := OLD.org_id;
    v_entity_id := OLD.id;
  ELSE
    v_org_id    := NEW.org_id;
    v_entity_id := NEW.id;
  END IF;

  -- For UPDATE: compute which columns actually changed
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key ORDER BY key)
    INTO v_changed
    FROM jsonb_each(v_new) n
    WHERE n.value IS DISTINCT FROM (v_old -> n.key);
  END IF;

  INSERT INTO public.audit_log (
    org_id, user_id,
    entity_type, entity_id, action,
    old_data, new_data, changed_fields
  ) VALUES (
    v_org_id, v_user_id,
    TG_TABLE_NAME, v_entity_id, TG_OP,
    v_old, v_new, v_changed
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Restrict execution: anon cannot call this trigger function directly
REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM anon;

-- ============================================================
-- Attach triggers
-- ============================================================

-- clients
DROP TRIGGER IF EXISTS trg_audit_clients ON clients;
CREATE TRIGGER trg_audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- client_plans
DROP TRIGGER IF EXISTS trg_audit_client_plans ON client_plans;
CREATE TRIGGER trg_audit_client_plans
  AFTER INSERT OR UPDATE OR DELETE ON client_plans
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- payments
DROP TRIGGER IF EXISTS trg_audit_payments ON payments;
CREATE TRIGGER trg_audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- users (UPDATE only — inserts are done by the admin, deletes are rare)
DROP TRIGGER IF EXISTS trg_audit_users ON users;
CREATE TRIGGER trg_audit_users
  AFTER UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
