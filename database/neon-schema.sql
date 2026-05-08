-- Next Resume Neon/PostgreSQL schema
-- Run this file in the Neon SQL Editor.
-- The script is safe to run more than once.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  locale text NOT NULL DEFAULT 'zh-CN',
  title text NOT NULL DEFAULT '个人简历',
  owner_name text NOT NULL,
  headline text,
  summary text,
  avatar_url text,
  location text,
  email text,
  phone text,
  website_url text,
  github_url text,
  linkedin_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CHECK (locale ~ '^[a-z]{2}(?:-[A-Z]{2})?$'),
  CHECK (email IS NULL OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

CREATE TABLE IF NOT EXISTS resume_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (url ~* '^https?://')
);

CREATE TABLE IF NOT EXISTS skill_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resume_id, name)
);

CREATE TABLE IF NOT EXISTS skill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES skill_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  level text,
  keywords text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (level IS NULL OR level IN ('familiar', 'proficient', 'expert'))
);

CREATE TABLE IF NOT EXISTS work_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text NOT NULL,
  location text,
  employment_type text,
  start_date date,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  summary text,
  highlights text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date),
  CHECK (employment_type IS NULL OR employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'freelance'))
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  role text,
  description text,
  tech_stack text[] NOT NULL DEFAULT '{}',
  highlights text[] NOT NULL DEFAULT '{}',
  project_url text,
  source_url text,
  start_date date,
  end_date date,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resume_id, slug),
  CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date),
  CHECK (project_url IS NULL OR project_url ~* '^https?://'),
  CHECK (source_url IS NULL OR source_url ~* '^https?://')
);

CREATE TABLE IF NOT EXISTS education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  school text NOT NULL,
  degree text,
  major text,
  location text,
  start_date date,
  end_date date,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  title text NOT NULL,
  issuer text,
  issued_on date,
  credential_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (credential_url IS NULL OR credential_url ~* '^https?://')
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  sender_company text,
  subject text,
  message text NOT NULL,
  source text NOT NULL DEFAULT 'resume_site',
  status text NOT NULL DEFAULT 'new',
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  CHECK (char_length(sender_name) BETWEEN 1 AND 120),
  CHECK (char_length(message) BETWEEN 1 AND 5000),
  CHECK (status IN ('new', 'read', 'replied', 'archived', 'spam'))
);

-- Compatibility table for the current starter form in app/page.tsx.
CREATE TABLE IF NOT EXISTS comments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(btrim(comment)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_resumes_published_slug
  ON resumes (slug)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_resume_links_resume_order
  ON resume_links (resume_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_skill_groups_resume_order
  ON skill_groups (resume_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_skill_items_group_order
  ON skill_items (group_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_work_experiences_resume_order
  ON work_experiences (resume_id, sort_order, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_projects_resume_order
  ON projects (resume_id, is_featured DESC, sort_order, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_projects_resume_slug
  ON projects (resume_id, slug);

CREATE INDEX IF NOT EXISTS idx_education_resume_order
  ON education (resume_id, sort_order, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_certifications_resume_order
  ON certifications (resume_id, sort_order, issued_on DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created
  ON contact_messages (status, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resumes_updated_at ON resumes;
CREATE TRIGGER trg_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_resume_links_updated_at ON resume_links;
CREATE TRIGGER trg_resume_links_updated_at
  BEFORE UPDATE ON resume_links
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_skill_groups_updated_at ON skill_groups;
CREATE TRIGGER trg_skill_groups_updated_at
  BEFORE UPDATE ON skill_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_skill_items_updated_at ON skill_items;
CREATE TRIGGER trg_skill_items_updated_at
  BEFORE UPDATE ON skill_items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_work_experiences_updated_at ON work_experiences;
CREATE TRIGGER trg_work_experiences_updated_at
  BEFORE UPDATE ON work_experiences
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_education_updated_at ON education;
CREATE TRIGGER trg_education_updated_at
  BEFORE UPDATE ON education
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_certifications_updated_at ON certifications;
CREATE TRIGGER trg_certifications_updated_at
  BEFORE UPDATE ON certifications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_contact_messages_updated_at ON contact_messages;
CREATE TRIGGER trg_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMIT;
