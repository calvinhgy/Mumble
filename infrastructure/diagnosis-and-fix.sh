#!/bin/bash

# Mumble部署问题诊断和修复脚本

set -e

CURRENT_INSTANCE_ID="i-05da5dbb41c40d387"
CURRENT_INSTANCE_IP="100.27.220.193"
REGION="us-east-1"

echo "🔍 Mumble部署问题诊断"
echo "===================="
echo "当前实例: $CURRENT_INSTANCE_ID"
echo "当前IP: $CURRENT_INSTANCE_IP"
echo "诊断时间: $(date)"
echo ""

# 计算运行时间
launch_time="2025-06-07T11:09:30+00:00"
current_time=$(date +%s)
launch_timestamp=$(date -d "2025-06-07 11:09:30" +%s)
runtime=$((current_time - launch_timestamp))
runtime_minutes=$((runtime / 60))

echo "📊 当前状态:"
echo "  运行时间: ${runtime_minutes}分钟"
echo "  预期时间: 5-8分钟"
echo "  状态评估: $([ $runtime_minutes -gt 12 ] && echo "🔴 异常" || echo "🟡 延迟")"
echo ""

echo "🔧 问题分析:"
echo "1. 部署时间过长 (${runtime_minutes}分钟 > 12分钟)"
echo "2. 应用端口未开放 (80, 5000)"
echo "3. 可能的原因:"
echo "   - npm install网络超时"
echo "   - MongoDB安装失败"
echo "   - 用户数据脚本错误"
echo "   - 系统资源不足"
echo ""

echo "💡 解决方案选择:"
echo "A) 继续等待当前部署 (可能需要20+分钟)"
echo "B) 创建新实例，使用优化的部署脚本"
echo "C) 手动连接当前实例进行诊断"
echo ""

read -p "请选择解决方案 (A/B/C): " choice

case $choice in
    [Aa]* )
        echo "选择A: 继续等待当前部署"
        echo "⏳ 将继续监控当前实例..."
        
        for i in {1..10}; do
            echo ""
            echo "=== 监控检查 #$i ($(date +%H:%M:%S)) ==="
            
            # 检查端口
            ports_open=0
            for port in 80 5000; do
                if timeout 3 bash -c "echo > /dev/tcp/$CURRENT_INSTANCE_IP/$port" 2>/dev/null; then
                    echo "端口 $port: ✅ 开放"
                    ((ports_open++))
                else
                    echo "端口 $port: ❌ 关闭"
                fi
            done
            
            if [ $ports_open -gt 0 ]; then
                echo "🎉 检测到端口开放！测试应用..."
                curl -s "http://$CURRENT_INSTANCE_IP/api/v1/health" || echo "API测试中..."
                break
            fi
            
            echo "⏳ 等待2分钟后继续检查..."
            sleep 120
        done
        ;;
        
    [Bb]* )
        echo "选择B: 创建优化的新实例"
        echo "🛑 终止当前实例..."
        aws ec2 terminate-instances --instance-ids $CURRENT_INSTANCE_ID --region $REGION
        
        echo "⏳ 等待实例终止..."
        sleep 30
        
        echo "🚀 创建优化的新实例..."
        # 创建更简单的部署脚本
        ./infrastructure/create-minimal-instance.sh
        ;;
        
    [Cc]* )
        echo "选择C: 手动诊断"
        echo "📝 诊断步骤:"
        echo "1. 登录AWS控制台"
        echo "2. 进入EC2服务"
        echo "3. 选择实例: $CURRENT_INSTANCE_ID"
        echo "4. 点击'连接' -> 'Session Manager'"
        echo "5. 执行以下命令:"
        echo ""
        echo "   # 查看部署日志"
        echo "   sudo tail -f /var/log/mumble-auto-deploy.log"
        echo ""
        echo "   # 查看系统日志"
        echo "   sudo journalctl -f"
        echo ""
        echo "   # 检查服务状态"
        echo "   sudo systemctl status mongod nginx"
        echo "   pm2 status"
        echo ""
        echo "   # 检查进程"
        echo "   ps aux | grep -E '(node|mongo|nginx)'"
        echo ""
        echo "   # 检查网络"
        echo "   sudo netstat -tlnp | grep -E '(80|5000)'"
        ;;
        
    * )
        echo "无效选择，退出"
        exit 1
        ;;
esac
