# API Documentation

Base URL: `/api`
Auth: Cookie `hr_auth` contains a JWT (HS256) with fields:
- hr_user_id (int)
- company_id (int)
- status (active/pending/blocked)
- role (optional)

## 1) List candidates
GET `/api/candidates`

Query params:
- q (string) keyword
- skill (string) single skill filter
- english (string) none/basic/working/fluent
- bc_experience (bool) true/false
- availability_days_max (int)
- salary_min (int)
- salary_max (int)
- page (int, default 1)
- page_size (int, default 20, max 100)

Response 200:
```json
{
  "items": [{
    "slug":"c_abc",
    "display_name":"匿名候选人#12",
    "desired_role":"PHP资深架构师",
    "english_level":"none",
    "expected_salary_min_cny":500000,
    "expected_salary_max_cny":700000,
    "availability_days":7,
    "timezone":"Asia/Shanghai",
    "bc_experience":false,
    "summary":"...",
    "unlocked_contact":false,
    "skills":["php","golang"]
  }]
}
```

## 2) Get candidate detail
GET `/api/candidates/:slug`

Response 200:
- same fields as CandidateCard
- if unlocked_contact=true, includes `contact` object

```json
{
  "slug":"c_abc",
  "display_name":"...",
  "unlocked_contact": true,
  "skills":["php"],
  "contact": { "tg_username":"xxx", "email":"", "phone":"" }
}
```

## 3) Unlock candidate contact
POST `/api/candidates/:slug/unlock`

Response:
- 200: returns contact object
- 402: { "error": "quota_exceeded" }
- 409: { "error": "quota_not_configured" }
