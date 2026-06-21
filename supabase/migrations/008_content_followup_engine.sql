-- Content & Follow-up Engine module

-- ─── content_settings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  industry TEXT NOT NULL DEFAULT 'general',
  tone_of_voice TEXT NOT NULL DEFAULT 'professional',
  target_audience TEXT,
  brand_positioning TEXT,
  forbidden_claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_cta TEXT,
  default_locale TEXT NOT NULL DEFAULT 'ro',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id)
);

CREATE INDEX idx_content_settings_client_id ON content_settings(client_id);
CREATE TRIGGER content_settings_updated_at
  BEFORE UPDATE ON content_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── generated_content ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  title TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  template_id UUID REFERENCES content_templates(id) ON DELETE SET NULL,
  generated_by TEXT NOT NULL DEFAULT 'ai',
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generated_content_client_id ON generated_content(client_id);
CREATE INDEX idx_generated_content_status ON generated_content(client_id, status);
CREATE INDEX idx_generated_content_lead_id ON generated_content(lead_id);
CREATE INDEX idx_generated_content_offer_id ON generated_content(offer_id);
CREATE TRIGGER generated_content_updated_at
  BEFORE UPDATE ON generated_content
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Extend followup_sequences ─────────────────────────────────────────────────
ALTER TABLE followup_sequences ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE followup_sequences ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES offers(id) ON DELETE CASCADE;
ALTER TABLE followup_sequences ADD COLUMN IF NOT EXISTS require_approval BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE followup_sequences ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_followup_sequences_lead_id ON followup_sequences(lead_id);
CREATE INDEX IF NOT EXISTS idx_followup_sequences_offer_id ON followup_sequences(offer_id);

-- ─── Extend followup_messages ──────────────────────────────────────────────────
ALTER TABLE followup_messages ADD COLUMN IF NOT EXISTS require_approval BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE followup_messages ADD COLUMN IF NOT EXISTS name TEXT;

-- ─── scheduled_followups ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES followup_sequences(id) ON DELETE SET NULL,
  followup_message_id UUID REFERENCES followup_messages(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  generated_content_id UUID REFERENCES generated_content(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_followups_client_id ON scheduled_followups(client_id);
CREATE INDEX idx_scheduled_followups_lead_id ON scheduled_followups(lead_id);
CREATE INDEX idx_scheduled_followups_status ON scheduled_followups(status, scheduled_for);
CREATE TRIGGER scheduled_followups_updated_at
  BEFORE UPDATE ON scheduled_followups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE content_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_followups ENABLE ROW LEVEL SECURITY;
