
-- name: FindHRUserByTelegramID :one
SELECT id, company_id, status, role
FROM hr_users
WHERE tg_user_id = sqlc.arg('tg_user_id')
LIMIT 1;

-- name: GetHRUserByID :one
SELECT id, company_id, status, role, display_name, tg_username
FROM hr_users
WHERE id = sqlc.arg('id')
LIMIT 1;

-- name: CreateHRUser :one
INSERT INTO hr_users (company_id, tg_user_id, tg_username, display_name, role, status)
VALUES (sqlc.arg('company_id'), sqlc.arg('tg_user_id'), sqlc.arg('tg_username'), sqlc.arg('display_name'), sqlc.arg('role'), sqlc.arg('status'))
RETURNING id;

-- name: CreateDefaultCompany :one
INSERT INTO companies (name, status)
VALUES (gen_random_uuid()::text, 'active')
RETURNING id;

-- name: UpdateHRUserStatus :exec
UPDATE hr_users
SET status = sqlc.arg('status'), updated_at = now()
WHERE id = sqlc.arg('id');
