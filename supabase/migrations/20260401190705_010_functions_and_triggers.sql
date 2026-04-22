/*
  # Funciones y Triggers Automáticos
  
  1. Funciones
    - update_timestamp: Actualiza updated_at automáticamente
    - sync_client_status: Sincroniza estado del cliente con planes
    - generate_commission: Genera comisión al pagar
    - update_last_contact: Actualiza último contacto desde actividades
    - create_renewal_reminder: Recordatorio automático de renovación
    - inc_template_usage: Incrementa contador de uso de plantillas
  
  2. Triggers
    - Aplicados a todas las tablas con updated_at
    - Sincronización automática de estados
    - Generación automática de comisiones
    - Tracking de actividades
*/

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN 
    NEW.updated_at = NOW(); 
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
        AND table_name NOT IN ('audit_log')
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%s_ts ON %I',
            tbl, tbl
        );
        EXECUTE format(
            'CREATE TRIGGER trg_%s_ts BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_timestamp()',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- Sincronizar estado del cliente con planes
CREATE OR REPLACE FUNCTION sync_client_status()
RETURNS TRIGGER AS $$
DECLARE active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count
    FROM client_plans 
    WHERE client_id = COALESCE(NEW.client_id, OLD.client_id) 
    AND status = 'activo';
    
    IF active_count > 0 THEN
        UPDATE clients 
        SET status = 'activo' 
        WHERE id = COALESCE(NEW.client_id, OLD.client_id) 
        AND status != 'activo';
    ELSE
        UPDATE clients 
        SET status = 'vencido' 
        WHERE id = COALESCE(NEW.client_id, OLD.client_id) 
        AND status = 'activo';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_plan_sync_client ON client_plans;
CREATE TRIGGER trg_plan_sync_client
    AFTER INSERT OR UPDATE OF status ON client_plans
    FOR EACH ROW EXECUTE FUNCTION sync_client_status();

-- Generar comisión al pagar
CREATE OR REPLACE FUNCTION generate_commission()
RETURNS TRIGGER AS $$
DECLARE pl RECORD;
BEGIN
    IF NEW.status = 'pagado' AND (OLD.status IS NULL OR OLD.status != 'pagado') THEN
        SELECT * INTO pl FROM client_plans WHERE id = NEW.client_plan_id;
        IF pl.id IS NOT NULL THEN
            NEW.commission_amount := (NEW.amount_paid * pl.commission_pct / 100)::BIGINT;
            INSERT INTO commissions (
                org_id, agent_id, client_plan_id, payment_id, 
                period_month, period_year,
                premium_amount, commission_pct, commission_amount, is_renewal
            )
            VALUES (
                pl.org_id, pl.agent_id, pl.id, NEW.id,
                EXTRACT(MONTH FROM NEW.period_start), EXTRACT(YEAR FROM NEW.period_start),
                NEW.amount_paid, pl.commission_pct, NEW.commission_amount, 
                pl.renewed_from_id IS NOT NULL
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_commission ON payments;
CREATE TRIGGER trg_payment_commission
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION generate_commission();

-- Actualizar last_contact_at desde actividades
CREATE OR REPLACE FUNCTION update_last_contact()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE clients 
    SET last_contact_at = NEW.created_at 
    WHERE id = NEW.client_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_activity_contact ON activities;
CREATE TRIGGER trg_activity_contact
    AFTER INSERT ON activities
    FOR EACH ROW EXECUTE FUNCTION update_last_contact();

-- Recordatorio automático de renovación
CREATE OR REPLACE FUNCTION create_renewal_reminder()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'activo' AND NEW.end_date IS NOT NULL THEN
        INSERT INTO reminders (
            org_id, agent_id, client_id, client_plan_id, 
            title, reminder_type, priority, due_date, notify_days_before
        )
        VALUES (
            NEW.org_id, NEW.agent_id, NEW.client_id, NEW.id,
            'Renovación plan ' || NEW.plan_tier::text, 
            'renovacion', 'alta',
            NEW.end_date - INTERVAL '30 days', 30
        )
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_plan_renewal ON client_plans;
CREATE TRIGGER trg_plan_renewal
    AFTER INSERT OR UPDATE OF status, end_date ON client_plans
    FOR EACH ROW EXECUTE FUNCTION create_renewal_reminder();

-- Incrementar uso de templates
CREATE OR REPLACE FUNCTION inc_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.wa_template_id IS NOT NULL THEN
        UPDATE whatsapp_templates 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.wa_template_id;
    END IF;
    IF NEW.fb_template_id IS NOT NULL THEN
        UPDATE messenger_templates 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.fb_template_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_activity_template ON activities;
CREATE TRIGGER trg_activity_template
    AFTER INSERT ON activities
    FOR EACH ROW EXECUTE FUNCTION inc_template_usage();

-- Función para formatear WhatsApp Paraguay
CREATE OR REPLACE FUNCTION format_wa_py(phone VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    phone := regexp_replace(phone, '[^0-9]', '', 'g');
    IF phone LIKE '0%' THEN 
        phone := '595' || substring(phone from 2); 
    END IF;
    IF length(phone) <= 10 THEN 
        phone := '595' || phone; 
    END IF;
    RETURN phone;
END;
$$ LANGUAGE plpgsql IMMUTABLE;