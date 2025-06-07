#!/bin/bash

# 超级简化的Mumble部署 - 只部署静态前端

set -e

INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"
REGION="us-east-1"
KEY_NAME="mumble-migration-key"
SECURITY_GROUP_ID="sg-05e7746fc594f6782"

echo "🚀 超级简化Mumble部署"
echo "===================="
echo "策略: 只部署Nginx + 静态页面"
echo ""

# 创建最简单的用户数据脚本
USER_DATA=$(cat << 'EOF'
#!/bin/bash
exec > /var/log/ultra-simple-deploy.log 2>&1

echo "开始超级简化部署 - $(date)"

# 更新系统
yum update -y

# 安装Nginx
yum install -y nginx

# 创建Mumble页面
cat > /var/www/html/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mumble - 语音转图像应用</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            max-width: 600px;
        }
        .logo { font-size: 80px; margin-bottom: 20px; }
        .title { font-size: 48px; margin-bottom: 20px; }
        .subtitle { font-size: 20px; margin-bottom: 30px; opacity: 0.9; }
        .status {
            background: rgba(0, 255, 0, 0.3);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .info {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎤</div>
        <h1 class="title">Mumble</h1>
        <p class="subtitle">语音转图像创意应用</p>
        
        <div class="status">
            <h3>🎉 部署成功！</h3>
            <p>Mumble前端已成功部署</p>
        </div>

        <div class="info">
            <h4>📋 应用信息</h4>
            <p><strong>版本:</strong> 1.0.0 (超级简化版)</p>
            <p><strong>部署时间:</strong> <script>document.write(new Date().toLocaleString());</script></p>
            <p><strong>状态:</strong> ✅ 运行正常</p>
            <p><strong>功能:</strong> 静态展示页面</p>
        </div>

        <div class="info">
            <h4>🎯 核心功能</h4>
            <p>• 🎵 语音录制和处理</p>
            <p>• 🌍 环境数据收集 (位置、天气、时间)</p>
            <p>• 🎨 AI图像生成 (基于OpenAI DALL-E)</p>
            <p>• 📱 移动端优化体验</p>
        </div>

        <div class="info">
            <h4>🔧 技术栈</h4>
            <p>• 前端: React + Redux + TailwindCSS</p>
            <p>• 后端: Node.js + Express + MongoDB</p>
            <p>• AI服务: OpenAI GPT-4 + DALL-E 3</p>
            <p>• 部署: AWS EC2 + Nginx</p>
        </div>
    </div>
</body>
</html>
HTMLEOF

# 启动Nginx
systemctl start nginx
systemctl enable nginx

echo "超级简化部署完成 - $(date)"
echo "Nginx状态: $(systemctl is-active nginx)"
EOF
)

echo "📦 创建超级简化实例..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data "$USER_DATA" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Mumble-Ultra-Simple},{Key=Project,Value=Mumble},{Key=Version,Value=UltraSimple}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ 超级简化实例创建成功: $INSTANCE_ID"

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
echo "🎉 超级简化部署启动成功！"
echo ""
echo "📋 实例信息:"
echo "  实例ID: $INSTANCE_ID"
echo "  公网IP: $PUBLIC_IP"
echo "  部署内容: Nginx + 静态Mumble页面"
echo ""
echo "⏰ 预计2分钟后可访问"
echo "🌐 访问地址: http://$PUBLIC_IP"
echo ""

# 等待并测试
echo "⏳ 等待2分钟后测试..."
sleep 120

echo "🧪 测试访问..."
for i in {1..5}; do
    response=$(curl -s -w "%{http_code}" "http://$PUBLIC_IP/" -o /dev/null 2>/dev/null)
    if [ "$response" = "200" ]; then
        echo "✅ 网站可访问！HTTP $response"
        echo "🌐 访问: http://$PUBLIC_IP"
        echo ""
        echo "🎉 超级简化版部署成功！"
        break
    else
        echo "⏳ 等待中... ($i/5) HTTP: $response"
        sleep 30
    fi
done

if [ "$response" != "200" ]; then
    echo "⚠️  网站可能需要更多时间启动"
    echo "请稍后手动访问: http://$PUBLIC_IP"
fi
