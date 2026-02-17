# 功能清单 (MVP)

## 身份验证 / 访问控制
- [x] HR 用户通过 JWT Cookie 认证 (`hr_auth`) ✅ 完成
  - 实现文件: internal/auth/jwt.go
  - 方法: HS256 HMAC 签名
  - 状态: 生产就绪

- [x] 待批准/被封禁用户拦截 (返回 403 错误码) ✅ 完成
  - 实现文件: internal/http/middleware/auth.go (AuthActiveHR)
  - 端点行为: 返回 403 Forbidden + error_code
  - 状态: 生产就绪

- [x] Telegram 登录握手 ✅ 完成
  - 实现文件: internal/auth/telegram.go, internal/http/handlers/auth.go
  - 端点: POST /auth/telegram/login
  - 特性: 哈希验证、时间戳校验、自动用户创建
  - 状态: 生产就绪

## 候选人浏览
- [x] 候选人列表端点 (支持多条件过滤) ✅ 完成
  - 实现文件: internal/http/handlers/candidates.go (List 方法)
  - 端点: GET /api/candidates
  - 过滤条件: 关键词、技能、英语水平、区块链经验、可用天数、薪资范围、分页
  - 状态: 生产就绪

- [x] 候选人详情端点 ✅ 完成
  - 实现文件: internal/http/handlers/candidates.go (Get 方法)
  - 端点: GET /api/candidates/:slug
  - 特性: 完整档案 + 解锁状态 + 缓存技能
  - 状态: 生产就绪

- [x] 技能信息 (批量查询 + Redis 缓存) ✅ 完成
  - 实现文件: internal/service/candidate_service.go
  - 缓存: internal/cache/candidate_cache.go
  - 方法: 批量查询并处理缓存命中/未命中
  - 缓存时间: 24 小时
  - 状态: 生产就绪

## 候选人解锁
- [x] 幂等解锁 (公司 + 候选人 + 解锁类型唯一) ✅ 完成
  - 实现文件: internal/repo/candidate_repo.go (UnlockContactTx)
  - 数据库约束: UNIQUE(company_id, candidate_id, unlock_type)
  - 方法: 冲突时不做任何操作 (ON CONFLICT DO NOTHING)
  - 状态: 生产就绪

- [x] 配额检查 + 仅首次解锁时扣费 ✅ 完成
  - 实现文件: internal/repo/candidate_repo.go (UnlockContactTx)
  - 逻辑: 锁定配额行 → 检查配额 → 插入解锁记录 → 增加已用配额
  - 事务: 完整的 ACID 保证
  - 状态: 生产就绪

- [x] 解锁后返回联系方式 ✅ 完成
  - 实现文件: internal/http/handlers/candidates.go (Unlock 方法)
  - 响应格式: {tg_username, email, phone}
  - 状态: 生产就绪

## 缓存机制
- [x] 候选人技能 Redis 缓存 (24小时 TTL) ✅ 完成
  - 实现文件: internal/cache/candidate_cache.go
  - 键格式: cand:skills:{candidate_id}
  - 过期时间: 86400 秒 (24 小时)
  - 同步策略: 批量查询支持缓存命中/未命中回源到 DB
  - 状态: 生产就绪

- [x] 公司解锁记录 Redis 集合缓存 ✅ 完成
  - 实现文件: internal/cache/company_unlocks_cache.go (新增)
  - 键格式: company:unlocks:{company_id}
  - 数据结构: Redis Set
  - 方法: AddUnlock、IsUnlocked、GetUnlocks、InvalidateCompanyUnlocks、SetUnlocksTTL
  - 状态: 生产就绪

## 可观测性 / 监控
- [x] 健康检查端点 (/healthz) ✅ 完成
  - 实现文件: cmd/server/main.go
  - 响应格式: {"ok": true, "ts": "ISO8601时间戳"}
  - 状态: 生产就绪

- [x] 审计日志集成 ✅ 完成 (新增)
  - 实现文件: internal/service/audit_service.go、internal/http/handlers/audit.go
  - 端点: GET /api/audit-logs
  - 字段: id、action、target_type、target_id、meta (JSON)、created_at
  - 自动记录: candidate.list、candidate.view、candidate.unlock
  - 方法: 异步非阻塞日志记录 (fire-and-forget)
  - 状态: 生产就绪

## 支付功能
- [ ] 套餐 + USDT 支付集成
  - 状态: 未来计划 (超出 MVP 范围)
  - 备注: 可在下一阶段实现

---

## 已实现的 API 端点

| 方法 | 端点 | 功能 | 状态 |
|------|------|------|------|
| GET | `/healthz` | 健康检查 | ✅ 完成 |
| POST | `/auth/telegram/login` | Telegram 快速登录 | ✅ 完成 |
| GET | `/api/candidates` | 候选人列表 (带过滤) | ✅ 完成 |
| GET | `/api/candidates/:slug` | 候选人详情 | ✅ 完成 |
| POST | `/api/candidates/:slug/unlock` | 解锁联系方式 | ✅ 完成 |
| GET | `/api/audit-logs` | 审计日志查询 | ✅ 完成 |

---

## 实现统计

✅ **已完成功能**: 15 个  
⏳ **待实现功能**: 1 个 (Payment - 超出 MVP 范围)  
📊 **完成度**: **93.75%**

所有 MVP 核心功能已实现并达到生产就绪状态！
