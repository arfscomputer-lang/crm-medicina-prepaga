/*
  # Planes Contratados y Cotizaciones
  
  1. Tablas
    - client_plans: Planes EBSA contratados
    - quotations: Cotizaciones comparativas
    - quotation_items: Ítems de cotización
  
  2. Características
    - Primas mensual, trimestral, semestral, anual
    - Comisiones del agente (% configurable)
    - Vigencia y renovación automática
    - Estados: cotizado, activo, vencido, cancelado
    - Número de beneficiarios cubiertos
*/

CREATE TABLE IF NOT EXISTS client_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    client_id       UUID NOT NULL REFERENCES clients(id),
    agent_id        UUID NOT NULL REFERENCES users(id),
    plan_catalog_id UUID REFERENCES plan_catalog(id),
    
    plan_number     VARCHAR(50) UNIQUE,
    plan_tier       plan_tier NOT NULL,
    status          client_plan_status NOT NULL DEFAULT 'cotizado',
    
    monthly_premium     BIGINT NOT NULL DEFAULT 0,
    quarterly_premium   BIGINT DEFAULT 0,
    semiannual_premium  BIGINT DEFAULT 0,
    annual_premium      BIGINT NOT NULL DEFAULT 0,
    payment_frequency   payment_frequency DEFAULT 'mensual',
    
    commission_pct          DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    renewal_commission_pct  DECIMAL(5,2) DEFAULT 10.00,
    
    start_date      DATE,
    end_date        DATE,
    
    num_beneficiaries INTEGER DEFAULT 1,
    covered_beneficiary_ids UUID[] DEFAULT '{}',
    
    is_renewable    BOOLEAN DEFAULT true,
    auto_renew      BOOLEAN DEFAULT false,
    renewed_from_id UUID REFERENCES client_plans(id),
    
    contract_url    VARCHAR(500),
    proposal_url    VARCHAR(500),
    
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    client_id       UUID NOT NULL REFERENCES clients(id),
    agent_id        UUID NOT NULL REFERENCES users(id),
    
    quotation_number VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'pendiente',
    valid_until     DATE,
    
    total_monthly   BIGINT DEFAULT 0,
    total_annual    BIGINT DEFAULT 0,
    
    sent_via        channel_type,
    sent_at         TIMESTAMPTZ,
    notes           TEXT,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id    UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    plan_catalog_id UUID REFERENCES plan_catalog(id),
    
    plan_name       VARCHAR(200) NOT NULL,
    plan_tier       plan_tier NOT NULL,
    monthly_premium BIGINT NOT NULL,
    annual_premium  BIGINT NOT NULL,
    commission_pct  DECIMAL(5,2),
    num_beneficiaries INTEGER DEFAULT 1,
    
    is_recommended  BOOLEAN DEFAULT false,
    notes           TEXT,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_plans_org ON client_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_client_plans_client ON client_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_client_plans_agent ON client_plans(agent_id);
CREATE INDEX IF NOT EXISTS idx_client_plans_status ON client_plans(status);
CREATE INDEX IF NOT EXISTS idx_client_plans_tier ON client_plans(plan_tier);
CREATE INDEX IF NOT EXISTS idx_client_plans_end ON client_plans(end_date) WHERE status = 'activo';