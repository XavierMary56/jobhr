# DigitalOcean 部署完整指南

## 📋 目录

1. [前期准备](#前期准备)
2. [服务器初始化](#服务器初始化)
3. [一键部署](#一键部署)
4. [Telegram Bot 配置](#telegram-bot-配置)
5. [验证部署](#验证部署)
6. [维护和监控](#维护和监控)
7. [常见问题](#常见问题)

---

## 前期准备

### 1. 购买 DigitalOcean Droplet

**地理位置选择：**
- Singapore（亚洲用户推荐）
- 或 Frankfurt/London（欧洲用户）

**配置选择：**
- memory: 2GB RAM
- vCPU: 2 核心
- Storage: 50GB SSD
- OS: Ubuntu 22.04 LTS

**估算费用：** $7.99 USD/月（约 ¥57 元）

### 2. 配置域名 DNS

在你的域名注册商（如 Namecheap、GoDaddy 等）的 DNS 管理中：

```
记录类型: A
名称: @ (或 www)
值: <DigitalOcean Droplet 的 IP 地址>
TTL: 3600
```

也添加一个 CNAME 记录（可选）：
```
记录类型: CNAME
名称: www
值: looksupermm.com
```

**验证 DNS 配置：**
```bash
nslookup www.looksupermm.com
# 应该返回你的 Droplet IP 地址
```

### 3. 获取 SSH 访问权限

在 DigitalOcean 控制面板：
1. 创建 Droplet 时选择 "SSH Key" 认证方式
2. 或设置 Root Password，稍后通过 SSH 访问

### 4. 准备 Git 仓库（推荐）

如果代码在 Git 仓库中（GitHub/GitLab）：
- 确保代码已 push 到主分支
- 生成部署用的 SSH Key（在 Droplet 上）
- 在仓库设置中配置公钥

---

## 服务器初始化

### 第一步：SSH 连接到 Droplet

```bash
# 使用 SSH Key
ssh -i /path/to/your/key root@your_droplet_ip

# 或使用密码（首次登录）
ssh root@your_droplet_ip
```

### 第二步：创建非 root 用户（安全最佳实践）

```bash
# 创建新用户
useradd -m -s /bin/bash deploy

# 设置密码
passwd deploy

# 给予 sudo 权限
usermod -aG sudo deploy

# 配置 SSH Key 认证（可选但推荐）
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# 切换到新用户
su - deploy
```

### 第三步：克隆项目代码

```bash
# 使用 HTTPS（需要输入 GitHub Token）
git clone https://github.com/your-username/tg-hr-platform.git

# 或使用 SSH（需要 SSH Key）
git clone git@github.com:your-username/tg-hr-platform.git

cd tg-hr-platform
```

### 第四步：配置环境变量

```bash
# 复制示例配置
cp deploy/.env.prod .env.prod

# 编辑环境文件
nano .env.prod
# 或 vim .env.prod
```

在 `.env.prod` 中修改以下至关重要的值：

```dotenv
# 数据库密码（设置强密码，至少16个字符）
DB_PASSWORD=your-very-strong-database-password-here

# JWT 密钥（用于签署 Token，必须强秘密，至少32个字符）
JWT_SECRET=your-very-strong-jwt-secret-key-minimum-32-characters-here

# Telegram Bot Token（从 BotFather 获取）
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk

# Bot 用户名
TELEGRAM_BOT_USERNAME=your_bot_username

# 支持邮箱
SUPPORT_EMAIL=admin@looksupermm.com
```

**生成强密钥的命令：**
```bash
# 生成 32 个字符的随机密钥
openssl rand -base64 24
```

---

## 一键部署

### 运行部署脚本

```bash
# 进入项目目录
cd ~/tg-hr-platform

# 给脚本执行权限
chmod +x deploy/deploy.sh

# 运行部署脚本
bash deploy/deploy.sh
```

脚本会自动执行以下步骤：

1. ✅ 更新系统
2. ✅ 安装 Docker & Docker Compose
3. ✅ 安装 Nginx & Certbot
4. ✅ 配置 Nginx 反向代理
5. ✅ 申请 Let's Encrypt SSL 证书
6. ✅ 启动所有 Docker 容器
7. ✅ 运行数据库迁移
8. ✅ 配置自动备份（可选）

**脚本运行期间需要输入的信息：**

- 邮箱地址（用于 Let's Encrypt 通知）
- 是否添加自动备份（推荐选 yes）

### 手动步骤（如果脚本失败）

如果脚本执行失败，可以手动执行以下步骤：

```bash
# 1. 构建 Docker 镜像
docker-compose -f docker-compose.prod.yml build

# 2. 启动容器
docker-compose -f docker-compose.prod.yml up -d

# 3. 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Telegram Bot 配置

### 步骤 1：在 BotFather 设置 Webhook

获取部署信息后：

```bash
# 1. 获取 Droplet IP 地址（已知：即 www.looksupermm.com）

# 2. 在本地终端执行（替换你的 Bot Token）
curl -X POST \
  "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://www.looksupermm.com/bot/webhook"

# 例如：
curl -X POST \
  "https://api.telegram.org/bot123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk/setWebhook" \
  -d "url=https://www.looksupermm.com/bot/webhook"
```

### 步骤 2：验证 Webhook 已设置

```bash
# 检查 webhook 信息
curl -X POST \
  "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# 返回应该显示：
# "ok": true,
# "result": {
#   "url": "https://www.looksupermm.com/bot/webhook",
#   "has_custom_certificate": false,
#   "pending_update_count": 0
# }
```

### 步骤 3：设置 Bot 命令菜单

```bash
curl -X POST \
  "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "打开招聘平台"}
    ]
  }'
```

---

## 验证部署

### 1. 检查前端应用

在浏览器中打开：
```
https://www.looksupermm.com
```

应该看到：
- ✅ 绿色的安全锁标志（SSL 有效）
- ✅ 登录页面加载成功
- ✅ 显示 "请在 Telegram 中打开此链接"

### 2. 检查后端 API

```bash
# 测试健康检查端点
curl -i https://www.looksupermm.com/healthz

# 应返回 200 的 JSON 响应
# {"ok":true,"ts":"2026-02-18T..."}
```

### 3. 检查 Docker 容器

```bash
# 在 Droplet 上执行
cd ~/tg-hr-platform
docker-compose -f docker-compose.prod.yml ps

# 应该显示 4 个运行中的容器：
# - tg_hr_postgres (healthy)
# - tg_hr_redis (healthy)
# - tg_hr_backend (healthy)
# - tg_hr_frontend (healthy)
```

### 4. 测试 Telegram Bot

1. 打开 Telegram 搜索你的 Bot
2. 点击 "Start" 或发送 `/start` 命令
3. Bot 应该返回一条消息和"打开招聘平台"按钮
4. 点击按钮，应该在 Telegram WebApp 中打开应用
5. 自动登录，进入候选人列表页面

### 5. 检查日志

```bash
# 查看所有容器日志
docker-compose -f docker-compose.prod.yml logs

# 实时查看特定容器日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 维护和监控

### 常用命令

```bash
# 查看容器状态
cd ~/tg-hr-platform
docker-compose -f docker-compose.prod.yml ps

# 重启应用
docker-compose -f docker-compose.prod.yml restart

# 拉取最新代码并重新部署
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 查看数据库连接
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "\l"

# 备份数据库
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres tg_hr > backup_$(date +%Y%m%d_%H%M%S).sql

# 还原数据库
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres tg_hr < backup_file.sql
```

### 监控磁盘空间

```bash
# 检查磁盘使用情况
df -h

# 检查 Docker 容器大小
docker ps -a --format "{{.Names}}" | xargs -I {} docker inspect {} | grep -E '"_id"|SizeRw|SizeRootFs' 

# 清理 Docker 缓存（谨慎使用）
docker system prune -a
```

### 监控日志大小

```bash
# 查看 Docker 日志大小
du -sh ~/tg-hr-platform/logs

# 如果日志过大，可以清理
truncate -s 0 ~/tg-hr-platform/logs/*
```

### 自动续期 SSL 证书

```bash
# 验证自动续期任务是否运行
sudo systemctl status certbot.timer

# 手动续期（测试）
sudo certbot renew --dry-run

# 强制续期
sudo certbot renew --force-renewal
```

---

## 常见问题

### Q1: 部署脚本失败，如何调试？

**A:** 查看具体错误信息：

```bash
# 查看脚本输出
bash deploy/deploy.sh 2>&1 | tee deploy.log

# 查看 Docker 构建日志
docker-compose -f docker-compose.prod.yml build --no-cache 2>&1 | tee build.log
```

### Q2: SSL 证书申请失败

**A:** 常见原因和解决方案：

1. **DNS 未生效** - 等待 DNS 传播（TTLXL可能需要 24 小时）
2. **Nginx 未运行** - 手动启动：`sudo systemctl start nginx`
3. **端口 80 被占用** - 检查：`sudo lsof -i :80`

**重试申请：**
```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d www.looksupermm.com \
  -d looksupermm.com \
  --non-interactive --agree-tos -m your-email@example.com
```

### Q3: 后端返回 500 错误

**A:** 检查后端日志：

```bash
docker-compose -f docker-compose.prod.yml logs backend

# 常见原因：
# - 数据库连接失败 → 检查 DB_PASSWORD
# - JWT_SECRET 未设置 → 检查 .env 文件
# - Telegram Bot Token 无效 → 验证 TELEGRAM_BOT_TOKEN
```

### Q4: Telegram Bot 无法接收消息

**A:** 检查 webhook 配置：

```bash
# 验证 webhook 是否正确设置
curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo" | jq .

# 查看 webhook 日志
docker-compose -f docker-compose.prod.yml logs backend | grep webhook

# 手动发送测试请求
curl -X POST https://www.looksupermm.com/bot/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id":123,"message":{"message_id":1,"from":{"id":123,"first_name":"Test"},"chat":{"id":123},"text":"/start","date":1234567890}}'
```

### Q5: 前端无法连接后端 API

**A:** 检查 CORS 和代理配置：

```bash
# 测试 API 可访问性
curl -i https://www.looksupermm.com/api/healthz
curl -i https://www.looksupermm.com/healthz

# 检查浏览器控制台是否有 CORS 错误
# 查看 Nginx 日志
sudo grep api /var/log/nginx/error.log
```

### Q6: 数据库持久化问题

**A:** 验证数据卷：

```bash
# 查看 Docker volumes
docker volume ls

# 检查数据卷位置
docker volume inspect tg_hr_platform_postgres_data

# 手动备份数据卷
docker run --rm -v tg_hr_platform_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Q7: 容器自动停止

**A:** 检查容器健康状态：

```bash
# 查看容器详细信息
docker inspect <container_id>

# 查看exit code（0表示正常退出）
docker ps -a

# 重启容器
docker-compose -f docker-compose.prod.yml restart <service_name>

# 查看内存使用
docker stats
```

### Q8: 如何更新代码？

**A:** 标准更新流程：

```bash
cd ~/tg-hr-platform

# 1. 拉取最新代码
git pull origin main

# 2. 重新构建（可选，仅当依赖/配置改变）
docker-compose -f docker-compose.prod.yml build

# 3. 重启服务
docker-compose -f docker-compose.prod.yml up -d

# 4. 验证
docker-compose -f docker-compose.prod.yml ps
curl https://www.looksupermm.com/healthz
```

### Q9: 如何回滚到上个版本？

**A:** 使用 Git 标签或提交 ID：

```bash
# 查看历史提交
git log --oneline

# 回到上个版本
git checkout HEAD~1  # 或 git checkout <commit_id>

# 重新构建和启动
docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up -d

# 返回最新版本
git checkout main
```

---

## 📞 获取帮助

如果遇到问题：

1. 检查日志：`docker-compose -f docker-compose.prod.yml logs -f`
2. 查看 Nginx 错误：`sudo tail -f /var/log/nginx/error.log`
3. 验证配置：检查 `.env` 和 `nginx.conf`
4. 测试连接：`curl -v https://www.looksupermm.com`

---

## 📊 下一步建议

1. **配置监控告警**
   - 使用 Prometheus & Grafana 监控容器和系统
   - 配置告警规则（CPU/内存/磁盘超过阈值）

2. **配置备份策略**
   - 每日自动备份数据库
   - 每周备份到 S3 或其他云存储

3. **优化性能**
   - 配置 Redis 缓存
   - 启用 CDN 加速静态资源
   - 调整数据库连接池大小

4. **安全加固**
   - 启用 Fail2Ban 防暴力攻击
   - 配置 WAF（Web Application Firewall）
   - 定期安全审计和补丁

祝部署顺利！🚀
