-- tg-hr-platform schema (PostgreSQL)
-- NOTE: This is a minimal, production-friendly schema for the MVP.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Companies / HR users
CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active/pending/blocked
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hr_users (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tg_user_id BIGINT,
  tg_username TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'recruiter',
  status TEXT NOT NULL DEFAULT 'pending', -- pending/active/blocked
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quotas: one row per company for the current period
CREATE TABLE IF NOT EXISTS company_quotas (
  company_id BIGINT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end   DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  unlock_quota_total INT NOT NULL DEFAULT 20,
  unlock_quota_used  INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Candidates
CREATE TABLE IF NOT EXISTS candidates (
  id BIGSERIAL PRIMARY KEY,
  public_slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  desired_role TEXT,
  english_level TEXT, -- none/basic/working/fluent
  expected_salary_min_cny INT,
  expected_salary_max_cny INT,
  availability_days INT,
  timezone TEXT,
  bc_experience BOOLEAN NOT NULL DEFAULT false,
  summary TEXT,
  rating INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active/hidden/deleted
  search_tsv tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidates_status_updated ON candidates(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_search_tsv ON candidates USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_candidates_slug ON candidates(public_slug);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS candidate_skills (
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (candidate_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate ON candidate_skills(candidate_id);

-- Contacts (sensitive)
CREATE TABLE IF NOT EXISTS candidate_contacts (
  candidate_id BIGINT PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  tg_username TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unlocks (audit + entitlement)
CREATE TABLE IF NOT EXISTS unlocks (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  hr_user_id BIGINT NOT NULL REFERENCES hr_users(id) ON DELETE CASCADE,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  unlock_type TEXT NOT NULL, -- contact
  cost INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, candidate_id, unlock_type)
);

CREATE INDEX IF NOT EXISTS idx_unlocks_company_candidate ON unlocks(company_id, candidate_id);

-- Optional: audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT,
  hr_user_id BIGINT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper trigger to maintain search_tsv (basic)
CREATE OR REPLACE FUNCTION candidates_tsv_update() RETURNS trigger AS $$
begin
  new.search_tsv :=
    setweight(to_tsvector('simple', coalesce(new.display_name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.desired_role,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.summary,'')), 'C');
  return new;
end
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_candidates_tsv ON candidates;
CREATE TRIGGER trg_candidates_tsv
BEFORE INSERT OR UPDATE OF display_name, desired_role, summary
ON candidates FOR EACH ROW EXECUTE FUNCTION candidates_tsv_update();

