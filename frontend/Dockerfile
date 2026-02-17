# ====================
# 前端 Dockerfile
# 使用单阶段构建以简化开发流程
# ====================

FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（使用 legacy-peer-deps 避免版本冲突）
RUN npm install --legacy-peer-deps

# 复制所有源代码
COPY . .

# 环境变量配置
ENV NODE_ENV=development
ENV NEXT_PUBLIC_API_URL=http://app:8080

# 暴露端口
EXPOSE 3000

# 启动开发服务器（支持热重载）
CMD ["npm", "run", "dev"]
