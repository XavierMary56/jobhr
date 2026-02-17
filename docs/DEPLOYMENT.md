# Deployment (tg-hr-platform)

## Prerequisites
- Go 1.22+
- PostgreSQL 14+ (with extension pg_trgm)
- Redis (optional but recommended)

## Environment variables
- DATABASE_URL (required)
  - example: postgres://postgres:postgres@127.0.0.1:5432/tg_hr?sslmode=disable
- REDIS_ADDR (optional, default 127.0.0.1:6379)
- REDIS_PASSWORD (optional)
- JWT_SECRET (required in prod)
- ADDR (optional, default :8080)

## Database migration
1. Create database `tg_hr`
2. Run schema:
   - psql "$DATABASE_URL" -f docs/SCHEMA.sql
   or apply migrations in `migrations/`

## Run (dev)
1. cp .env.example .env (optional)
2. go mod tidy
3. go run ./cmd/server

## Docker Compose (recommended)
See `docs/docker-compose.yml` (you can create it from the snippet below):

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: tg_hr
    ports: ["5432:5432"]
  redis:
    image: redis:7
    ports: ["6379:6379"]
  app:
    build: .
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/tg_hr?sslmode=disable
      REDIS_ADDR: redis:6379
      JWT_SECRET: change-me
      ADDR: :8080
    ports: ["8080:8080"]
    depends_on: [db, redis]
```

## Production notes
- Put the API behind Nginx / Caddy with TLS.
- Set secure cookie flags for `hr_auth` (Secure + HttpOnly + SameSite=Lax/Strict).
- Consider separate read replica for heavy search later.
- Enable proper structured logging and audit log persistence.
