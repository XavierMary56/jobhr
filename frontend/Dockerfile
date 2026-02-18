# ====================
# 前端 Dockerfile - 生产版本
# 使用多阶段构建优化镜像大小
# ====================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制所有源代码
COPY . .

# 构建 Next.js 应用
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

RUN npm run build

# Final stage - 生产运行时
FROM node:20-alpine

WORKDIR /app

# 安装 dumb-init 处理信号，以及 curl 用于健康检查
RUN apk add --no-cache dumb-init curl

# 复制 package 文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production

# 从构建阶段复制已构建的应用
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# 使用 dumb-init 处理信号
ENTRYPOINT ["dumb-init", "--"]

# 生产模式启动 Next.js
CMD ["npm", "start"]
