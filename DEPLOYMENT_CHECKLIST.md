# 快速参考 - 部署检查清单

## 📅 部署前检查列表

### 环境准备
- [ ] 已购买 DigitalOcean Droplet（2GB RAM, 2vCPU, Ubuntu 22.04 LTS）
- [ ] Droplet IP 地址：`__________________`
- [ ] DNS A 记录已指向 Droplet IP
- [ ] DNS 传播已完成（测试：`nslookup www.looksupermm.com`）

### 代码准备
- [ ] 代码已推送到 Git 仓库
- [ ] `.env.prod` 文件已配置
  - [ ] `DB_PASSWORD`: 已设置强秘密
  - [ ] `JWT_SECRET`: 已设置强秘密（≥32字符）
  - [ ] `TELEGRAM_BOT_TOKEN`: 已从 BotFather 获取
  - [ ] `TELEGRAM_BOT_USERNAME`: 已设置 Bot 用户名

### Telegram Bot 准备
- [ ] Bot 已在 BotFather 创建
- [ ] Bot Token：`__________________________________`
- [ ] Bot 用户名：`______________________`

---

## 🚀 部署步骤（快速版）

### 第一天

```bash
# 1. SSH 连接
ssh root@<YOUR_DROPLET_IP>

# 2. 创建用户和克隆代码
useradd -m -s /bin/bash deploy
su - deploy
git clone https://github.com/your/repo.git tg-hr-platform
cd tg-hr-platform

# 3. 配置环境变量
cp deploy/.env.prod .env.prod
nano .env.prod  # 编辑填入真实值

# 4. 运行自动部署脚本
chmod +x deploy/deploy.sh
bash deploy/deploy.sh
# 按提示输入邮箱地址
```

**预计时间：** 15-20 分钟

### 第二天

```bash
# 5. 配置 Telegram Bot Webhook
curl -X POST \
  "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://www.looksupermm.com/bot/webhook"

# 6. 验证部署
curl https://www.looksupermm.com/healthz
# 在浏览器打开 https://www.looksupermm.com
```

---

## ✅ 部署验证检查清单

### 应用可用性
- [ ] 前端页面可访问：`https://www.looksupermm.com`
- [ ] SSL 证书有效（浏览器显示绿色锁）
- [ ] 后端 API 响应 200：`curl https://www.looksupermm.com/healthz`

### Docker 容器
```bash
docker-compose -f docker-compose.prod.yml ps

# 验证结果：
# ✅ postgres - healthy
# ✅ redis - healthy
# ✅ backend - healthy
# ✅ frontend - healthy
```
- [ ] 所有 4 个容器都在运行
- [ ] 所有容器健康状态为 "healthy"

### Telegram Bot
- [ ] Webhook 已设置：`curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo" | jq .`
- [ ] Webhook URL 正确显示：`https://www.looksupermm.com/bot/webhook`
- [ ] 发送 `/start` 命令，Bot 返回消息和按钮
- [ ] 点击按钮，WebApp 在 Telegram 中打开

### 功能测试
- [ ] 登录功能工作（Telegram Bot → WebApp → 自动登录）
- [ ] 候选人列表可查看
- [ ] 账户页面显示用户信息和配额
- [ ] 管理员日志页面可访问

---

## 📊 部署后的常用命令

### 查看日志
```bash
cd ~/tg-hr-platform

# 查看所有日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart backend
```

### 更新代码
```bash
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 数据库备份
```bash
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres tg_hr > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 监控资源使用
```bash
docker stats
```

---

## 🆘 常见错误与解决

| 问题 | 症状 | 解决方案 |
|------|------|--------|
| DNS 未生效 | SSL 证书申请失败 | 等待 DNS 传播或通过 -skip-eff-email 重试 |
| 数据库连接失败 | 500 Internal Server Error | 检查 DB_PASSWORD，确保与 postgres 环境变量一致 |
| Webhook 无法连接 | Telegram 无法发送消息 | 验证 webhook URL 可访问：`curl https://www.looksupermm.com/bot/webhook` |
| 前端无法连接 API | CORS 错误或网络超时 | 检查 ALLOWED_ORIGINS 和 Nginx 配置 |
| 容器自动停止 | `docker ps` 不显示容器 | 查看日志：`docker logs <container_id>` |

---

## 📞 紧急联系方式

如果部署失败：

1. **收集诊断信息**
   ```bash
   docker-compose -f docker-compose.prod.yml logs > logs.txt
   # 分享 logs.txt
   ```

2. **常规调试步骤**
   ```bash
   # 1. 检查容器状态
   docker ps -a
   
   # 2. 重启并查看日志
   docker-compose -f docker-compose.prod.yml restart
   docker-compose -f docker-compose.prod.yml logs -f
   
   # 3. 测试网络连接
   curl -v https://www.looksupermm.com
   ```

3. **回滚上个版本**
   ```bash
   git checkout HEAD~1
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## 📈 性能优化建议

部署完成后：

- [ ] 配置 Redis 缓存策略
- [ ] 调整 Nginx worker_processes
- [ ] 启用 Gzip 压缩（已默认启用）
- [ ] 配置 CDN 加速（可选）
- [ ] 设置监控告警

---

## 🔐 安全检查清单

- [ ] JWT_SECRET 已更改（不是默认值）
- [ ] DB_PASSWORD 已更改（强秘密）
- [ ] COOKIE_SECURE=true（生产环境）
- [ ] ALLOWED_ORIGINS 仅包含你的域名
- [ ] SSH 密钥认证已配置
- [ ] 防火墙规则已配置（仅开放 22, 80, 443 端口）

---

## 📅 维护计划

- [ ] **每日：** 检查容器运行状态和磁盘空间
- [ ] **每周：** 创建数据库备份
- [ ] **每月：** 检查日志和更新系统包
- [ ] **每季度：** 安全审计和依赖更新

---

**部署时间戳：** ________________

**部署人员：** ________________

**联系信息：** ________________
