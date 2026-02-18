package repo

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"tg-hr-platform/internal/db"
)

type HRUserRepo struct {
	Q    *db.Queries
	Pool any // *pgxpool.Pool, but not imported here to avoid circular dependency
	// DefaultStatus controls new HR user status when auto-creating accounts.
	// Expected values: "active" or "pending".
	DefaultStatus string
}

// GetOrCreateHRUserByTelegramID finds or creates an HR user linked to a Telegram account
// This implements the HRUserRepository interface in handlers/auth.go
func (r *HRUserRepo) GetOrCreateHRUserByTelegramID(userID int64, username, displayName string) (hrUserID, companyID int64, status string, err error) {
	// First, try to find existing
	q := r.Q
	ctx := context.Background()
	row, findErr := q.FindHRUserByTelegramID(ctx, userID)
	if findErr == nil {
		// Exists
		return row.ID, row.CompanyID, row.Status, nil
	}
	if !errors.Is(findErr, pgx.ErrNoRows) {
		return 0, 0, "", findErr
	}

	// Create new: first create company if needed, then HR user
	// For MVP: auto-create a company for new Telegram users
	companyID, err = q.CreateDefaultCompany(ctx)
	if err != nil {
		return 0, 0, "", err
	}
	if err := q.CreateCompanyQuotaIfNotExists(ctx, companyID); err != nil {
		return 0, 0, "", err
	}

	status = r.DefaultStatus
	if status == "" {
		status = "pending"
	}

	// Create HR user with configured default status
	hrUserID, err = q.CreateHRUser(ctx, db.CreateHRUserParams{
		CompanyID:   companyID,
		TgUserID:    userID,
		TgUsername:  username,
		DisplayName: displayName,
		Role:        "recruiter",
		Status:      status,
	})
	if err != nil {
		return 0, 0, "", err
	}

	return hrUserID, companyID, status, nil
}
