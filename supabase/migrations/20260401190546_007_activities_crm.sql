/*
  # Actividades CRM - Módulo Centralizado
  
  1. Tabla
    - activities: Historial centralizado de interacciones multicanal
  
  2. Características
    - Registro de todas las interacciones con clientes
    - Canales: WhatsApp, Messenger, llamada, email, reunión
    - Seguimiento de tareas pendientes
    - Integración con campañas
    - Link con mensajes de WhatsApp/Messenger
*/

CREATE TABLE IF NOT EXISTS activities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    client_id       UUID NOT NULL REFERENCES clients(id),
    agent_id        UUID NOT NULL REFERENCES users(id),
    client_plan_id  UUID REFERENCES client_plans(id),
    
    channel         channel_type NOT NULL DEFAULT 'whatsapp',
    activity_type   activity_type NOT NULL DEFAULT 'otro',
    direction       msg_direction DEFAULT 'outbound',
    
    subject         VARCHAR(300),
    message         TEXT NOT NULL,
    
    wa_message_id   VARCHAR(100),
    wa_template_id  UUID,
    wa_status       msg_status,
    
    fb_message_id   VARCHAR(100),
    fb_template_id  UUID,
    fb_status       msg_status,
    
    requires_followup   BOOLEAN DEFAULT false,
    followup_date       DATE,
    followup_completed  BOOLEAN DEFAULT false,
    followup_completed_by UUID REFERENCES users(id),
    followup_completed_at TIMESTAMPTZ,
    
    is_automated    BOOLEAN DEFAULT false,
    campaign_id     UUID,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda y filtrado optimizado
CREATE INDEX IF NOT EXISTS idx_activities_org ON activities(org_id);
CREATE INDEX IF NOT EXISTS idx_activities_client ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_agent ON activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_activities_channel ON activities(channel);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_month ON activities(org_id, agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_followup ON activities(followup_date) 
    WHERE requires_followup = true AND followup_completed = false;
CREATE INDEX IF NOT EXISTS idx_activities_campaign ON activities(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_channel_month ON activities(org_id, channel, created_at DESC);