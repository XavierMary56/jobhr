# Telegram Bot 配置指南

## 快速开始

本项目的Telegram Bot支持WebApp集成，允许用户直接在Telegram中打开招聘平台Web应用。

## 配置步骤

### 1. 从BotFather获取Bot Token

1. 在Telegram中打开 [@BotFather](https://t.me/botfather)
2. 发送 `/newbot` 命令
3. 按照提示输入bot名称和用户名
4. 获取bot token，格式为: `123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk`

### 2. 设置Bot Webhook

#### 选项A：使用curl命令（推荐）

```bash
# 替换以下变量：
# - BOT_TOKEN: 你的bot token
# - WEBHOOK_URL: 你的后端服务地址（例如 https://api.yourdomain.com）
# - WEBHOOK_SECRET: 可选的webhook密钥

curl -X POST \
  https://api.telegram.org/bot<BOT_TOKEN>/setWebhook \
  -d "url=<WEBHOOK_URL>/bot/webhook" \
  -d "secret_token=<WEBHOOK_SECRET>"
```

**本地开发环境配置：**

如果你使用ngrok进行本地开发，可以这样配置：

```bash
# 1. 启动ngrok（假设后端运行在 localhost:8081）
ngrok http 8081

# 2. 获得ngrok提供的公网URL，例如 https://abc123.ngrok-free.app
# 3. 设置webhook

curl -X POST \
  https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://abc123.ngrok-free.app/bot/webhook"
```

#### 选项B：使用BotFather菜单

1. 在Telegram中打开 [@BotFather](https://t.me/botfather)
2. 选择你的bot -> Edit Bot -> Webhook Settings
3. 输入webhook URL: `https://your-domain.com/bot/webhook`
4. 可选：设置webhook secret token

### 3. 配置环境变量

在后端`.env`文件中设置：

```dotenv
# Bot Token (从BotFather获取)
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk

# WebApp URL (前端应用地址)
BOT_WEBAPP_URL=http://localhost:3000  # 本地开发
# BOT_WEBAPP_URL=https://your-domain.com  # 生产环境

# Webhook 密钥 (可选)
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret
```

### 4. 设置Bot命令

在BotFather中为你的bot设置命令菜单：

```
/start - 打开招聘平台
```

或使用curl命令：

```bash
curl -X POST \
  https://api.telegram.org/bot<BOT_TOKEN>/setMyCommands \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "打开招聘平台"}
    ]
  }'
```

## 工作流程

1. **用户在Telegram中**
   - 打开 `@your_bot_name` 或搜索你的bot名
   - 点击 `Start` 按钮或发送 `/start` 命令

2. **Bot处理请求**
   - 后端验证webhook来源（如果配置了secret token）
   - 返回消息 + 内联键盘，包含 "📱 打开招聘平台" 按钮

3. **用户打开WebApp**
   - 用户点击按钮
   - Telegram WebApp打开前端应用 (`BOT_WEBAPP_URL`)
   - 前端自动检测WebApp环境并执行登录
   - 用户成功进入招聘平台

## 本地开发测试

如果不想设置真实的webhook，可以使用开发模式：

```dotenv
# 不设置 TELEGRAM_BOT_TOKEN，或设置为空
TELEGRAM_BOT_TOKEN=

# 启用开发模式（跳过签名验证）
TELEGRAM_DEV_MODE=true

# 前端可以直接打开登录页面进行测试
# http://localhost:3000
```

在开发模式下：
- WebApp功能自动检测（如果在Telegram客户端中打开）
- 不需要真实的bot token和webhook
- 可以直接测试登录和账户功能

## 故障排除

### 问题1：Bot收不到消息

**检查事项：**
- ✅ Bot token是否正确配置在`.env`中
- ✅ Webhook URL是否正确（必须是https，除非是本地ngrok）
- ✅ 后端是否成功启动并监听 `/bot/webhook` 端点
- ✅ 如果设置了webhook secret，是否与`.env`中配置一致

**测试webhook：**

```bash
# 获取webhook info
curl -X POST \
  https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo
```

### 问题2：WebApp打开后空白或出错

**检查事项：**
- ✅ `BOT_WEBAPP_URL` 是否正确指向前端应用
- ✅ 前端应用是否正常运行（访问 `http://localhost:3000` 测试）
- ✅ CORS配置是否允许Telegram的请求 (见 ALLOWED_ORIGINS)

### 问题3：用户无法自动登录

**检查事项：**
- ✅ Telegram WebApp 的 `initDataUnsafe` 是否包含用户信息
- ✅ 后端 `/auth/telegram/login` 是否返回成功响应
- ✅ Cookie 是否正确设置 (COOKIE_SECURE=false for local)
- ✅ 检查浏览器控制台是否有JavaScript错误

## 生产环境部署

### 必要的準備：

1. **获得有效的HTTPS域名**
   - Telegram要求webhook URL必须是HTTPS
   - 获得有效的SSL证书

2. **配置环境变量**

```dotenv
# 生产环境配置示例
TELEGRAM_BOT_TOKEN=your-real-bot-token
BOT_WEBAPP_URL=https://your-platform-domain.com
TELEGRAM_WEBHOOK_SECRET=your-secure-random-token
COOKIE_SECURE=true
```

3. **设置webhook**

```bash
curl -X POST \
  https://api.telegram.org/bot<BOT_TOKEN>/setWebhook \
  -d "url=https://your-api-domain.com/bot/webhook" \
  -d "secret_token=your-secure-random-token"
```

## 更多信息

- [Telegram Bot API 文档](https://core.telegram.org/bots/api)
- [Telegram WebApp 文档](https://core.telegram.org/bots/webapps)
- [Telegram 登录小部件文档](https://core.telegram.org/widgets/login)
