#!/bin/bash

# AWS EC2 自动化部署脚本 - 修复版本
# 创建t3.medium实例并部署Mumble应用

set -e

# 配置变量
INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI (请根据区域更新)
KEY_NAME=""
SECURITY_GROUP_ID=""
SUBNET_ID=""
REGION="us-east-1"

# 超时设置
SSH_TIMEOUT=300  # 5分钟超时
INSTANCE_TIMEOUT=600  # 10分钟超时

echo "🚀 AWS EC2 自动化部署 - Mumble (修复版本)"
echo "================================"

# 检查AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI未安装，请先安装AWS CLI"
    exit 1
fi

# 检查nc命令
if ! command -v nc &> /dev/null; then
    echo "❌ nc命令未找到，请安装netcat"
    exit 1
fi

# 检查参数
if [ "$#" -lt 1 ]; then
    echo "使用方法: $0 <密钥对名称> [安全组ID] [子网ID] [区域]"
    echo ""
    echo "示例:"
    echo "  $0 my-key-pair"
    echo "  $0 my-key-pair sg-12345678 subnet-12345678 us-west-2"
    exit 1
fi

KEY_NAME=$1
SECURITY_GROUP_ID=${2:-""}
SUBNET_ID=${3:-""}
REGION=${4:-"us-east-1"}

echo "密钥对: $KEY_NAME"
echo "区域: $REGION"
echo "实例类型: $INSTANCE_TYPE"
echo ""

# 验证密钥对存在
echo "🔍 验证密钥对..."
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$REGION" &>/dev/null; then
    echo "❌ 密钥对 '$KEY_NAME' 不存在"
    exit 1
fi

# 创建安全组（如果未提供）
if [ -z "$SECURITY_GROUP_ID" ]; then
    echo "🔒 创建安全组..."
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name mumble-sg-$(date +%s) \
        --description "Mumble Application Security Group" \
        --region $REGION \
        --query 'GroupId' \
        --output text)
    
    if [ $? -ne 0 ]; then
        echo "❌ 创建安全组失败"
        exit 1
    fi
    
    echo "创建的安全组ID: $SECURITY_GROUP_ID"
    
    # 配置安全组规则
    echo "🔧 配置安全组规则..."
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0 \
        --region $REGION
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region $REGION
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region $REGION
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp \
        --port 3000 \
        --cidr 0.0.0.0/0 \
        --region $REGION
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp \
        --port 5000 \
        --cidr 0.0.0.0/0 \
        --region $REGION
fi

# 创建用户数据脚本
USER_DATA=$(cat <<'EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log) 2>&1
echo "Starting user data script at $(date)"

yum update -y
yum install -y git

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_lts.x | bash -
yum install -y nodejs

# 安装MongoDB
cat > /etc/yum.repos.d/mongodb-org-7.0.repo <<EOL
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOL

yum install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 安装PM2
npm install -g pm2

# 创建应用目录
mkdir -p /opt/mumble
chown ec2-user:ec2-user /opt/mumble

# 安装Nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

echo "EC2 instance setup completed at $(date)" >> /var/log/user-data.log
EOF
)

# 启动EC2实例
echo "🚀 启动EC2实例..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    $([ -n "$SUBNET_ID" ] && echo "--subnet-id $SUBNET_ID") \
    --user-data "$USER_DATA" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Mumble-App-Fixed},{Key=Project,Value=Mumble}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

if [ $? -ne 0 ] || [ -z "$INSTANCE_ID" ]; then
    echo "❌ 启动实例失败"
    exit 1
fi

echo "实例ID: $INSTANCE_ID"

# 等待实例运行（带超时）
echo "⏳ 等待实例启动..."
WAIT_START=$(date +%s)
while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - WAIT_START))
    
    if [ $ELAPSED -gt $INSTANCE_TIMEOUT ]; then
        echo "❌ 实例启动超时 (${INSTANCE_TIMEOUT}秒)"
        echo "正在终止实例..."
        aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION
        exit 1
    fi
    
    INSTANCE_STATE=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --region $REGION \
        --query 'Reservations[0].Instances[0].State.Name' \
        --output text)
    
    if [ "$INSTANCE_STATE" = "running" ]; then
        break
    elif [ "$INSTANCE_STATE" = "terminated" ] || [ "$INSTANCE_STATE" = "stopping" ]; then
        echo "❌ 实例启动失败，状态: $INSTANCE_STATE"
        exit 1
    fi
    
    echo "实例状态: $INSTANCE_STATE (已等待 ${ELAPSED}秒)"
    sleep 10
done

# 获取公网IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
    echo "❌ 无法获取公网IP地址"
    exit 1
fi

echo "公网IP: $PUBLIC_IP"

# 等待SSH可用（带超时和重试机制）
echo "⏳ 等待SSH服务可用..."
SSH_START=$(date +%s)
SSH_READY=false

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - SSH_START))
    
    if [ $ELAPSED -gt $SSH_TIMEOUT ]; then
        echo "❌ SSH连接超时 (${SSH_TIMEOUT}秒)"
        echo "可能的原因："
        echo "  1. 实例启动时间过长"
        echo "  2. 安全组配置问题"
        echo "  3. 网络连接问题"
        echo ""
        echo "实例信息："
        echo "  实例ID: $INSTANCE_ID"
        echo "  公网IP: $PUBLIC_IP"
        echo "  请手动检查实例状态"
        exit 1
    fi
    
    # 测试SSH连接
    if timeout 5 nc -z $PUBLIC_IP 22 2>/dev/null; then
        SSH_READY=true
        break
    fi
    
    echo "等待SSH连接... (已等待 ${ELAPSED}秒)"
    sleep 5
done

if [ "$SSH_READY" = true ]; then
    echo "✅ SSH服务已就绪"
else
    echo "❌ SSH服务未就绪"
    exit 1
fi

# 等待用户数据脚本完成
echo "⏳ 等待系统初始化完成..."
sleep 60

# 测试SSH连接
echo "🔧 测试SSH连接..."
if timeout 10 ssh -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 ec2-user@$PUBLIC_IP "echo 'SSH连接成功'" 2>/dev/null; then
    echo "✅ SSH连接测试成功"
else
    echo "⚠️  SSH连接测试失败，但实例已创建"
    echo "请稍后手动连接测试"
fi

echo ""
echo "🎉 EC2实例创建完成！"
echo ""
echo "📋 实例信息:"
echo "  实例ID: $INSTANCE_ID"
echo "  公网IP: $PUBLIC_IP"
echo "  实例类型: $INSTANCE_TYPE"
echo "  安全组: $SECURITY_GROUP_ID"
echo ""
echo "🔧 连接命令:"
echo "  ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
echo ""
echo "📦 部署步骤:"
echo "1. 上传代码: scp -i ~/.ssh/$KEY_NAME.pem -r ./Mumble/* ec2-user@$PUBLIC_IP:/opt/mumble/"
echo "2. 连接服务器: ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
echo "3. 运行部署: cd /opt/mumble && ./infrastructure/deploy.sh"
echo ""
echo "🌐 访问地址:"
echo "  应用: http://$PUBLIC_IP"
echo "  API: http://$PUBLIC_IP:5000/api/v1/health"
echo ""
echo "📝 日志查看:"
echo "  用户数据日志: sudo tail -f /var/log/user-data.log"
echo "  系统日志: sudo journalctl -f"
