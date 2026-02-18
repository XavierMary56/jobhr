#!/bin/bash
# ========================================
# 自动化部署脚本 - DigitalOcean
# 在新的DigitalOcean Ubuntu 22.04服务器上运行
# 使用: bash deploy.sh
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ========================================
# 步骤 1: 更新系统
# ========================================
print_info "步骤 1: 更新系统..."
sudo apt update
sudo apt upgrade -y
print_success "系统已更新"

# ========================================
# 步骤 2: 安装 Docker & Docker Compose
# ========================================
print_info "步骤 2: 安装 Docker & Docker Compose..."

# 检查是否已安装
if command -v docker &> /dev/null; then
    print_warning "Docker 已安装，跳过安装"
else
    # 安装 Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # 添加当前用户到 docker 组
    sudo usermod -aG docker $USER
    
    # 刷新组成员
    newgrp docker
    
    print_success "Docker 已安装"
fi

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
print_success "Docker Compose 已安装"

# ========================================
# 步骤 3: 安装 Nginx & Certbot
# ========================================
print_info "步骤 3: 安装 Nginx & Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx curl
print_success "Nginx 和 Certbot 已安装"

# ========================================
# 步骤 4: 创建项目目录
# ========================================
print_info "步骤 4: 创建项目目录..."
PROJECT_DIR="/home/$USER/tg-hr-platform"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR
print_success "项目目录已创建: $PROJECT_DIR"

# ========================================
# 步骤 5: 克隆代码（如果使用 Git）
# ========================================
print_info "步骤 5: 获取应用代码..."
print_warning "请选择:"
print_warning "1) 从 Git 仓库克隆代码"
print_warning "2) 手动上传代码"
read -p "请输入选择 (1 或 2): " choice

if [ "$choice" == "1" ]; then
    read -p "请输入 Git 仓库地址: " git_repo
    if [ -d "$PROJECT_DIR/.git" ]; then
        cd $PROJECT_DIR
        git pull origin main
    else
        git clone $git_repo $PROJECT_DIR
    fi
    print_success "代码已获取"
else
    print_info "等待手动上传代码到 $PROJECT_DIR..."
fi

# ========================================
# 步骤 6: 配置环境变量
# ========================================
print_info "步骤 6: 配置环境变量..."

if [ ! -f "$PROJECT_DIR/.env.prod" ]; then
    print_error "未找到 .env.prod 文件"
    print_info "请先创建 .env.prod 文件，并设置以下变量:"
    print_warning "  - DB_PASSWORD"
    print_warning "  - JWT_SECRET"
    print_warning "  - TELEGRAM_BOT_TOKEN"
    print_warning "  - TELEGRAM_BOT_USERNAME"
    exit 1
fi

# 复制 .env.prod 为生产环境配置
cp $PROJECT_DIR/.env.prod $PROJECT_DIR/.env
print_success "环境变量已配置"

# ========================================
# 步骤 7: 配置 Nginx
# ========================================
print_info "步骤 7: 配置 Nginx..."

# 复制 Nginx 配置
sudo cp $PROJECT_DIR/deploy/nginx.conf /etc/nginx/sites-available/tg-hr-platform
sudo ln -sf /etc/nginx/sites-available/tg-hr-platform /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
if sudo nginx -t; then
    print_success "Nginx 配置已验证"
else
    print_error "Nginx 配置有错误，请检查"
    exit 1
fi

# ========================================
# 步骤 8: 申请 SSL 证书（Let's Encrypt）
# ========================================
print_info "步骤 8: 申请 SSL 证书..."

read -p "请输入你的邮箱地址（用于 Let's Encrypt 通知）: " email_address

# 先启动 Nginx
sudo systemctl start nginx

# 申请证书
sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d www.looksupermm.com \
    -d looksupermm.com \
    --non-interactive \
    --agree-tos \
    -m $email_address

if [ $? -eq 0 ]; then
    print_success "SSL 证书已申请"
    
    # 配置自动续期
    sudo systemctl enable certbot.timer
    print_success "自动续期已启用"
else
    print_error "SSL 证书申请失败，请检查域名配置"
    exit 1
fi

# ========================================
# 步骤 9: 启动 Docker 容器
# ========================================
print_info "步骤 9: 启动应用容器..."

cd $PROJECT_DIR

# 创建必需的目录
mkdir -p logs

# 构建和启动容器
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
sleep 10

# 数据库迁移（首次启动）
print_info "运行数据库迁移..."
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d tg_hr -f /docker-entrypoint-initdb.d/001_init.sql 2>/dev/null || true

print_success "应用容器已启动"

# ========================================
# 步骤 10: 配置 Nginx SSL 并启动
# ========================================
print_info "步骤 10: 启动 Nginx..."

# 更新 Nginx 配置以包含 SSL 证书路径
sudo systemctl reload nginx
sudo systemctl enable nginx

print_success "Nginx 已启动"

# ========================================
# 步骤 11: 设置自动备份（可选）
# ========================================
print_info "步骤 11: 配置自动备份..."

# 创建备份脚本
cat > /tmp/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/$USER/tg-hr-backups"
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"

# 备份数据库
cd /home/$USER/tg-hr-platform
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres tg_hr | gzip > "$BACKUP_FILE.sql.gz"

echo "✅ 备份已完成: $BACKUP_FILE"

# 只保留最近 7 天的备份
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
EOF

chmod +x /tmp/backup.sh
sudo mv /tmp/backup.sh /usr/local/bin/tg-hr-backup

# 添加每日定时备份（可选）
print_info "添加每日备份任务? (y/n)"
read -p "" add_cron

if [ "$add_cron" == "y" ]; then
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/tg-hr-backup") | crontab -
    print_success "每日 02:00 会自动备份"
fi

# ========================================
# 步骤 12: 检查部署状态
# ========================================
print_info "步骤 12: 检查部署状态..."

echo ""
echo "========================================="
echo "部署检查清单"
echo "========================================="

# 检查 Docker 容器
print_info "Docker 容器状态:"
docker-compose -f $PROJECT_DIR/docker-compose.prod.yml ps

echo ""
print_info "系统信息:"
print_success "域名: www.looksupermm.com"
print_success "后端 API: https://www.looksupermm.com/api"
print_success "前端应用: https://www.looksupermm.com"
print_success "项目目录: $PROJECT_DIR"

echo ""
print_info "日志位置:"
echo "  - Nginx: /var/log/nginx/access.log"
echo "  - 应用: $PROJECT_DIR/logs/"
echo "  - Docker: docker-compose -f $PROJECT_DIR/docker-compose.prod.yml logs -f"

echo ""
print_info "常用命令:"
echo "  # 查看日志"
echo "  cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "  # 重启应用"
echo "  cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "  # 更新代码并重新部署"
echo "  cd $PROJECT_DIR && git pull && docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "  # 备份数据库"
echo "  /usr/local/bin/tg-hr-backup"
echo ""

echo "========================================="
print_success "部署完成！🎉"
echo "========================================="
print_warning "请验证以下步骤:"
echo "1. 访问 https://www.looksupermm.com - 应该能看到登录页面"
echo "2. 检查 Telegram Bot 的 webhook 是否配置正确"
echo "3. 测试登录流程"
echo ""
