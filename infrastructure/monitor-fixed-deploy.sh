#!/bin/bash

# Mumble修复版部署监控脚本

INSTANCE_ID="i-05ced9ca892f664ec"
INSTANCE_IP="3.85.205.198"
LAUNCH_TIME=$(date +%s)

echo "🔍 Mumble修复版部署监控"
echo "======================"
echo "实例ID: $INSTANCE_ID"
echo "实例IP: $INSTANCE_IP"
echo "开始监控: $(date)"
echo ""

# 监控函数
check_stage() {
    local stage=$1
    local description=$2
    local expected_time=$3
    
    echo "=== 阶段$stage: $description ==="
    echo "预期时间: ${expected_time}分钟"
    
    current_time=$(date +%s)
    elapsed=$(( (current_time - LAUNCH_TIME) / 60 ))
    echo "已运行: ${elapsed}分钟"
    
    if [ $elapsed -lt $expected_time ]; then
        echo "状态: ⏳ 进行中"
        return 1
    else
        echo "状态: ✅ 应该完成"
        return 0
    fi
}

test_frontend() {
    echo "🧪 测试前端..."
    response=$(curl -s -w "%{http_code}" -m 10 "http://$INSTANCE_IP/" -o /tmp/frontend_test.html 2>/dev/null)
    if [ "$response" = "200" ]; then
        if grep -q "Mumble" /tmp/frontend_test.html 2>/dev/null; then
            echo "✅ 前端正常 - Mumble页面加载成功"
            return 0
        else
            echo "⚠️  前端响应但内容异常"
            return 1
        fi
    else
        echo "❌ 前端无响应 (HTTP: $response)"
        return 1
    fi
}

test_api() {
    echo "🧪 测试API..."
    api_response=$(curl -s -m 10 "http://$INSTANCE_IP/api/v1/health" 2>/dev/null)
    if echo "$api_response" | grep -q "healthy" 2>/dev/null; then
        echo "✅ API正常响应"
        echo "   详情: $(echo "$api_response" | head -1)"
        return 0
    else
        echo "❌ API无响应或异常"
        return 1
    fi
}

# 主监控循环
echo "开始分阶段监控..."
echo ""

# 等待3分钟检查前端
echo "⏳ 等待3分钟检查前端..."
sleep 180

if check_stage 3 "Nginx启动" 3; then
    if test_frontend; then
        echo "🎉 阶段3成功: 前端已可访问！"
        frontend_ready=true
    else
        echo "⚠️  阶段3延迟: 前端尚未就绪"
        frontend_ready=false
    fi
else
    echo "⏳ 阶段3进行中..."
    frontend_ready=false
fi

echo ""

# 等待2分钟检查API
echo "⏳ 等待2分钟检查API..."
sleep 120

if check_stage 5 "API启动" 5; then
    if test_api; then
        echo "🎉 阶段5成功: API已启动！"
        api_ready=true
    else
        echo "⚠️  阶段5延迟: API尚未就绪"
        api_ready=false
    fi
else
    echo "⏳ 阶段5进行中..."
    api_ready=false
fi

echo ""
echo "📊 部署状态总结"
echo "=============="

current_time=$(date +%s)
total_elapsed=$(( (current_time - LAUNCH_TIME) / 60 ))
echo "总运行时间: ${total_elapsed}分钟"

if [ "$frontend_ready" = true ] && [ "$api_ready" = true ]; then
    echo "🎉 部署完全成功！"
    echo ""
    echo "✅ 前端: http://$INSTANCE_IP"
    echo "✅ API: http://$INSTANCE_IP/api/v1/health"
    echo ""
    echo "🧪 功能测试:"
    curl -s "http://$INSTANCE_IP/api/v1/health" | head -2
    
elif [ "$frontend_ready" = true ]; then
    echo "🟡 部分成功: 前端可用，API启动中"
    echo "✅ 前端: http://$INSTANCE_IP"
    echo "⏳ API: 继续等待启动"
    
    # 继续等待API
    echo ""
    echo "继续等待API启动..."
    for i in {1..5}; do
        echo "API检查 #$i..."
        if test_api; then
            echo "🎉 API现在可用了！"
            break
        fi
        sleep 60
    done
    
else
    echo "🔴 部署可能存在问题"
    echo "❌ 前端: 不可访问"
    echo "❌ API: 不可访问"
    echo ""
    echo "🔧 建议操作:"
    echo "1. 检查实例状态"
    echo "2. 通过Session Manager查看日志"
    echo "3. 如果问题持续，考虑重新部署"
fi

echo ""
echo "监控完成时间: $(date)"
