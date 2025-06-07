#!/bin/bash
# 设置生产环境定时任务

# 创建定时任务配置
cat > /tmp/mumble-crontab << 'EOF'
# Mumble生产环境定时任务

# 每5分钟执行监控检查
*/5 * * * * /opt/mumble/scripts/monitor.sh monitor >> /var/log/mumble/cron.log 2>&1

# 每小时清理临时文件
0 * * * * find /tmp -name "mumble_*" -type f -mtime +1 -delete

# 每天凌晨2点执行完整备份
0 2 * * * /opt/mumble/scripts/backup.sh backup >> /var/log/mumble/backup.log 2>&1

# 每天凌晨3点生成监控报告
0 3 * * * /opt/mumble/scripts/monitor.sh report >> /var/log/mumble/report.log 2>&1

# 每周日凌晨4点清理旧备份
0 4 * * 0 /opt/mumble/scripts/backup.sh cleanup >> /var/log/mumble/cleanup.log 2>&1

# 每天检查SSL证书过期时间（如果使用HTTPS）
0 6 * * * /opt/mumble/scripts/check-ssl.sh >> /var/log/mumble/ssl-check.log 2>&1

# 每月1号重启PM2应用（预防内存泄漏）
0 4 1 * * cd /opt/mumble && pm2 restart mumble-backend && pm2 save

# 每天检查系统更新
0 5 * * * yum check-update >> /var/log/mumble/system-updates.log 2>&1
EOF

# 安装定时任务
crontab /tmp/mumble-crontab
rm /tmp/mumble-crontab

echo "定时任务已设置完成"
echo "当前定时任务列表："
crontab -l
