/*
  # Catálogo de Planes EBSA y Coberturas
  
  1. Tablas
    - plan_catalog: 4 planes EBSA (Sana, Confort, Excellent, Adultos Mayores)
    - plan_coverages: 12 categorías de cobertura por plan
    - coverage_services: Sub-servicios dentro de cada cobertura
    - plan_documents: PDFs de referencia por plan
  
  2. Características
    - Catálogo completo de medicina prepaga
    - Coberturas detalladas con carencias
    - Sistema de carga de PDFs
    - Iconos y colores por plan
*/

CREATE TABLE IF NOT EXISTS plan_catalog (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    
    code            VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    tier            plan_tier NOT NULL,
    tier_level      INTEGER NOT NULL DEFAULT 1,
    tagline         VARCHAR(300),
    description     TEXT,
    
    base_monthly_premium    BIGINT DEFAULT 0,
    base_annual_premium     BIGINT DEFAULT 0,
    
    min_age         INTEGER DEFAULT 0,
    max_age         INTEGER DEFAULT 99,
    max_beneficiaries INTEGER DEFAULT 10,
    
    agent_commission_pct    DECIMAL(5,2) DEFAULT 15.00,
    renewal_commission_pct  DECIMAL(5,2) DEFAULT 10.00,
    
    icon            VARCHAR(10),
    color           VARCHAR(7),
    
    provider_name   VARCHAR(200) DEFAULT 'EBSA Medicina Prepaga',
    provider_network VARCHAR(200) DEFAULT 'Centro Médico Bautista',
    
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    
    UNIQUE(org_id, code),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_coverages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_catalog_id UUID NOT NULL REFERENCES plan_catalog(id) ON DELETE CASCADE,
    
    category        coverage_category NOT NULL,
    
    quantity        VARCHAR(100) NOT NULL,
    waiting_period  VARCHAR(100) NOT NULL,
    details         TEXT,
    
    is_included     BOOLEAN DEFAULT true,
    is_unlimited    BOOLEAN DEFAULT false,
    numeric_limit   INTEGER,
    waiting_days    INTEGER DEFAULT 0,
    
    sort_order      INTEGER DEFAULT 0,
    
    UNIQUE(plan_catalog_id, category),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coverage_services (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coverage_id     UUID NOT NULL REFERENCES plan_coverages(id) ON DELETE CASCADE,
    
    service_name    VARCHAR(300) NOT NULL,
    quantity_limit  VARCHAR(100),
    notes           TEXT,
    is_excluded     BOOLEAN DEFAULT false,
    
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_catalog_id UUID NOT NULL REFERENCES plan_catalog(id) ON DELETE CASCADE,
    org_id          UUID NOT NULL REFERENCES organizations(id),
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    
    file_name       VARCHAR(300) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type       VARCHAR(50) DEFAULT 'application/pdf',
    storage_url     VARCHAR(500) NOT NULL,
    
    doc_type        VARCHAR(50) DEFAULT 'anexo_cobertura',
    description     TEXT,
    version         INTEGER DEFAULT 1,
    
    is_current      BOOLEAN DEFAULT true,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plan_catalog_org ON plan_catalog(org_id);
CREATE INDEX IF NOT EXISTS idx_plan_coverages_plan ON plan_coverages(plan_catalog_id);
CREATE INDEX IF NOT EXISTS idx_coverage_services_cov ON coverage_services(coverage_id);
CREATE INDEX IF NOT EXISTS idx_plan_docs_plan ON plan_documents(plan_catalog_id);
CREATE INDEX IF NOT EXISTS idx_plan_docs_current ON plan_documents(plan_catalog_id) WHERE is_current = true;