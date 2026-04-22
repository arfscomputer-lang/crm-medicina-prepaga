/*
  # Organizaciones y Usuarios
  
  1. Tablas
    - organizations: Agencias multitenancy
    - users: Usuarios con 6 roles y jerarquía
    - role_permissions: Permisos granulares (30+ flags)
    - user_sessions: Sesiones JWT/auth
  
  2. Características
    - Soporte multitenancy
    - Sistema de roles completo
    - Jerarquía supervisor → agente
    - Permisos específicos por módulo
    - Integración WhatsApp Business y Messenger
*/

CREATE TABLE IF NOT EXISTS organizations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    ruc             VARCHAR(20) UNIQUE,
    phone           VARCHAR(20),
    email           VARCHAR(255),
    address         TEXT,
    logo_url        VARCHAR(500),
    
    default_commission_pct  DECIMAL(5,2) DEFAULT 15.00,
    currency        VARCHAR(3) DEFAULT 'PYG',
    timezone        VARCHAR(50) DEFAULT 'America/Asuncion',
    
    sifen_ruc               VARCHAR(20),
    sifen_timbrado          VARCHAR(20),
    sifen_environment       VARCHAR(10) DEFAULT 'test',
    
    wa_phone_number_id      VARCHAR(50),
    wa_business_account_id  VARCHAR(50),
    wa_access_token_enc     TEXT,
    wa_webhook_secret_enc   TEXT,
    
    fb_page_id              VARCHAR(50),
    fb_page_access_token_enc TEXT,
    fb_app_secret_enc       TEXT,
    
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    cedula          VARCHAR(20),
    avatar_url      VARCHAR(500),
    
    password_hash   TEXT NOT NULL,
    email_verified  BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret  TEXT,
    
    role            user_role NOT NULL DEFAULT 'agente',
    supervisor_id   UUID REFERENCES users(id),
    
    license_number  VARCHAR(50),
    license_expiry  DATE,
    
    default_commission_pct DECIMAL(5,2) DEFAULT 15.00,
    
    is_active       BOOLEAN DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    role            user_role NOT NULL,
    
    can_view_dashboard      BOOLEAN DEFAULT true,
    
    can_view_catalog        BOOLEAN DEFAULT true,
    can_manage_catalog      BOOLEAN DEFAULT false,
    can_upload_plan_pdfs    BOOLEAN DEFAULT false,
    
    can_view_clients        BOOLEAN DEFAULT true,
    can_create_clients      BOOLEAN DEFAULT true,
    can_edit_clients        BOOLEAN DEFAULT true,
    can_delete_clients      BOOLEAN DEFAULT false,
    can_view_all_clients    BOOLEAN DEFAULT false,
    
    can_view_plans          BOOLEAN DEFAULT true,
    can_create_plans        BOOLEAN DEFAULT true,
    can_edit_plans          BOOLEAN DEFAULT true,
    can_delete_plans        BOOLEAN DEFAULT false,
    can_view_all_plans      BOOLEAN DEFAULT false,
    
    can_view_commissions    BOOLEAN DEFAULT true,
    can_view_all_commissions BOOLEAN DEFAULT false,
    can_manage_commissions  BOOLEAN DEFAULT false,
    
    can_view_activities     BOOLEAN DEFAULT true,
    can_create_activities   BOOLEAN DEFAULT true,
    can_view_all_activities BOOLEAN DEFAULT false,
    can_delete_activities   BOOLEAN DEFAULT false,
    
    can_view_payments       BOOLEAN DEFAULT true,
    can_create_payments     BOOLEAN DEFAULT true,
    can_edit_payments       BOOLEAN DEFAULT false,
    
    can_use_whatsapp        BOOLEAN DEFAULT true,
    can_use_messenger       BOOLEAN DEFAULT true,
    can_create_campaigns    BOOLEAN DEFAULT false,
    can_send_campaigns      BOOLEAN DEFAULT false,
    
    can_view_invoices       BOOLEAN DEFAULT true,
    can_create_invoices     BOOLEAN DEFAULT false,
    
    can_view_reports        BOOLEAN DEFAULT true,
    can_export_data         BOOLEAN DEFAULT false,
    can_manage_users        BOOLEAN DEFAULT false,
    can_manage_org          BOOLEAN DEFAULT false,
    can_view_audit_log      BOOLEAN DEFAULT false,
    
    UNIQUE(org_id, role),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token_hash      TEXT NOT NULL UNIQUE,
    refresh_token_hash TEXT,
    
    ip_address      INET,
    user_agent      TEXT,
    device_info     VARCHAR(200),
    
    expires_at      TIMESTAMPTZ NOT NULL,
    last_active_at  TIMESTAMPTZ DEFAULT NOW(),
    is_revoked      BOOLEAN DEFAULT false,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(org_id, role);
CREATE INDEX IF NOT EXISTS idx_users_supervisor ON users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at) WHERE is_revoked = false;