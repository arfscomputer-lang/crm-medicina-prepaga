/*
  # Pagos y Comisiones
  
  1. Tablas
    - payments: Pagos de primas (QR Bancard, Tigo Money, etc.)
    - commissions: Comisiones del agente
  
  2. Características
    - Métodos de pago paraguayos
    - Cálculo automático de comisiones
    - Estados: pendiente, pagado, vencido
    - Recargos por mora y descuentos
    - Tracking de cobro de comisiones
*/

CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    client_plan_id  UUID NOT NULL REFERENCES client_plans(id),
    client_id       UUID NOT NULL REFERENCES clients(id),
    agent_id        UUID NOT NULL REFERENCES users(id),
    
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    period_label    VARCHAR(50),
    
    amount_due      BIGINT NOT NULL,
    amount_paid     BIGINT DEFAULT 0,
    late_fee        BIGINT DEFAULT 0,
    discount        BIGINT DEFAULT 0,
    
    status          payment_status NOT NULL DEFAULT 'pendiente',
    payment_method  payment_method,
    due_date        DATE NOT NULL,
    paid_at         TIMESTAMPTZ,
    
    transaction_ref VARCHAR(100),
    receipt_number  VARCHAR(50),
    
    commission_amount   BIGINT DEFAULT 0,
    commission_paid     BOOLEAN DEFAULT false,
    commission_paid_at  TIMESTAMPTZ,
    
    notes           TEXT,
    recorded_by     UUID REFERENCES users(id),
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    agent_id        UUID NOT NULL REFERENCES users(id),
    client_plan_id  UUID NOT NULL REFERENCES client_plans(id),
    payment_id      UUID REFERENCES payments(id),
    
    period_month    INTEGER NOT NULL,
    period_year     INTEGER NOT NULL,
    
    premium_amount      BIGINT NOT NULL,
    commission_pct      DECIMAL(5,2) NOT NULL,
    commission_amount   BIGINT NOT NULL,
    
    status          commission_status DEFAULT 'devengado',
    paid_at         TIMESTAMPTZ,
    is_renewal      BOOLEAN DEFAULT false,
    
    approved_by     UUID REFERENCES users(id),
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_plan ON payments(client_plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due ON payments(due_date) WHERE status = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_plan ON commissions(client_plan_id);
CREATE INDEX IF NOT EXISTS idx_commissions_period ON commissions(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);