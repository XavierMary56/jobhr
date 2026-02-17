-- name: LockCompanyQuota :one
SELECT company_id, unlock_quota_total, unlock_quota_used
FROM company_quotas
WHERE company_id = sqlc.arg('company_id')
FOR UPDATE;

-- name: IncrementCompanyQuotaUsed :exec
UPDATE company_quotas
SET unlock_quota_used = unlock_quota_used + sqlc.arg('delta'),
    updated_at = now()
WHERE company_id = sqlc.arg('company_id');
