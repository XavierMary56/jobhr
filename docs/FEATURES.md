# Feature checklist (MVP)

## Auth / Access control
- [x] HR auth via JWT cookie `hr_auth`
- [x] pending/blocked gating (403 with error code)
- [ ] Telegram login handshake (to add)

## Candidate browsing
- [x] Candidate list endpoint with filters (english/bc/avail/salary)
- [x] Candidate detail endpoint
- [x] Skills attached to list & detail (batch query + Redis cache)

## Unlocking
- [x] Idempotent unlock (unique company_id + candidate_id + unlock_type)
- [x] Quota check + deduct only on first unlock
- [x] Returns contact after unlock

## Caching
- [x] Redis cache for candidate skills per candidate_id (24h TTL)
- [ ] Optional Redis set for company unlocks (later)

## Observability
- [x] /healthz
- [ ] audit_logs integration (stubbed)

## Payment
- [ ] Plans + USDT payment integration (future)
