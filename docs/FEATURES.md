# Feature checklist (MVP)

## Auth / Access control
- [x] HR auth via JWT cookie `hr_auth` ✅ DONE
  - Implementation: internal/auth/jwt.go
  - Method: HS256 HMAC signing
  - Status: Production-ready

- [x] pending/blocked gating (403 with error code) ✅ DONE
  - Implementation: internal/http/middleware/auth.go (AuthActiveHR)
  - Endpoint behavior: Returns 403 Forbidden + error_code
  - Status: Production-ready

- [x] Telegram login handshake ✅ DONE
  - Implementation: internal/auth/telegram.go, internal/http/handlers/auth.go
  - Endpoint: POST /auth/telegram/login
  - Features: Hash verification, timestamp validation, auto user creation
  - Status: Production-ready

## Candidate browsing
- [x] Candidate list endpoint with filters (english/bc/avail/salary) ✅ DONE
  - Implementation: internal/http/handlers/candidates.go (List method)
  - Endpoint: GET /api/candidates
  - Filters: q, skill, english, bc_experience, availability_days_max, salary_min/max, page, page_size
  - Status: Production-ready

- [x] Candidate detail endpoint ✅ DONE
  - Implementation: internal/http/handlers/candidates.go (Get method)
  - Endpoint: GET /api/candidates/:slug
  - Features: Full profile + unlock status + cached skills
  - Status: Production-ready

- [x] Skills attached to list & detail (batch query + Redis cache) ✅ DONE
  - Implementation: internal/service/candidate_service.go
  - Caching: internal/cache/candidate_cache.go
  - Method: Batch query with Redis hit/miss handling
  - TTL: 24 hours
  - Status: Production-ready

## Unlocking
- [x] Idempotent unlock (unique company_id + candidate_id + unlock_type) ✅ DONE
  - Implementation: internal/repo/candidate_repo.go (UnlockContactTx)
  - DB Constraint: UNIQUE(company_id, candidate_id, unlock_type)
  - Method: ON CONFLICT DO NOTHING pattern
  - Status: Production-ready

- [x] Quota check + deduct only on first unlock ✅ DONE
  - Implementation: internal/repo/candidate_repo.go (UnlockContactTx)
  - Logic: Lock row → Check quota → Insert unlock → Increment quota_used
  - Transaction: Full ACID compliance
  - Status: Production-ready

- [x] Returns contact after unlock ✅ DONE
  - Implementation: internal/http/handlers/candidates.go (Unlock method)
  - Response: {tg_username, email, phone}
  - Status: Production-ready

## Caching
- [x] Redis cache for candidate skills per candidate_id (24h TTL) ✅ DONE
  - Implementation: internal/cache/candidate_cache.go
  - Key format: cand:skills:{candidate_id}
  - TTL: 86400 seconds (24 hours)
  - Sync: GetSkillsBatch with fallback to DB
  - Status: Production-ready

- [x] Optional Redis set for company unlocks ✅ DONE
  - Implementation: internal/cache/company_unlocks_cache.go (NEW)
  - Key format: company:unlocks:{company_id}
  - Type: Redis Set
  - Methods: AddUnlock, IsUnlocked, GetUnlocks, InvalidateCompanyUnlocks, SetUnlocksTTL
  - Status: Production-ready

## Observability
- [x] /healthz ✅ DONE
  - Implementation: cmd/server/main.go
  - Response: {"ok": true, "ts": "ISO8601"}
  - Status: Production-ready

- [x] audit_logs integration ✅ DONE (NEW)
  - Implementation: internal/service/audit_service.go, internal/http/handlers/audit.go
  - Endpoint: GET /api/audit-logs
  - Fields: id, action, target_type, target_id, meta (JSON), created_at
  - Auto-logging: candidate.list, candidate.view, candidate.unlock
  - Method: Fire-and-forget async logging
  - Status: Production-ready

## Payment
- [ ] Plans + USDT payment integration
  - Status: Future (out of MVP scope)
  - Note: Can be implemented in next phase
