# 部署配置文件清单

## 📦 生成的部署文件

你的项目现在包含以下部署配置文件：

### 核心配置文件

| 文件 | 位置 | 用途 |
|------|------|------|
| `docker-compose.prod.yml` | 项目根目录 | 生产环境 Docker Compose 配置 |
| `backend.Dockerfile` | 项目根目录 | 后端构建文件 |
| `frontend/Dockerfile` | 前端目录 | 前端构建文件（多阶段构建） |
| `deploy/nginx.conf` | deploy/ | Nginx 反向代理配置 |
| `deploy/.env.prod` | deploy/ | 环境变量模板 |

### 部署脚本

| 文件 | 位置 | 用途 |
|------|------|------|
| `deploy/deploy.sh` | deploy/ | 自动化一键部署脚本 |
| `deploy/monitor.sh` | deploy/ | 定期监控脚本 |

### 文档

| 文件 | 位置 | 用途 |
|------|------|------|
| `DEPLOYMENT_GUIDE.md` | 项目根目录 | 详细部署指南（中文）|
| `DEPLOYMENT_CHECKLIST.md` | 项目根目录 | 部署检查清单 |
| `DEPLOYMENT_FILES.md` | 项目根目录 | 本文件 |

---

## 🎯 快速开始（3 步）

### 第 1 步：准备信息

你需要准备：
- DigitalOcean Droplet IP 地址
- 域名：`www.looksupermm.com`
- Telegram Bot Token（从 BotFather 获取）
- 接收告警的邮箱地址

### 第 2 步：上传代码到服务器

```bash
# 在你本地电脑上

# 方案 A：使用 Git
git add deploy/
git commit -m "Add production deployment configuration"
git push origin main

# 然后在服务器上克隆
ssh root@<DROPLET_IP>
git clone https://github.com/your/repo.git tg-hr-platform
```

### 第 3 步：运行部署脚本

```bash
# 在服务器上

cd ~/tg-hr-platform

# 配置环境变量
cp deploy/.env.prod .env.prod
nano .env.prod  # 填入真实值

# 运行一键部署
chmod +x deploy/deploy.sh
bash deploy/deploy.sh
```

---

## 📋 文件详解

### docker-compose.prod.yml

**包含 4 个服务：**

1. **PostgreSQL** (postgres)
   - 数据库服务
   - 数据持久化在 volume `postgres_data`
   - 自动健康检查

2. **Redis** (redis)
   - 缓存服务
   - 数据持久化在 volume `redis_data`
   - 配置了 AOF 持久化

3. **后端应用** (backend)
   - Go 应用，监听 8080 端口
   - 自动健康检查 `/healthz` 端点
   - 环境变量从 `.env.prod` 读取
   - 日志挂载到 `./logs`

4. **前端应用** (frontend)
   - Next.js 应用，监听 3000 端口
   - 生产模式启动（npm start）
   - 环境变量注入到 Docker build args

**关键特性：**
- ✅ 健康检查（health checks）
- ✅ 依赖关系管理（depends_on）
- ✅ 自定义网络（bridge）
- ✅ 命名 volumes 实现数据持久化
- ✅ 环境变量外部化

### backend.Dockerfile

**多阶段构建：**

1. **Builder 阶段**
   - 使用 golang:1.21-alpine
   - 下载依赖、编译二进制
   - 产物：`server` 可执行文件

2. **Final 阶段**
   - 使用 alpine:latest（小镜像）
   - 只复制编译后的二进制
   - 最终镜像大小 ~50MB

**特点：**
- ✅ 镜像大小优化
- ✅ 安全更新（Final 阶段包含新的安全补丁）
- ✅ 健康检查
- ✅ 非 root 用户（如需要可添加）

### frontend/Dockerfile

**多阶段构建：**

1. **Builder 阶段**
   - 使用 node:20-alpine
   - 使用 npm ci 更新依赖
   - 编译 Next.js（npm run build）
   - 产物：`.next` 目录

2. **Final 阶段**
   - 复制 `.next` 和 `public`
   - 仅安装生产依赖
   - 使用 dumb-init 处理信号

**特点：**
- ✅ 大幅减少镜像大小（从 500MB→150MB）
- ✅ 生产优化
- ✅ 健康检查

### nginx.conf

**功能设置：**

1. **HTTP 重定向 HTTPS**
   - 所有 HTTP 流量 301 重定向到 HTTPS
   - Let's Encrypt 验证路径不重定向

2. **反向代理**
   - `/api/*` → 后端服务（8080）
   - `/bot/webhook` → 后端服务（保留 Telegram secret token）
   - `/` → 前端应用（3000）

3. **SSL/TLS 配置**
   - TLSv1.2+ 支持
   - HSTS 安全头
   - X-Frame-Options、CSP 等安全头

4. **性能优化**
   - Gzip 压缩
   - 静态文件缓存
   - HTTP/2 支持

5. **日志**
   - Access log 和 Error log
   - 健康检查请求不记录

### deploy/nginx.conf

**特别说明：**
- 这个配置文件需要在 DigitalOcean 上的服务器的 `/etc/nginx/sites-available/` 目录
- 由 `deploy.sh` 脚本自动复制和配置

### deploy/.env.prod

**环境变量模板，需要手动填入：**

```dotenv
DB_PASSWORD=change-me-to-strong-password              # 数据库密码
JWT_SECRET=change-me-to-strong-jwt-secret-key-...     # JWT 签名密钥
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRST...  # Bot Token
TELEGRAM_BOT_USERNAME=your_bot_username               # Bot 用户名
SUPPORT_EMAIL=admin@looksupermm.com                   # 支持邮箱
```

**关键提示：**
- `DB_PASSWORD` 和 `JWT_SECRET` 必须是强秘密
- 不要在 Git 中提交真实的秘密值
- 部署到生产前必须修改所有值

### deploy/deploy.sh

**自动部署脚本的功能：**

```
Step 1  → 系统更新
Step 2  → 安装 Docker & Compose
Step 3  → 安装 Nginx & Certbot
Step 4  → 创建项目目录
Step 5  → 获取代码（Git 或手动）
Step 6  → 配置环境变量
Step 7  → 配置 Nginx
Step 8  → 申请 SSL 证书（Let's Encrypt）
Step 9  → 启动 Docker 容器
Step 10 → 启动 Nginx
Step 11 → 配置自动备份（可选）
Step 12 → 状态检查和总结
```

**时间估算：** ~15-20 分钟

**依赖项：**
- bash shell
- curl 命令行工具
- sudo 权限

### deploy/monitor.sh

**定期监控脚本的检查项：**

```
1. Docker 容器状态
2. 前端应用可用性（HTTP 状态）
3. 后端 API 可用性（/healthz）
4. 磁盘空间使用率
5. SSL 证书过期日期
6. Nginx 进程状态
7. 日志文件大小
```

**使用方式：**

```bash
# 手动运行
bash deploy/monitor.sh

# 配置定时任务（每 15 分钟检查一次）
crontab -e
# 添加行：
# */15 * * * * /home/deploy/tg-hr-platform/deploy/monitor.sh
```

---

## 🔧 配置自定义

### 更改域名

如果你的域名不是 `www.looksupermm.com`，需要在以下文件中修改：

1. **docker-compose.prod.yml**
   ```yaml
   environment:
     BOT_WEBAPP_URL: https://your-new-domain.com
     ALLOWED_ORIGINS: https://your-new-domain.com
   ```

2. **deploy/nginx.conf**
   ```nginx
   server_name your-new-domain.com;
   ssl_certificate /etc/letsencrypt/live/your-new-domain.com/...
   ```

3. **DEPLOYMENT_GUIDE.md**
   - 更新所有 `www.looksupermm.com` 引用

### 更改端口

如果想改变容器暴露的端口：

在 `docker-compose.prod.yml` 中修改：

```yaml
# 后端（默认 8080）
backend:
  ports:
    - "127.0.0.1:9090:8080"  # 改为 9090

# 前端（默认 3000）
frontend:
  ports:
    - "127.0.0.1:3001:3000"  # 改为 3001
```

**注意：** Nginx 会自动代理，浏览器访问的还是 HTTPS://www.looksupermm.com

### 更改数据库密码

在 `.env.prod` 中修改：

```dotenv
DB_PASSWORD=your-new-strong-password
```

**重要：** 如果容器已在运行，改变密码后需要重新启动并重新初始化数据库。

---

## 🔐 安全建议

### 部署前必做

- [ ] 修改 JWT_SECRET（至少 32 个字符）
- [ ] 修改 DB_PASSWORD（至少 16 个字符，包含大小写和数字）
- [ ] 不要在代码库中提交 `.env.prod`
- [ ] 配置防火墙规则（仅开放 22, 80, 443）
- [ ] 禁用 root SSH 登录
- [ ] 启用 SSH Key 认证

### 部署后建议

- [ ] 定期备份数据库
- [ ] 监控应用日志
- [ ] 设置日志轮转（log rotation）
- [ ] 启用 Fail2Ban（防暴力攻击）
- [ ] 定期更新 Docker 镜像

---

## 📊 资源需求

### 最小配置

| 资源 | 需求 | 说明 |
|------|------|------|
| CPU | 1 核 | 初期可用 |
| 内存 | 1 GB | 紧张，可能 OOM |
| 存储 | 20 GB | 仅存储应用，不含备份 |
| 带宽 | 1 Mbps | 初期开发用 |

### 推荐配置

| 资源 | 需求 | 说明 |
|------|------|------|
| CPU | 2 核 | 稳定运行 |
| 内存 | 2-4 GB | 足够应对中等流量 |
| 存储 | 50 GB | 含日志和备份空间 |
| 带宽 | 2-5 Mbps | 支持并发用户 |

### 实际使用估算

基于 DigitalOcean $7.99/月 的 Droplet（2GB RAM，1 vCPU）：

- **PostgreSQL：** ~300MB
- **Redis：** ~50MB
- **Go 二进制 + 依赖：** ~50MB
- **Next.js 构建：** ~150MB
- **可用空间：** ~1.4GB

---

## 🚀 后续优化

完成基础部署后，考虑：

### 第一阶段（第 1 周）
- ✅ 验证功能正常
- ✅ 配置定期备份
- ✅ 设置监控告警
- ✅ 测试故障恢复

### 第二阶段（第 1-2 个月）
- ✅ 优化数据库查询
- ✅ 配置缓存策略
- ✅ 启用 CDN（可选）
- ✅ 收集用户反馈

### 第三阶段（第 3 个月+）
- ✅ 扩展到多实例
- ✅ 配置自动伸缩
- ✅ 实现蓝绿部署
- ✅ 设置性能监控

---

## 📞 获取帮助

如果遇到部署问题：

1. **查看日志**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

2. **检查配置**
   - `.env.prod` 文件是否正确
   - `docker-compose.prod.yml` 语法是否有效
   - Nginx 配置是否有误

3. **网络测试**
   ```bash
   curl -v https://www.looksupermm.com
   curl -v https://www.looksupermm.com/healthz
   ```

4. **查看完整指南**
   - 详细步骤：`DEPLOYMENT_GUIDE.md`
   - 检查清单：`DEPLOYMENT_CHECKLIST.md`

---

## 📝 版本历史

- **v1.0** - 2026-02-18：初始部署配置
  - Docker Compose 多服务配置
  - Nginx SSL 反向代理
  - 自动化部署脚本
  - 监控告警脚本

---

**祝部署顺利！** 🎉

如有问题，请查看 `DEPLOYMENT_GUIDE.md` 的常见问题部分。
