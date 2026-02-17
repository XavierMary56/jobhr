
-- name: InsertAuditLog :exec
INSERT INTO audit_logs (company_id, hr_user_id, action, target_type, target_id, meta, created_at)
VALUES (sqlc.arg('company_id'), sqlc.arg('hr_user_id'), sqlc.arg('action'), sqlc.arg('target_type'), sqlc.arg('target_id'), sqlc.arg('meta'), now());

-- name: GetAuditLogs :many
SELECT id, company_id, hr_user_id, action, target_type, target_id, meta, created_at
FROM audit_logs
WHERE company_id = sqlc.arg('company_id')
ORDER BY created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');
