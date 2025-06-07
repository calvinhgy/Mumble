#!/bin/bash

# Mumble 部署状态检查脚本

echo "🔍 Mumble 部署状态检查"
echo "====================="
echo ""

# 实例信息
INSTANCE_ID="i-0d1554d4b95699232"
INSTANCE_IP="34.228.185.188"

echo "📋 实例信息:"
echo "  实例ID: $INSTANCE_ID"
echo "  公网IP: $INSTANCE_IP"
echo "  DNS名称: ec2-34-228-185-188.compute-1.amazonaws.com"
echo ""

# 检查实例状态
echo "🔍 检查实例状态..."
INSTANCE_STATE=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region us-east-1 \
    --query 'Reservations[0].Instances[0].State.Name' \
    --output text)

echo "  实例状态: $INSTANCE_STATE"

# 检查端口连通性
echo ""
echo "🔍 检查端口连通性..."
for port in 22 80 443 3000 5000; do
    if timeout 3 bash -c "echo > /dev/tcp/$INSTANCE_IP/$port" 2>/dev/null; then
        echo "  端口 $port: ✅ 开放"
    else
        echo "  端口 $port: ❌ 关闭或超时"
    fi
done

echo ""
echo "🔑 SSH连接信息:"
echo "  密钥对名称: mumble-migration-key"
echo "  连接命令: ssh -i ~/.ssh/mumble-migration-key.pem ec2-user@$INSTANCE_IP"
echo ""

echo "⚠️  注意事项:"
echo "1. 实例刚创建，需要等待3-5分钟完成初始化"
echo "2. 需要SSH密钥文件才能连接实例"
echo "3. 如果没有密钥文件，可以通过AWS控制台的Session Manager连接"
echo ""

echo "📝 下一步操作:"
echo "1. 获取SSH密钥文件"
echo "2. 等待实例完全启动"
echo "3. 连接实例并部署应用"
echo ""

echo "🌐 预期访问地址:"
echo "  前端应用: http://$INSTANCE_IP (部署后)"
echo "  API接口: http://$INSTANCE_IP:5000/api/v1/health (部署后)"
echo ""

echo "📊 当前状态: 实例已创建并运行，等待应用部署"
