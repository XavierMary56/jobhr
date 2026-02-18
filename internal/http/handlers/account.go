package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"tg-hr-platform/internal/db"
	"tg-hr-platform/internal/domain"
	"tg-hr-platform/internal/http/middleware"
	"tg-hr-platform/internal/util"
)

type AccountHandler struct {
    Q *db.Queries
}

func NewAccountHandler(q *db.Queries) *AccountHandler {
    return &AccountHandler{Q: q}
}

// GetMe returns current HR user profile, company info, and quota
// GET /api/me
func (h *AccountHandler) GetMe(c *gin.Context) {
    claims := c.MustGet(middleware.CtxHRClaimsKey)
    hrClaims := claims.(*domain.HRClaims)

    ctx := c.Request.Context()

    hrUser, err := h.Q.GetHRUserByID(ctx, hrClaims.HRUserID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "internal"})
        return
    }

    company, err := h.Q.GetCompanyByID(ctx, hrClaims.CompanyID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "internal"})
        return
    }

    quotaConfigured := true
    quota, err := h.Q.GetCompanyQuotaDetail(ctx, hrClaims.CompanyID)
    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            quotaConfigured = false
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal"})
            return
        }
    }

    periodStart := formatDate(quota.PeriodStart)
    periodEnd := formatDate(quota.PeriodEnd)

    remaining := int32(0)
    if quotaConfigured {
        remaining = quota.UnlockQuotaTotal - quota.UnlockQuotaUsed
        if remaining < 0 {
            remaining = 0
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "user": gin.H{
            "id":          hrUser.ID,
            "company_id":  hrUser.CompanyID,
            "status":      hrUser.Status,
            "role":        hrUser.Role,
            "display_name": hrUser.DisplayName,
            "tg_username": util.TextOrEmpty(hrUser.TgUsername),
        },
        "company": gin.H{
            "id":     company.ID,
            "name":   company.Name,
            "status": company.Status,
        },
        "quota": gin.H{
            "configured":           quotaConfigured,
            "unlock_quota_total":   quota.UnlockQuotaTotal,
            "unlock_quota_used":    quota.UnlockQuotaUsed,
            "unlock_quota_remaining": remaining,
            "period_start":         periodStart,
            "period_end":           periodEnd,
        },
    })
}

func formatDate(d pgtype.Date) string {
    if d.Valid {
        return d.Time.Format("2006-01-02")
    }
    return ""
}
