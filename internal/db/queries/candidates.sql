-- These queries are for sqlc generation (recommended for production).
-- If you use sqlc, run:
--   sqlc generate
-- and point gen output to internal/db/gen (or replace internal/db package).
-- NOTE: The runnable template in internal/db/db.go is a simplified implementation.

-- name: ListCandidatesPage :many
WITH filtered AS (
  SELECT c.*
  FROM candidates c
  WHERE c.status = 'active'
    AND (sqlc.narg('english_level')::text IS NULL OR sqlc.narg('english_level') = '' OR c.english_level = sqlc.narg('english_level'))
    AND (sqlc.narg('bc_experience')::boolean IS NULL OR c.bc_experience = sqlc.narg('bc_experience'))
    AND (sqlc.narg('avail_max')::int IS NULL OR c.availability_days <= sqlc.narg('avail_max'))
    AND (sqlc.narg('salary_min')::int IS NULL OR c.expected_salary_max_cny IS NULL OR c.expected_salary_max_cny >= sqlc.narg('salary_min'))
    AND (sqlc.narg('salary_max')::int IS NULL OR c.expected_salary_min_cny IS NULL OR c.expected_salary_min_cny <= sqlc.narg('salary_max'))
    AND (
      sqlc.narg('skill')::text IS NULL OR sqlc.narg('skill') = '' OR
      EXISTS (
        SELECT 1
        FROM candidate_skills cs
        JOIN skills s ON s.id = cs.skill_id
        WHERE cs.candidate_id = c.id AND s.name = sqlc.narg('skill')
      )
    )
),
ranked AS (
  SELECT
    f.*,
    CASE
      WHEN sqlc.narg('q')::text IS NULL OR sqlc.narg('q') = '' THEN 0
      ELSE ts_rank_cd(f.search_tsv, websearch_to_tsquery('simple', sqlc.narg('q')))
    END AS ts_rank
  FROM filtered f
  WHERE (sqlc.narg('q')::text IS NULL OR sqlc.narg('q') = '')
     OR (f.search_tsv @@ websearch_to_tsquery('simple', sqlc.narg('q')))
)
SELECT
  r.id,
  r.public_slug,
  r.display_name,
  r.desired_role,
  r.english_level,
  r.expected_salary_min_cny,
  r.expected_salary_max_cny,
  r.availability_days,
  r.timezone,
  r.bc_experience,
  r.summary,
  r.rating,
  (u.id IS NOT NULL) AS unlocked_contact
FROM ranked r
LEFT JOIN unlocks u
  ON u.company_id = sqlc.arg('company_id')
 AND u.candidate_id = r.id
 AND u.unlock_type = 'contact'
ORDER BY
  CASE WHEN sqlc.narg('q')::text IS NULL OR sqlc.narg('q') = '' THEN 0 ELSE 1 END DESC,
  r.ts_rank DESC,
  r.rating DESC,
  r.updated_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');


-- name: GetCandidateBySlugWithUnlocked :one
SELECT
  c.id,
  c.public_slug,
  c.display_name,
  c.desired_role,
  c.english_level,
  c.expected_salary_min_cny,
  c.expected_salary_max_cny,
  c.availability_days,
  c.timezone,
  c.bc_experience,
  c.summary,
  c.rating,
  (u.id IS NOT NULL) AS unlocked_contact
FROM candidates c
LEFT JOIN unlocks u
  ON u.company_id = sqlc.arg('company_id')
 AND u.candidate_id = c.id
 AND u.unlock_type = 'contact'
WHERE c.public_slug = sqlc.arg('public_slug')
  AND c.status = 'active'
LIMIT 1;


-- name: GetCandidateIDBySlug :one
SELECT id
FROM candidates
WHERE public_slug = sqlc.arg('public_slug')
  AND status = 'active'
LIMIT 1;


-- name: GetCandidateContactByID :one
SELECT
  NULLIF(tg_username, '')::text AS tg_username,
  NULLIF(email::text, '')       AS email,
  NULLIF(phone, '')::text       AS phone
FROM candidate_contacts
WHERE candidate_id = sqlc.arg('candidate_id')
LIMIT 1;


-- name: UnlockCandidateContactIdempotent :one
INSERT INTO unlocks(company_id, hr_user_id, candidate_id, unlock_type, cost)
VALUES (sqlc.arg('company_id'), sqlc.arg('hr_user_id'), sqlc.arg('candidate_id'), 'contact', 1)
ON CONFLICT (company_id, candidate_id, unlock_type) DO NOTHING
RETURNING id;
