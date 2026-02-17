package db

import (
    "context"

    "github.com/jackc/pgx/v5/pgtype"
    "github.com/jackc/pgx/v5/pgxpool"
)

// This project is structured to be compatible with sqlc.
// If you prefer pure sqlc generation, keep queries in internal/db/queries and run:
//   sqlc generate
// Then replace this package with the generated one.
//
// For convenience, we provide a small hand-written layer that mirrors the method signatures
// used by the service/repo so the project builds without requiring sqlc installed.

type Queries struct {
    pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Queries { return &Queries{pool: pool} }

type ListCandidatesPageParams struct {
    CompanyID    int64
    EnglishLevel *string
    BcExperience *bool
    AvailMax     *int32
    SalaryMin    *int32
    SalaryMax    *int32
    Skill        *string
    Q            *string
    Limit        int32
    Offset       int32
}

type ListCandidatesPageRow struct {
    ID                   int64
    PublicSlug            string
    DisplayName          string
    DesiredRole          pgtype.Text
    EnglishLevel         pgtype.Text
    ExpectedSalaryMinCny pgtype.Int4
    ExpectedSalaryMaxCny pgtype.Int4
    AvailabilityDays     pgtype.Int4
    Timezone             pgtype.Text
    BcExperience         bool
    Summary              pgtype.Text
    Rating               pgtype.Int4
    UnlockedContact      bool
}

func (q *Queries) ListCandidatesPage(ctx context.Context, p ListCandidatesPageParams) ([]ListCandidatesPageRow, error) {
    // NOTE: For full-text + skill filter + unlock join, see docs/schema.sql and internal/db/queries/*.sql
    // This placeholder implements a basic version (without q rank) to keep the project runnable.
    sql := `
SELECT
  c.id, c.public_slug, c.display_name,
  c.desired_role, c.english_level,
  c.expected_salary_min_cny, c.expected_salary_max_cny,
  c.availability_days, c.timezone,
  c.bc_experience, c.summary, c.rating,
  (u.id IS NOT NULL) AS unlocked_contact
FROM candidates c
LEFT JOIN unlocks u
  ON u.company_id = $1 AND u.candidate_id = c.id AND u.unlock_type = 'contact'
WHERE c.status = 'active'
  AND ($2::text IS NULL OR $2 = '' OR c.english_level = $2)
  AND ($3::boolean IS NULL OR c.bc_experience = $3)
  AND ($4::int IS NULL OR c.availability_days <= $4)
  AND ($5::int IS NULL OR c.expected_salary_max_cny IS NULL OR c.expected_salary_max_cny >= $5)
  AND ($6::int IS NULL OR c.expected_salary_min_cny IS NULL OR c.expected_salary_min_cny <= $6)
ORDER BY c.updated_at DESC
LIMIT $7 OFFSET $8;
`
    rows, err := q.pool.Query(ctx, sql, p.CompanyID, p.EnglishLevel, p.BcExperience, p.AvailMax, p.SalaryMin, p.SalaryMax, p.Limit, p.Offset)
    if err != nil { return nil, err }
    defer rows.Close()

    out := make([]ListCandidatesPageRow, 0)
    for rows.Next() {
        var r ListCandidatesPageRow
        err := rows.Scan(
            &r.ID, &r.PublicSlug, &r.DisplayName,
            &r.DesiredRole, &r.EnglishLevel,
            &r.ExpectedSalaryMinCny, &r.ExpectedSalaryMaxCny,
            &r.AvailabilityDays, &r.Timezone,
            &r.BcExperience, &r.Summary, &r.Rating,
            &r.UnlockedContact,
        )
        if err != nil { return nil, err }
        out = append(out, r)
    }
    return out, rows.Err()
}

type GetCandidateBySlugWithUnlockedParams struct {
    CompanyID  int64
    PublicSlug string
}

type GetCandidateBySlugWithUnlockedRow struct {
    ID                   int64
    PublicSlug           string
    DisplayName          string
    DesiredRole          pgtype.Text
    EnglishLevel         pgtype.Text
    ExpectedSalaryMinCny pgtype.Int4
    ExpectedSalaryMaxCny pgtype.Int4
    AvailabilityDays     pgtype.Int4
    Timezone             pgtype.Text
    BcExperience         bool
    Summary              pgtype.Text
    Rating               pgtype.Int4
    UnlockedContact      bool
}

func (q *Queries) GetCandidateBySlugWithUnlocked(ctx context.Context, p GetCandidateBySlugWithUnlockedParams) (GetCandidateBySlugWithUnlockedRow, error) {
    sql := `
SELECT
  c.id, c.public_slug, c.display_name,
  c.desired_role, c.english_level,
  c.expected_salary_min_cny, c.expected_salary_max_cny,
  c.availability_days, c.timezone, c.bc_experience, c.summary, c.rating,
  (u.id IS NOT NULL) AS unlocked_contact
FROM candidates c
LEFT JOIN unlocks u
  ON u.company_id = $1 AND u.candidate_id = c.id AND u.unlock_type = 'contact'
WHERE c.public_slug = $2 AND c.status = 'active'
LIMIT 1;`
    var r GetCandidateBySlugWithUnlockedRow
    err := q.pool.QueryRow(ctx, sql, p.CompanyID, p.PublicSlug).Scan(
        &r.ID, &r.PublicSlug, &r.DisplayName,
        &r.DesiredRole, &r.EnglishLevel,
        &r.ExpectedSalaryMinCny, &r.ExpectedSalaryMaxCny,
        &r.AvailabilityDays, &r.Timezone, &r.BcExperience, &r.Summary, &r.Rating,
        &r.UnlockedContact,
    )
    return r, err
}

func (q *Queries) GetCandidateIDBySlug(ctx context.Context, slug string) (int64, error) {
    var id int64
    err := q.pool.QueryRow(ctx, `SELECT id FROM candidates WHERE public_slug=$1 AND status='active' LIMIT 1`, slug).Scan(&id)
    return id, err
}

type ListSkillsByCandidateIDsRow struct {
    CandidateID int64
    Name        string
}

func (q *Queries) ListSkillsByCandidateIDs(ctx context.Context, ids []int64) ([]ListSkillsByCandidateIDsRow, error) {
    sql := `
SELECT cs.candidate_id, s.name
FROM candidate_skills cs
JOIN skills s ON s.id = cs.skill_id
WHERE cs.candidate_id = ANY($1::bigint[])
ORDER BY cs.candidate_id;`
    rows, err := q.pool.Query(ctx, sql, ids)
    if err != nil { return nil, err }
    defer rows.Close()
    out := make([]ListSkillsByCandidateIDsRow, 0)
    for rows.Next() {
        var r ListSkillsByCandidateIDsRow
        if err := rows.Scan(&r.CandidateID, &r.Name); err != nil { return nil, err }
        out = append(out, r)
    }
    return out, rows.Err()
}

type GetCandidateContactByIDRow struct {
    TgUsername pgtype.Text
    Email      pgtype.Text
    Phone      pgtype.Text
}

func (q *Queries) GetCandidateContactByID(ctx context.Context, candidateID int64) (GetCandidateContactByIDRow, error) {
    sql := `
SELECT
  NULLIF(tg_username, '')::text AS tg_username,
  NULLIF(email::text, '')       AS email,
  NULLIF(phone, '')::text       AS phone
FROM candidate_contacts
WHERE candidate_id = $1
LIMIT 1;`
    var r GetCandidateContactByIDRow
    err := q.pool.QueryRow(ctx, sql, candidateID).Scan(&r.TgUsername, &r.Email, &r.Phone)
    return r, err
}

type UnlockCandidateContactIdempotentParams struct {
    CompanyID   int64
    HrUserID    int64
    CandidateID int64
}

func (q *Queries) UnlockCandidateContactIdempotent(ctx context.Context, p UnlockCandidateContactIdempotentParams) (int64, error) {
    // returns unlock id if inserted; if already exists -> ErrNoRows
    sql := `
INSERT INTO unlocks(company_id, hr_user_id, candidate_id, unlock_type, cost)
VALUES ($1,$2,$3,'contact',1)
ON CONFLICT (company_id, candidate_id, unlock_type) DO NOTHING
RETURNING id;`
    var id int64
    err := q.pool.QueryRow(ctx, sql, p.CompanyID, p.HrUserID, p.CandidateID).Scan(&id)
    return id, err
}

type CompanyQuotaRow struct {
    CompanyID        int64
    UnlockQuotaTotal int32
    UnlockQuotaUsed  int32
}

func (q *Queries) LockCompanyQuota(ctx context.Context, companyID int64) (CompanyQuotaRow, error) {
    sql := `
SELECT company_id, unlock_quota_total, unlock_quota_used
FROM company_quotas
WHERE company_id=$1
FOR UPDATE;`
    var r CompanyQuotaRow
    err := q.pool.QueryRow(ctx, sql, companyID).Scan(&r.CompanyID, &r.UnlockQuotaTotal, &r.UnlockQuotaUsed)
    return r, err
}

type IncrementCompanyQuotaUsedParams struct {
    CompanyID int64
    Delta     int32
}

func (q *Queries) IncrementCompanyQuotaUsed(ctx context.Context, p IncrementCompanyQuotaUsedParams) error {
    _, err := q.pool.Exec(ctx, `UPDATE company_quotas SET unlock_quota_used = unlock_quota_used + $2, updated_at=now() WHERE company_id=$1`, p.CompanyID, p.Delta)
    return err
}

// WithTx provides a minimal "sqlc-like" API.
// In this runnable template, we keep it simple by returning a new Queries bound to the same pool;
// the repo uses pgx tx directly, so WithTx isn't needed here.
func (q *Queries) WithTx(_ any) *Queries { return q }
