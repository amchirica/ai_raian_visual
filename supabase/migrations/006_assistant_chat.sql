-- AI Assistant Chat Widget module

-- ─── assistant_settings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assistant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  greeting_message TEXT NOT NULL DEFAULT 'Bună! Sunt asistentul virtual. Cu ce te pot ajuta?',
  fallback_message TEXT NOT NULL DEFAULT 'Nu am această informație în baza mea de date. Pot să te pun în legătură cu echipa sau să îți iau datele de contact.',
  handoff_message TEXT NOT NULL DEFAULT 'Te pun în legătură cu un coleg. Lasă-ne numele și telefonul/emailul tău.',
  tone TEXT NOT NULL DEFAULT 'professional',
  lead_capture_prompt TEXT NOT NULL DEFAULT 'Vrei să primești o ofertă personalizată? Lasă-ne numele și emailul tău.',
  lead_form_url TEXT,
  system_instructions TEXT,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id)
);

CREATE INDEX idx_assistant_settings_client_id ON assistant_settings(client_id);
CREATE TRIGGER assistant_settings_updated_at
  BEFORE UPDATE ON assistant_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── chat_conversations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  visitor_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  handoff_requested BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_conversations_client_id ON chat_conversations(client_id);
CREATE INDEX idx_chat_conversations_status ON chat_conversations(client_id, status);
CREATE TRIGGER chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── chat_messages ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE TRIGGER chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE assistant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
