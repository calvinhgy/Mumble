#!/bin/bash

# Mumble 快速部署脚本 - 无循环版本
# 使用现有安全组快速创建实例

set -e

# 配置
INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"
REGION="us-east-1"
KEY_NAME="mumble-migration-key"
SECURITY_GROUP_ID="sg-05e7746fc594f6782"  # 使用现有的mumble安全组

echo "🚀 Mumble 快速部署"
echo "=================="
echo "实例类型: $INSTANCE_TYPE"
echo "密钥对: $KEY_NAME"
echo "安全组: $SECURITY_GROUP_ID"
echo ""

# 创建实例
echo "📦 创建EC2实例..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data file://infrastructure/user_data.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Mumble-Quick-Deploy},{Key=Project,Value=Mumble}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ 实例创建成功: $INSTANCE_ID"

# 等待实例运行 (最多等待5分钟)
echo "⏳ 等待实例启动..."
timeout 300 aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ 实例启动成功"
else
    echo "❌ 实例启动超时"
    exit 1
fi

# 获取公网IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 实例信息:"
echo "  实例ID: $INSTANCE_ID"
echo "  公网IP: $PUBLIC_IP"
echo ""
echo "🔧 连接命令:"
echo "  ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
echo ""
echo "⏰ 请等待3-5分钟让系统完成初始化，然后："
echo "1. 连接到实例"
echo "2. 检查初始化状态: sudo tail -f /var/log/user-data.log"
echo "3. 上传并部署Mumble代码"
echo ""
echo "🌐 预期访问地址:"
echo "  http://$PUBLIC_IP (应用启动后)"
