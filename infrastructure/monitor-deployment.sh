#!/bin/bash

# Mumble部署监控脚本

INSTANCE_ID="i-05da5dbb41c40d387"
INSTANCE_IP="100.27.220.193"
REGION="us-east-1"

echo "🔍 Mumble部署监控"
echo "=================="
echo "实例ID: $INSTANCE_ID"
echo "实例IP: $INSTANCE_IP"
echo "开始时间: $(date)"
echo ""

# 监控函数
check_port() {
    local port=$1
    local name=$2
    if timeout 3 bash -c "echo > /dev/tcp/$INSTANCE_IP/$port" 2>/dev/null; then
        echo "✅ $name (端口 $port): 运行中"
        return 0
    else
        echo "⏳ $name (端口 $port): 等待中"
        return 1
    fi
}

check_api() {
    local response=$(curl -s -w "%{http_code}" "http://$INSTANCE_IP/api/v1/health" -o /tmp/api_response.json 2>/dev/null)
    if [ "$response" = "200" ]; then
        echo "✅ API健康检查: 正常"
        echo "   响应: $(cat /tmp/api_response.json 2>/dev/null | head -1)"
        return 0
    else
        echo "⏳ API健康检查: 等待中 (HTTP: $response)"
        return 1
    fi
}

check_frontend() {
    local response=$(curl -s -w "%{http_code}" "http://$INSTANCE_IP/" -o /dev/null 2>/dev/null)
    if [ "$response" = "200" ]; then
        echo "✅ 前端应用: 可访问"
        return 0
    else
        echo "⏳ 前端应用: 等待中 (HTTP: $response)"
        return 1
    fi
}

# 主监控循环
echo "开始监控部署进度..."
echo ""

for i in {1..20}; do
    echo "=== 检查 #$i ($(date +%H:%M:%S)) ==="
    
    # 检查实例状态
    INSTANCE_STATE=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --region $REGION \
        --query 'Reservations[0].Instances[0].State.Name' \
        --output text 2>/dev/null)
    
    echo "实例状态: $INSTANCE_STATE"
    
    if [ "$INSTANCE_STATE" != "running" ]; then
        echo "❌ 实例未运行，等待..."
        sleep 30
        continue
    fi
    
    # 检查端口
    check_port 22 "SSH服务"
    check_port 80 "Web服务"
    check_port 5000 "API服务"
    
    # 检查应用
    api_ok=false
    frontend_ok=false
    
    if check_api; then
        api_ok=true
    fi
    
    if check_frontend; then
        frontend_ok=true
    fi
    
    # 如果所有服务都正常，部署完成
    if [ "$api_ok" = true ] && [ "$frontend_ok" = true ]; then
        echo ""
        echo "🎉 部署完成！所有服务正常运行"
        echo ""
        echo "📱 应用访问:"
        echo "  前端: http://$INSTANCE_IP"
        echo "  API: http://$INSTANCE_IP/api/v1/health"
        echo ""
        echo "🧪 快速测试:"
        curl -s "http://$INSTANCE_IP/api/v1/health" | head -3
        echo ""
        break
    fi
    
    echo "⏳ 等待服务启动... (30秒后重试)"
    echo ""
    sleep 30
done

if [ $i -eq 20 ]; then
    echo "⚠️  监控超时，但实例可能仍在部署中"
    echo "请手动检查: http://$INSTANCE_IP"
fi

echo ""
echo "监控结束时间: $(date)"
