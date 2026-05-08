-- Next Resume Admin authentication schema
-- Run this file in the Neon SQL Editor after database/neon-schema.sql.
-- The script is safe to run more than once.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  is_active boolean NOT NULL DEFAULT true,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  CHECK (char_length(display_name) BETWEEN 1 AND 120),
  CHECK (char_length(password_hash) >= 20),
  CHECK (role IN ('owner', 'editor', 'viewer')),
  CHECK (failed_login_attempts >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_lower
  ON admin_users (lower(email));

CREATE INDEX IF NOT EXISTS idx_admin_users_active_role
  ON admin_users (is_active, role);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL UNIQUE,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (session_token_hash ~ '^[a-f0-9]{64}$'),
  CHECK (ip_hash IS NULL OR ip_hash ~ '^[a-f0-9]{64}$'),
  CHECK (expires_at > created_at),
  CHECK (last_seen_at >= created_at),
  CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_active
  ON admin_sessions (admin_user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at
  ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(action) BETWEEN 1 AND 120),
  CHECK (metadata IS NOT NULL),
  CHECK (ip_hash IS NULL OR ip_hash ~ '^[a-f0-9]{64}$')
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_created
  ON admin_audit_logs (admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_created
  ON admin_audit_logs (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity_created
  ON admin_audit_logs (entity_type, entity_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_admin_sessions_updated_at ON admin_sessions;
CREATE TRIGGER trg_admin_sessions_updated_at
  BEFORE UPDATE ON admin_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Create the first admin manually after replacing the values below.
-- The login implementation can verify this hash with:
-- password_hash = crypt($plain_password, password_hash)
--
-- INSERT INTO admin_users (email, display_name, password_hash, role)
-- VALUES (
--   'owner@example.com',
--   'Resume Owner',
--   crypt('replace-with-a-strong-password', gen_salt('bf', 12)),
--   'owner'
-- )
-- ON CONFLICT DO NOTHING;

COMMIT;
