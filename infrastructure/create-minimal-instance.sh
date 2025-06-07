#!/bin/bash

# 创建最小化Mumble实例 - 快速部署版本

set -e

INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"
REGION="us-east-1"
KEY_NAME="mumble-migration-key"
SECURITY_GROUP_ID="sg-05e7746fc594f6782"

echo "🚀 创建最小化Mumble实例"
echo "======================"

# 创建最简化的用户数据脚本
USER_DATA=$(cat << 'EOF'
#!/bin/bash
exec > >(tee /var/log/minimal-deploy.log) 2>&1
echo "开始最小化部署 - $(date)"

# 基本系统更新
yum update -y

# 安装Nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# 创建简单的HTML页面
cat > /var/www/html/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
    <title>Mumble - 部署成功</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: #667eea; color: white; }
        .container { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎤 Mumble</h1>
        <h2>最小化部署成功！</h2>
        <p>实例已启动并运行</p>
        <p>部署时间: $(date)</p>
        <p>状态: ✅ 正常运行</p>
    </div>
</body>
</html>
HTMLEOF

# 配置Nginx
cat > /etc/nginx/conf.d/mumble-minimal.conf << 'NGINXEOF'
server {
    listen 80 default_server;
    server_name _;
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
NGINXEOF

# 删除默认配置
rm -f /etc/nginx/conf.d/default.conf

# 重启Nginx
systemctl restart nginx

echo "最小化部署完成 - $(date)"
echo "Nginx状态: $(systemctl is-active nginx)"
EOF
)

echo "📦 创建实例..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data "$USER_DATA" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Mumble-Minimal},{Key=Project,Value=Mumble}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ 实例创建成功: $INSTANCE_ID"

# 等待实例运行
echo "⏳ 等待实例启动..."
timeout 300 aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# 获取公网IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo ""
echo "🎉 最小化实例创建完成！"
echo ""
echo "📋 实例信息:"
echo "  实例ID: $INSTANCE_ID"
echo "  公网IP: $PUBLIC_IP"
echo ""
echo "⏰ 预计2-3分钟后可访问"
echo "🌐 访问地址: http://$PUBLIC_IP"
echo ""

# 等待并测试
echo "⏳ 等待服务启动..."
sleep 120

echo "🧪 测试访问..."
for i in {1..5}; do
    if curl -s "http://$PUBLIC_IP/" | grep -q "Mumble"; then
        echo "✅ 网站可访问！"
        echo "🌐 访问: http://$PUBLIC_IP"
        break
    else
        echo "⏳ 等待中... ($i/5)"
        sleep 30
    fi
done
