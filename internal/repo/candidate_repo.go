package repo

import (
    "context"
    "errors"

    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"

    "tg-hr-platform/internal/db"
    "tg-hr-platform/internal/domain"
    "tg-hr-platform/internal/util"
)

type CandidateRepo struct {
    Q    *db.Queries
    Pool *pgxpool.Pool
}

func (r *CandidateRepo) ListPage(ctx context.Context, p db.ListCandidatesPageParams) ([]db.ListCandidatesPageRow, error) {
    return r.Q.ListCandidatesPage(ctx, p)
}

func (r *CandidateRepo) GetBySlugWithUnlocked(ctx context.Context, companyID int64, slug string) (db.GetCandidateBySlugWithUnlockedRow, error) {
    row, err := r.Q.GetCandidateBySlugWithUnlocked(ctx, db.GetCandidateBySlugWithUnlockedParams{
        CompanyID:  companyID,
        PublicSlug: slug,
    })
    if err != nil {
        return row, domain.ErrNotFound
    }
    return row, nil
}

func (r *CandidateRepo) GetIDBySlug(ctx context.Context, slug string) (int64, error) {
    id, err := r.Q.GetCandidateIDBySlug(ctx, slug)
    if err != nil {
        return 0, domain.ErrNotFound
    }
    return id, nil
}

func (r *CandidateRepo) ListSkillsByIDs(ctx context.Context, ids []int64) ([]db.ListSkillsByCandidateIDsRow, error) {
    return r.Q.ListSkillsByCandidateIDs(ctx, ids)
}

func (r *CandidateRepo) GetContactByID(ctx context.Context, candidateID int64) (domain.CandidateContact, error) {
    cc, err := r.Q.GetCandidateContactByID(ctx, candidateID)
    if err != nil {
        return domain.CandidateContact{}, domain.ErrNotFound
    }
    return domain.CandidateContact{
        TgUsername: util.TextOrEmpty(cc.TgUsername),
        Email:      util.TextOrEmpty(cc.Email),
        Phone:      util.TextOrEmpty(cc.Phone),
    }, nil
}

// UnlockContactTx: lock quota -> idempotent unlock -> charge quota only if inserted
func (r *CandidateRepo) UnlockContactTx(ctx context.Context, companyID, hrUserID, candidateID int64) (bool, error) {
    tx, err := r.Pool.Begin(ctx)
    if err != nil {
        return false, err
    }
    defer tx.Rollback(ctx)

    // Lock quota row
    quota, err := r.Q.LockCompanyQuota(ctx, companyID)
    if err != nil {
        // likely no quota row configured
        return false, domain.ErrQuotaNotConfigured
    }
    if quota.UnlockQuotaUsed >= quota.UnlockQuotaTotal {
        return false, domain.ErrQuotaExceeded
    }

    // Insert unlock (idempotent)
    _, insErr := r.Q.UnlockCandidateContactIdempotent(ctx, db.UnlockCandidateContactIdempotentParams{
        CompanyID:   companyID,
        HrUserID:    hrUserID,
        CandidateID: candidateID,
    })

    firstTime := true
    if insErr != nil {
        if errors.Is(insErr, pgx.ErrNoRows) {
            firstTime = false
        } else {
            return false, insErr
        }
    }

    if firstTime {
        if err := r.Q.IncrementCompanyQuotaUsed(ctx, db.IncrementCompanyQuotaUsedParams{
            CompanyID: companyID,
            Delta:     1,
        }); err != nil {
            return false, err
        }
    }

    if err := tx.Commit(ctx); err != nil {
        return false, err
    }
    return firstTime, nil
}
