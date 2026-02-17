package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"

	"tg-hr-platform/internal/domain"
	"tg-hr-platform/internal/http/middleware"
	"tg-hr-platform/internal/service"
)

type AuditLogHandler struct {
	Svc *service.AuditLogService
}

// GetAuditLogs retrieves audit logs for a company
// GET /api/audit-logs
func (h *AuditLogHandler) GetAuditLogs(c *gin.Context) {
	claims := c.MustGet(middleware.CtxHRClaimsKey).(*domain.HRClaims)

	page, pageSize, limit, offset := parsePagination(c)

	logs, err := h.Svc.GetAuditLogs(c.Request.Context(), claims.CompanyID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal"})
		return
	}

	// Transform to response format
	items := make([]map[string]any, 0, len(logs))
	for _, log := range logs {
		var meta map[string]any
		_ = json.Unmarshal(log.Meta, &meta)

		items = append(items, map[string]any{
			"id":          log.ID,
			"action":      log.Action,
			"target_type": log.TargetType,
			"target_id":   log.TargetID,
			"meta":        meta,
			"created_at":  log.CreatedAt.Time.Format("2006-01-02T15:04:05Z"),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"items":      items,
		"page":       page,
		"page_size":  pageSize,
		"total":      len(items),
	})
}
