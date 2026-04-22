/*
  # Clientes y Beneficiarios
  
  1. Tablas
    - clients: Clientes con contacto multicanal
    - beneficiaries: Dependientes del titular
  
  2. Características
    - Contacto por WhatsApp, Messenger, email, teléfono
    - Estados: prospecto, cotizado, activo, vencido, cancelado
    - Canal preferido de comunicación
    - Datos médicos y laborales
    - Sistema de tags y notas
    - Seguimiento de próximo contacto
*/

CREATE TABLE IF NOT EXISTS clients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    agent_id        UUID NOT NULL REFERENCES users(id),
    
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    full_name       VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    cedula          VARCHAR(20),
    ruc             VARCHAR(20),
    birth_date      DATE,
    gender          VARCHAR(10),
    
    phone           VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email           VARCHAR(255),
    
    whatsapp_phone  VARCHAR(20),
    facebook_username VARCHAR(100),
    instagram_handle VARCHAR(100),
    preferred_channel channel_type DEFAULT 'whatsapp',
    
    address_street  VARCHAR(300),
    address_city    VARCHAR(100),
    address_department VARCHAR(100),
    address_neighborhood VARCHAR(100),
    
    company_name    VARCHAR(200),
    company_ruc     VARCHAR(20),
    job_title       VARCHAR(100),
    
    status          client_status NOT NULL DEFAULT 'prospecto',
    lead_source     VARCHAR(100),
    referred_by     UUID REFERENCES clients(id),
    
    has_preexisting_conditions BOOLEAN DEFAULT false,
    preexisting_notes          TEXT,
    smoker          BOOLEAN DEFAULT false,
    blood_type      VARCHAR(5),
    
    notes           TEXT,
    tags            TEXT[] DEFAULT '{}',
    last_contact_at TIMESTAMPTZ,
    next_followup   DATE,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficiaries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    full_name       VARCHAR(200) NOT NULL,
    cedula          VARCHAR(20),
    birth_date      DATE,
    relationship    VARCHAR(50) NOT NULL,
    gender          VARCHAR(10),
    
    has_preexisting_conditions BOOLEAN DEFAULT false,
    preexisting_notes          TEXT,
    
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_agent ON clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_cedula ON clients(cedula);
CREATE INDEX IF NOT EXISTS idx_clients_fullname_trgm ON clients USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_clients_fb ON clients(facebook_username) WHERE facebook_username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_followup ON clients(next_followup) WHERE next_followup IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON clients(last_contact_at DESC);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_client ON beneficiaries(client_id);