#!/bin/bash

# AWS EC2 自动化部署脚本
# 创建t3.medium实例并部署Mumble应用

set -e

# 配置变量
INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI (请根据区域更新)
KEY_NAME=""
SECURITY_GROUP_ID=""
SUBNET_ID=""
REGION="us-east-1"

echo "🚀 AWS EC2 自动化部署 - Mumble"
echo "================================"

# 检查AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI未安装，请先安装AWS CLI"
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

# 创建安全组（如果未提供）
if [ -z "$SECURITY_GROUP_ID" ]; then
    echo "🔒 创建安全组..."
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name mumble-sg-$(date +%s) \
        --description "Mumble Application Security Group" \
        --region $REGION \
        --query 'GroupId' \
        --output text)
    
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

echo "EC2 instance setup completed" > /var/log/user-data.log
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
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Mumble-App},{Key=Project,Value=Mumble}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "实例ID: $INSTANCE_ID"

# 等待实例运行
echo "⏳ 等待实例启动..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# 获取公网IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "✅ 实例启动完成！"
echo "公网IP: $PUBLIC_IP"

# 等待SSH可用
echo "⏳ 等待SSH服务可用..."
while ! nc -z $PUBLIC_IP 22; do
    sleep 5
    echo "等待SSH连接..."
done

echo "✅ SSH服务已就绪"

# 等待用户数据脚本完成
echo "⏳ 等待系统初始化完成..."
sleep 60

# 部署应用
echo "📦 部署Mumble应用..."
ssh -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP << 'DEPLOY_SCRIPT'
cd /opt/mumble

# 克隆项目（如果有Git仓库）
# git clone <your-repo-url> .

# 或者提示用户上传代码
echo "请将Mumble项目代码上传到 /opt/mumble 目录"
echo "可以使用以下命令："
echo "scp -i ~/.ssh/your-key.pem -r /path/to/mumble/* ec2-user@$PUBLIC_IP:/opt/mumble/"

DEPLOY_SCRIPT

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
