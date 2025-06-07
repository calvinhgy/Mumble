#!/bin/bash
# SSL证书检查脚本

DOMAIN="your-domain.com"  # 替换为实际域名
ALERT_DAYS=30  # 提前30天告警

if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "your-domain.com" ]; then
    echo "域名未配置，跳过SSL检查"
    exit 0
fi

# 检查证书过期时间
EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)

if [ -n "$EXPIRY_DATE" ]; then
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
    
    echo "SSL证书将在 $DAYS_UNTIL_EXPIRY 天后过期 ($EXPIRY_DATE)"
    
    if [ $DAYS_UNTIL_EXPIRY -le $ALERT_DAYS ]; then
        echo "警告: SSL证书即将过期！"
        # 发送告警邮件或通知
        if command -v mail &> /dev/null; then
            echo "SSL证书将在 $DAYS_UNTIL_EXPIRY 天后过期，请及时更新" | mail -s "SSL证书过期警告" admin@example.com
        fi
    fi
else
    echo "无法获取SSL证书信息"
fi
