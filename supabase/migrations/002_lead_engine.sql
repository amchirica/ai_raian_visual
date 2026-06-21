-- Lead Engine module — scoring columns, field types, indexes

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS score_category TEXT,
  ADD COLUMN IF NOT EXISTS score_explanation TEXT,
  ADD COLUMN IF NOT EXISTS recommended_action TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_score_category ON leads(client_id, score_category);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(client_id, score DESC);

COMMENT ON COLUMN leads.score_category IS 'hot | warm | cold — derived from configurable scoring';
COMMENT ON COLUMN leads.score_explanation IS 'Human-readable scoring breakdown';
COMMENT ON COLUMN leads.recommended_action IS 'Suggested next step based on score category';

-- clients.settings.lead_scoring JSON holds per-client scoring rules (no new table required)
