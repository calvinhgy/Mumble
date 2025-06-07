#!/bin/bash
# Mumble生产环境监控脚本

# 配置
LOG_FILE="/var/log/mumble/monitor.log"
ALERT_EMAIL="admin@example.com"  # 替换为实际邮箱
SLACK_WEBHOOK=""  # 可选：Slack通知

# 创建日志目录
mkdir -p /var/log/mumble

# 日志函数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# 发送告警
send_alert() {
    local message="$1"
    local severity="$2"
    
    log_message "ALERT [$severity]: $message"
    
    # 邮件告警（需要配置sendmail或ses）
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "Mumble Alert [$severity]" $ALERT_EMAIL
    fi
    
    # Slack告警（可选）
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Mumble Alert [$severity]: $message\"}" \
            $SLACK_WEBHOOK
    fi
}

# 检查系统资源
check_system_resources() {
    log_message "检查系统资源..."
    
    # 检查CPU使用率
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    CPU_USAGE_NUM=$(echo $CPU_USAGE | sed 's/%//')
    
    if (( $(echo "$CPU_USAGE_NUM > 80" | bc -l) )); then
        send_alert "CPU使用率过高: $CPU_USAGE" "HIGH"
    fi
    
    # 检查内存使用率
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
    if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
        send_alert "内存使用率过高: ${MEMORY_USAGE}%" "HIGH"
    fi
    
    # 检查磁盘使用率
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        send_alert "磁盘使用率过高: ${DISK_USAGE}%" "MEDIUM"
    fi
    
    log_message "系统资源检查完成 - CPU: $CPU_USAGE, Memory: ${MEMORY_USAGE}%, Disk: ${DISK_USAGE}%"
}

# 检查应用服务状态
check_application_status() {
    log_message "检查应用服务状态..."
    
    # 检查Nginx状态
    if ! systemctl is-active --quiet nginx; then
        send_alert "Nginx服务未运行" "HIGH"
        systemctl restart nginx
        log_message "已尝试重启Nginx服务"
    fi
    
    # 检查PM2应用状态
    if ! pm2 list | grep -q "mumble-backend.*online"; then
        send_alert "后端应用未运行" "HIGH"
        cd /opt/mumble
        pm2 restart mumble-backend
        log_message "已尝试重启后端应用"
    fi
    
    # 检查应用响应
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/v1/health || echo "000")
    if [ "$BACKEND_STATUS" != "200" ]; then
        send_alert "后端API健康检查失败 (HTTP $BACKEND_STATUS)" "HIGH"
    fi
    
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
    if [ "$FRONTEND_STATUS" != "200" ]; then
        send_alert "前端应用访问失败 (HTTP $FRONTEND_STATUS)" "MEDIUM"
    fi
    
    log_message "应用状态检查完成 - Backend: $BACKEND_STATUS, Frontend: $FRONTEND_STATUS"
}

# 检查外部API状态
check_external_apis() {
    log_message "检查外部API状态..."
    
    # 检查OpenAI API
    if [ -n "$OPENAI_API_KEY" ]; then
        OPENAI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $OPENAI_API_KEY" \
            https://api.openai.com/v1/models || echo "000")
        
        if [ "$OPENAI_STATUS" != "200" ]; then
            send_alert "OpenAI API连接失败 (HTTP $OPENAI_STATUS)" "MEDIUM"
        fi
    fi
    
    # 检查OpenWeatherMap API
    if [ -n "$OPENWEATHERMAP_API_KEY" ]; then
        WEATHER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            "https://api.openweathermap.org/data/2.5/weather?q=London&appid=$OPENWEATHERMAP_API_KEY" || echo "000")
        
        if [ "$WEATHER_STATUS" != "200" ]; then
            send_alert "OpenWeatherMap API连接失败 (HTTP $WEATHER_STATUS)" "MEDIUM"
        fi
    fi
    
    log_message "外部API检查完成"
}

# 检查日志错误
check_logs_for_errors() {
    log_message "检查应用日志错误..."
    
    # 检查PM2日志中的错误
    ERROR_COUNT=$(tail -n 100 /var/log/mumble/error.log 2>/dev/null | grep -i "error\|exception\|failed" | wc -l)
    if [ $ERROR_COUNT -gt 5 ]; then
        send_alert "应用日志中发现大量错误 ($ERROR_COUNT 个)" "MEDIUM"
    fi
    
    # 检查Nginx错误日志
    NGINX_ERRORS=$(tail -n 50 /var/log/nginx/error.log 2>/dev/null | grep "$(date '+%Y/%m/%d')" | wc -l)
    if [ $NGINX_ERRORS -gt 10 ]; then
        send_alert "Nginx错误日志异常 ($NGINX_ERRORS 个今日错误)" "LOW"
    fi
    
    log_message "日志检查完成 - App errors: $ERROR_COUNT, Nginx errors: $NGINX_ERRORS"
}

# 性能监控
check_performance() {
    log_message "检查应用性能..."
    
    # 检查响应时间
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:5000/api/v1/health)
    RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
    
    if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
        send_alert "API响应时间过长: ${RESPONSE_TIME_MS}ms" "MEDIUM"
    fi
    
    # 检查数据库连接
    if pm2 logs mumble-backend --lines 10 | grep -q "MongoDB connected"; then
        log_message "数据库连接正常"
    else
        send_alert "数据库连接可能存在问题" "HIGH"
    fi
    
    log_message "性能检查完成 - Response time: ${RESPONSE_TIME_MS}ms"
}

# 清理日志文件
cleanup_logs() {
    log_message "清理旧日志文件..."
    
    # 清理7天前的日志
    find /var/log/mumble -name "*.log" -type f -mtime +7 -delete
    find /var/log/nginx -name "*.log" -type f -mtime +7 -delete
    
    # 清理PM2日志
    pm2 flush
    
    log_message "日志清理完成"
}

# 生成监控报告
generate_report() {
    local report_file="/var/log/mumble/daily_report_$(date +%Y%m%d).txt"
    
    cat > $report_file << EOF
Mumble应用监控日报 - $(date '+%Y-%m-%d')
=====================================

系统资源使用情况:
- CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
- 内存使用率: $(free | awk 'NR==2{printf "%.2f%%", $3*100/$2}')
- 磁盘使用率: $(df / | awk 'NR==2 {print $5}')

应用状态:
- Nginx状态: $(systemctl is-active nginx)
- 后端应用状态: $(pm2 list | grep mumble-backend | awk '{print $10}')
- 前端访问状态: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
- API健康检查: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/v1/health)

性能指标:
- API响应时间: $(curl -o /dev/null -s -w "%{time_total}s" http://localhost:5000/api/v1/health)
- 今日错误数量: $(tail -n 1000 /var/log/mumble/error.log 2>/dev/null | grep "$(date '+%Y-%m-%d')" | wc -l)

外部服务状态:
- OpenAI API: $(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models 2>/dev/null || echo "未配置")
- 天气API: $(curl -s -o /dev/null -w "%{http_code}" "https://api.openweathermap.org/data/2.5/weather?q=London&appid=$OPENWEATHERMAP_API_KEY" 2>/dev/null || echo "未配置")

报告生成时间: $(date)
EOF

    log_message "监控报告已生成: $report_file"
}

# 主监控函数
main_monitor() {
    log_message "开始监控检查..."
    
    # 加载环境变量
    if [ -f /opt/mumble/.env ]; then
        source /opt/mumble/.env
    fi
    
    check_system_resources
    check_application_status
    check_external_apis
    check_logs_for_errors
    check_performance
    
    log_message "监控检查完成"
}

# 根据参数执行不同功能
case "$1" in
    "monitor")
        main_monitor
        ;;
    "cleanup")
        cleanup_logs
        ;;
    "report")
        generate_report
        ;;
    "full")
        main_monitor
        cleanup_logs
        generate_report
        ;;
    *)
        echo "用法: $0 {monitor|cleanup|report|full}"
        echo "  monitor - 执行监控检查"
        echo "  cleanup - 清理日志文件"
        echo "  report  - 生成监控报告"
        echo "  full    - 执行完整监控流程"
        exit 1
        ;;
esac
