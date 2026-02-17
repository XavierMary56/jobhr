package service

import (
	"context"
	"encoding/json"

	"github.com/gin-gonic/gin"

	"tg-hr-platform/internal/db"
)

type AuditLogService struct {
	Q *db.Queries
}

// LogHR logs an HR action to the audit log
func (s *AuditLogService) LogHR(c *gin.Context, hrUserID int64, action, targetType, targetID string, meta map[string]any) {
	// Extract company ID from context if available
	companyID := int64(0)
	if v, ok := c.Get("company_id"); ok {
		if cid, ok := v.(int64); ok {
			companyID = cid
		}
	}

	metaJSON := []byte("{}")
	if meta != nil {
		if b, err := json.Marshal(meta); err == nil {
			metaJSON = b
		}
	}

	// Non-blocking log insert (fire and forget)
	go func() {
		_ = s.Q.InsertAuditLog(context.Background(), db.InsertAuditLogParams{
			CompanyID:  companyID,
			HrUserID:   hrUserID,
			Action:     action,
			TargetType: targetType,
			TargetID:   targetID,
			Meta:       metaJSON,
		})
	}()
}

// GetAuditLogs retrieves audit logs for a company
func (s *AuditLogService) GetAuditLogs(ctx context.Context, companyID int64, limit, offset int32) ([]db.GetAuditLogsRow, error) {
	return s.Q.GetAuditLogs(ctx, db.GetAuditLogsParams{
		CompanyID: companyID,
		Limit:     limit,
		Offset:    offset,
	})
}
