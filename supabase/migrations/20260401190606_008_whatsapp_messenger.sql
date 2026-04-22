/*
  # WhatsApp Business y Facebook Messenger
  
  1. Tablas WhatsApp
    - whatsapp_templates: Plantillas pre-aprobadas
    - whatsapp_conversations: Hilos de conversación
    - whatsapp_messages: Mensajes individuales
  
  2. Tablas Messenger
    - messenger_templates: Plantillas de mensajes
    - messenger_conversations: Hilos de conversación
    - messenger_messages: Mensajes individuales
  
  3. Características
    - Integración con Meta Business API
    - Plantillas con variables dinámicas
    - Tracking de estado de mensajes
    - Link con actividades CRM
*/

-- WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    created_by      UUID REFERENCES users(id),
    
    name            VARCHAR(100) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    body_template   TEXT NOT NULL,
    variables       TEXT[] DEFAULT '{}',
    
    meta_template_id    VARCHAR(100),
    meta_status         VARCHAR(20),
    meta_language       VARCHAR(10) DEFAULT 'es',
    
    is_active       BOOLEAN DEFAULT true,
    usage_count     INTEGER DEFAULT 0,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    client_id       UUID NOT NULL REFERENCES clients(id),
    agent_id        UUID NOT NULL REFERENCES users(id),
    
    wa_conversation_id VARCHAR(100),
    status          VARCHAR(20) DEFAULT 'open',
    
    last_message_at     TIMESTAMPTZ,
    last_message_preview TEXT,
    unread_count    INTEGER DEFAULT 0,
    
    opened_at       TIMESTAMPTZ DEFAULT NOW(),
    closed_at       TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    activity_id     UUID REFERENCES activities(id),
    
    wa_message_id   VARCHAR(100),
    direction       msg_direction NOT NULL,
    
    message_type    VARCHAR(20) DEFAULT 'text',
    body            TEXT,
    media_url       VARCHAR(500),
    template_id     UUID REFERENCES whatsapp_templates(id),
    
    status          msg_status DEFAULT 'pendiente',
    status_updated_at TIMESTAMPTZ,
    
    sent_by         UUID REFERENCES users(id),
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Messenger
CREATE TABLE IF NOT EXISTS messenger_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    created_by      UUID REFERENCES users(id),
    
    name            VARCHAR(100) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    body_template   TEXT NOT NULL,
    variables       TEXT[] DEFAULT '{}',
    
    is_active       BOOLEAN DEFAULT true,
    usage_count     INTEGER DEFAULT 0,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messenger_conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id),
    client_id       UUID NOT NULL REFERENCES clients(id),
    agent_id        UUID NOT NULL REFERENCES users(id),
    
    fb_conversation_id VARCHAR(100),
    fb_psid         VARCHAR(100),
    status          VARCHAR(20) DEFAULT 'open',
    
    last_message_at     TIMESTAMPTZ,
    last_message_preview TEXT,
    unread_count    INTEGER DEFAULT 0,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messenger_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES messenger_conversations(id) ON DELETE CASCADE,
    activity_id     UUID REFERENCES activities(id),
    
    fb_message_id   VARCHAR(100),
    direction       msg_direction NOT NULL,
    
    message_type    VARCHAR(20) DEFAULT 'text',
    body            TEXT,
    media_url       VARCHAR(500),
    template_id     UUID REFERENCES messenger_templates(id),
    
    status          msg_status DEFAULT 'pendiente',
    
    sent_by         UUID REFERENCES users(id),
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_wa_conv_client ON whatsapp_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_wa_conv_agent ON whatsapp_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_conv ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wa_msgs_activity ON whatsapp_messages(activity_id) WHERE activity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wa_msgs_created ON whatsapp_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fb_conv_client ON messenger_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_fb_conv_agent ON messenger_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_fb_msgs_conv ON messenger_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_fb_msgs_activity ON messenger_messages(activity_id) WHERE activity_id IS NOT NULL;