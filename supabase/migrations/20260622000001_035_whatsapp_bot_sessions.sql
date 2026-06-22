/*
  # WhatsApp Bot Sessions

  Tabla para mantener el estado de conversaciones del bot por cliente.
  Cada sesión expira a los 30 minutos de inactividad.
*/

CREATE TABLE IF NOT EXISTS whatsapp_bot_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone       VARCHAR(20) NOT NULL,
  state       VARCHAR(50) NOT NULL DEFAULT 'idle',
  context     JSONB DEFAULT '{}',
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, phone)
);

ALTER TABLE whatsapp_bot_sessions ENABLE ROW LEVEL SECURITY;

-- Solo service role accede (la Edge Function usa service role key)
CREATE POLICY "Service role only"
  ON whatsapp_bot_sessions
  USING (false);

CREATE INDEX IF NOT EXISTS idx_bot_sessions_phone ON whatsapp_bot_sessions(org_id, phone);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_expires ON whatsapp_bot_sessions(expires_at);
