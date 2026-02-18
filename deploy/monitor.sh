#!/bin/bash
# ========================================
# 应用监控脚本 - 定期检查应用状态
# 配合 crontab 使用：*/15 * * * * /home/deploy/tg-hr-platform/deploy/monitor.sh
# ========================================

set -e

PROJECT_DIR="/home/deploy/tg-hr-platform"
LOG_FILE="/var/log/tg-hr-monitor.log"
ALERT_EMAIL="admin@looksupermm.com"  # 修改为你的邮箱
DOMAIN="www.looksupermm.com"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日期格式
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 写入日志
log() {
    echo "[$DATE] $1" >> $LOG_FILE
}

# 发送告警邮件（如果安装了 mail/sendmail）
send_alert() {
    if command -v mail &> /dev/null; then
        echo "$1" | mail -s "🚨 [$DOMAIN] 告警：$2" $ALERT_EMAIL
    fi
    log "⚠️  告警已发送：$2"
}

# ========================================
# 检查 Docker 容器
# ========================================
check_containers() {
    log "检查 Docker 容器..."
    
    cd $PROJECT_DIR
    
    # 获取容器列表
    containers=$(docker-compose -f docker-compose.prod.yml ps -q)
    
    if [ -z "$containers" ]; then
        log "❌ 容器未运行"
        send_alert "Docker 容器已停止\n\n请执行：cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml up -d" "容器停止"
        return 1
    fi
    
    # 检查每个容器的健康状态
    for container in $containers; do
        health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "未定义")
        container_name=$(docker ps --format='{{.Names}}' --filter="id=$container")
        
        if [ "$health" != "healthy" ] && [ "$health" != "未定义" ]; then
            log "❌ 容器 $container_name 默认状态异常：$health"
            send_alert "容器 $container_name 状态异常：$health" "容器状态异常"
            return 1
        fi
    done
    
    log "✅ 所有容器都在运行"
    return 0
}

# ========================================
# 检查前端可用性
# ========================================
check_frontend() {
    log "检查前端应用..."
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://$DOMAIN)
    
    if [ "$http_code" == "200" ]; then
        log "✅ 前端应用正常（HTTP $http_code）"
        return 0
    else
        log "❌ 前端应用异常（HTTP $http_code）"
        send_alert "前端应用无法访问\nHTTP 状态码：$http_code" "前端应用不可用"
        return 1
    fi
}

# ========================================
# 检查后端 API
# ========================================
check_backend() {
    log "检查后端 API..."
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://$DOMAIN/healthz)
    
    if [ "$http_code" == "200" ]; then
        log "✅ 后端 API 正常（HTTP $http_code）"
        return 0
    else
        log "❌ 后端 API 异常（HTTP $http_code）"
        send_alert "后端 API 无法访问\nHTTP 状态码：$http_code" "后端 API 不可用"
        return 1
    fi
}

# ========================================
# 检查磁盘空间
# ========================================
check_disk_space() {
    log "检查磁盘空间..."
    
    usage=$(df -h $PROJECT_DIR | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 90 ]; then
        log "❌ 磁盘空间不足：${usage}%"
        send_alert "磁盘空间不足：${usage}% 已使用\n\n请清理日志或增加存储空间" "磁盘空间告警"
        return 1
    elif [ "$usage" -gt 80 ]; then
        log "⚠️  磁盘空间接近满：${usage}%"
        return 0
    else
        log "✅ 磁盘空间充足：${usage}% 已使用"
        return 0
    fi
}

# ========================================
# 检查 SSL 证书过期
# ========================================
check_ssl_cert() {
    log "检查 SSL 证书..."
    
    cert_file="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    
    if [ ! -f "$cert_file" ]; then
        log "⚠️  证书文件未找到：$cert_file"
        return 1
    fi
    
    # 获取证书过期日期
    expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
    expiry_epoch=$(date -d "$expiry_date" +%s)
    current_epoch=$(date +%s)
    days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
    
    if [ "$days_left" -lt 0 ]; then
        log "❌ SSL 证书已过期"
        send_alert "SSL 证书已过期\n\n请立即续期：sudo certbot renew --force-renewal" "SSL 证书过期"
        return 1
    elif [ "$days_left" -lt 7 ]; then
        log "⚠️  SSL 证书即将过期（剩余 $days_left 天）"
        return 0
    else
        log "✅ SSL 证书正常（剩余 $days_left 天）"
        return 0
    fi
}

# ========================================
# 检查 Nginx
# ========================================
check_nginx() {
    log "检查 Nginx..."
    
    if sudo systemctl is-active --quiet nginx; then
        log "✅ Nginx 运行中"
        return 0
    else
        log "❌ Nginx 已停止"
        send_alert "Nginx 已停止\n\n请执行：sudo systemctl start nginx" "Nginx 停止"
        return 1
    fi
}

# ========================================
# 检查日志大小
# ========================================
check_log_size() {
    log "检查日志大小..."
    
    log_dir="$PROJECT_DIR/logs"
    
    if [ -d "$log_dir" ]; then
        log_size=$(du -sh "$log_dir" | awk '{print $1}')
        log_size_mb=$(du -s "$log_dir" | awk '{print $1}')
        
        if [ "$log_size_mb" -gt 1000000 ]; then  # > 1GB
            log "⚠️  日志文件过大：$log_size"
            log "可执行：truncate -s 0 $log_dir/*"
        else
            log "✅ 日志大小正常：$log_size"
        fi
    fi
}

# ========================================
# 生成报告
# ========================================
generate_report() {
    log ""
    log "=========================================="
    log "监控报告 - $DATE"
    log "=========================================="
    
    check_containers
    check_frontend
    check_backend
    check_disk_space
    check_ssl_cert
    check_nginx
    check_log_size
    
    log "=========================================="
    log ""
}

# ========================================
# 主程序
# ========================================
main() {
    generate_report
}

# 确保日志文件存在
touch $LOG_FILE

# 运行监控
main
