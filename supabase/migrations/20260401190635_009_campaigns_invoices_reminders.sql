/*
  # Campañas, Facturación y Recordatorios
  
  1. Tablas Campañas
    - campaigns: Campañas masivas multicanal
    - campaign_recipients: Destinatarios por campaña
  
  2. Tablas Facturación
    - invoices: Facturas electrónicas SIFEN Paraguay
  
  3. Tablas Auxiliares
    - reminders: Recordatorios programados
    - documents: Documentos adjuntos
    - audit_log: Log de auditoría
    - system_config: Configuración del sistema
*/

-- Campañas
CREATE TABLE IF NOT EXISTS campaigns (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    created_by      UUID NOT NULL REFERENCES users(id),
    
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    channel         channel_type NOT NULL,
    
    wa_template_id  UUID REFERENCES whatsapp_templates(id),
    fb_template_id  UUID REFERENCES messenger_templates(id),
    
    target_statuses client_status[],
    target_plan_tiers plan_tier[],
    target_tags     TEXT[],
    
    status          campaign_status DEFAULT 'borrador',
    scheduled_at    TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    
    total_recipients    INTEGER DEFAULT 0,
    sent_count          INTEGER DEFAULT 0,
    delivered_count     INTEGER DEFAULT 0,
    read_count          INTEGER DEFAULT 0,
    replied_count       INTEGER DEFAULT 0,
    failed_count        INTEGER DEFAULT 0,
    
    approved_by     UUID REFERENCES users(id),
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    client_id       UUID NOT NULL REFERENCES clients(id),
    activity_id     UUID REFERENCES activities(id),
    
    status          msg_status DEFAULT 'pendiente',
    sent_at         TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    read_at         TIMESTAMPTZ,
    replied_at      TIMESTAMPTZ,
    error_message   TEXT,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Facturas
CREATE TABLE IF NOT EXISTS invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    client_id       UUID NOT NULL REFERENCES clients(id),
    payment_id      UUID REFERENCES payments(id),
    issued_by       UUID NOT NULL REFERENCES users(id),
    
    invoice_type    invoice_type NOT NULL DEFAULT 'factura_electronica',
    cdc             VARCHAR(44),
    timbrado        VARCHAR(20),
    number          VARCHAR(20) NOT NULL,
    
    subtotal        BIGINT NOT NULL,
    tax_5           BIGINT DEFAULT 0,
    tax_10          BIGINT DEFAULT 0,
    total           BIGINT NOT NULL,
    
    sifen_status    VARCHAR(20) DEFAULT 'pendiente',
    sifen_batch_id  VARCHAR(100),
    sifen_response  JSONB,
    
    xml_url         VARCHAR(500),
    pdf_url         VARCHAR(500),
    
    issued_at       TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at    TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Recordatorios
CREATE TABLE IF NOT EXISTS reminders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    agent_id        UUID NOT NULL REFERENCES users(id),
    client_id       UUID REFERENCES clients(id),
    client_plan_id  UUID REFERENCES client_plans(id),
    
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    reminder_type   VARCHAR(50) NOT NULL,
    priority        VARCHAR(10) DEFAULT 'normal',
    
    due_date        DATE NOT NULL,
    due_time        TIME,
    notify_via      channel_type[] DEFAULT '{whatsapp}',
    notify_days_before INTEGER DEFAULT 3,
    
    is_completed    BOOLEAN DEFAULT false,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES users(id),
    is_recurring    BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(100),
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Documentos
CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    
    entity_type     VARCHAR(20) NOT NULL,
    entity_id       UUID NOT NULL,
    
    name            VARCHAR(300) NOT NULL,
    file_url        VARCHAR(500) NOT NULL,
    file_type       VARCHAR(50),
    file_size_bytes BIGINT,
    doc_category    VARCHAR(50),
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auditoría
CREATE TABLE IF NOT EXISTS audit_log (
    id              BIGSERIAL PRIMARY KEY,
    org_id          UUID REFERENCES organizations(id),
    user_id         UUID REFERENCES users(id),
    
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    action          VARCHAR(20) NOT NULL,
    
    old_data        JSONB,
    new_data        JSONB,
    changed_fields  TEXT[],
    
    ip_address      INET,
    user_agent      TEXT,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración
CREATE TABLE IF NOT EXISTS system_config (
    org_id          UUID NOT NULL REFERENCES organizations(id),
    key             VARCHAR(100) NOT NULL,
    value           JSONB NOT NULL,
    description     TEXT,
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recip ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recip_activity ON campaign_recipients(activity_id) WHERE activity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cdc ON invoices(cdc);

CREATE INDEX IF NOT EXISTS idx_reminders_agent ON reminders(agent_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_date) WHERE is_completed = false;

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);