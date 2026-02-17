# tg-hr-platform (MVP)

This is a clean, maintainable backend skeleton for:
- HR browsing candidates with strong filtering
- Unlocking candidate contact with quotas
- Redis caching for skills
- Next.js frontend can call `/api/candidates`, `/api/candidates/:slug`, `/api/candidates/:slug/unlock`

Docs:
- docs/SCHEMA.sql
- docs/API.md
- docs/DEPLOYMENT.md
- docs/FEATURES.md

## Quick start
1) Start Postgres + Redis
2) Apply schema: `psql "$DATABASE_URL" -f docs/SCHEMA.sql`
3) Run: `go run ./cmd/server`

Note: This repo is structured to be sqlc-friendly. For production, generate db access code using sqlc.yaml + internal/db/queries.
