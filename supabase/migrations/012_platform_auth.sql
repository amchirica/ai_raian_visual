-- Platform admin authentication (Supabase Auth + profile table)
-- User credentials are created via: npm run seed:admin
-- Uses auth.users (managed by Supabase Auth) + platform_admins profile

CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platform_admins_email ON platform_admins(email);
CREATE INDEX idx_platform_admins_active ON platform_admins(is_active) WHERE is_active = TRUE;

CREATE TRIGGER platform_admins_updated_at
  BEFORE UPDATE ON platform_admins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own admin profile
CREATE POLICY platform_admins_select_own ON platform_admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Service role bypasses RLS for seeding and server operations

COMMENT ON TABLE platform_admins IS 'Platform super-admins linked to Supabase Auth users. MVP: super_admin only.';
