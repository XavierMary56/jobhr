package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"tg-hr-platform/internal/domain"
	"tg-hr-platform/internal/http/middleware"
	"tg-hr-platform/internal/service"

	"github.com/gin-gonic/gin"
)

type AuditSvc interface {
    LogHR(c *gin.Context, hrUserID int64, action, targetType, targetID string, meta map[string]any)
}

type CandidateHandler struct {
    Svc   *service.CandidateService
    Audit AuditSvc
}

func (h *CandidateHandler) List(c *gin.Context) {
    claims := c.MustGet(middleware.CtxHRClaimsKey).(*domain.HRClaims)

    page, pageSize, limit, offset := parsePagination(c)

    filter := domain.CandidateListFilter{
        CompanyID: claims.CompanyID,
        Q:         strPtr(c.Query("q")),
        Skill:     strPtr(c.Query("skill")),
        English:   strPtr(c.Query("english")),
        BC:        boolPtrFromQuery(c, "bc_experience"),
        AvailMax:  int32PtrFromQuery(c, "availability_days_max"),
        SalaryMin: int32PtrFromQuery(c, "salary_min"),
        SalaryMax: int32PtrFromQuery(c, "salary_max"),
        Limit:     limit,
        Offset:    offset,
    }

    items, err := h.Svc.ListCandidates(c.Request.Context(), filter)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "internal"})
        return
    }

    if h.Audit != nil {
        h.Audit.LogHR(c, claims.HRUserID, "candidate.list", "company", strconv.FormatInt(claims.CompanyID, 10),
            map[string]any{"page": page, "page_size": pageSize})
    }

    c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *CandidateHandler) Get(c *gin.Context) {
    claims := c.MustGet(middleware.CtxHRClaimsKey).(*domain.HRClaims)
    slug := c.Param("slug")

    d, err := h.Svc.GetCandidateDetail(c.Request.Context(), claims.CompanyID, slug)
    if err != nil {
        if errors.Is(err, domain.ErrNotFound) {
            c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": "internal"})
        return
    }

    if h.Audit != nil {
        h.Audit.LogHR(c, claims.HRUserID, "candidate.view", "candidate", slug, nil)
    }

    c.JSON(http.StatusOK, d)
}

func (h *CandidateHandler) Unlock(c *gin.Context) {
    claims := c.MustGet(middleware.CtxHRClaimsKey).(*domain.HRClaims)
    slug := c.Param("slug")

    contact, err := h.Svc.UnlockContact(c.Request.Context(), claims.CompanyID, claims.HRUserID, slug)
    if err != nil {
        if errors.Is(err, domain.ErrQuotaExceeded) {
            c.JSON(http.StatusPaymentRequired, gin.H{"error": "quota_exceeded"})
            return
        }
        if errors.Is(err, domain.ErrQuotaNotConfigured) {
            c.JSON(http.StatusConflict, gin.H{"error": "quota_not_configured"})
            return
        }
        if errors.Is(err, domain.ErrNotFound) {
            c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": "internal"})
        return
    }

    if h.Audit != nil {
        h.Audit.LogHR(c, claims.HRUserID, "candidate.unlock", "candidate", slug, nil)
    }

    c.JSON(http.StatusOK, contact)
}
