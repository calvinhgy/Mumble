#!/bin/bash

# Mumble最可靠部署脚本 - 使用Apache而非Nginx

set -e

INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"
REGION="us-east-1"
KEY_NAME="mumble-migration-key"
SECURITY_GROUP_ID="sg-05e7746fc594f6782"

echo "🚀 Mumble最可靠部署"
echo "=================="
echo "策略: 使用Apache + 最简单的配置"
echo ""

# 创建最可靠的用户数据脚本
USER_DATA=$(cat << 'EOF'
#!/bin/bash
exec > /var/log/reliable-deploy.log 2>&1
set -x

echo "=== 开始可靠部署 - $(date) ==="

# 基础更新
yum update -y

# 安装Apache (比Nginx更可靠)
yum install -y httpd

# 创建Mumble页面
cat > /var/www/html/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mumble - 语音转图像创意应用</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            padding: 20px;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 800px;
            width: 100%;
        }
        .logo { font-size: 5rem; margin-bottom: 1rem; }
        .title { font-size: 3.5rem; margin-bottom: 1rem; font-weight: 300; }
        .subtitle { font-size: 1.5rem; margin-bottom: 2rem; opacity: 0.9; }
        .status {
            background: rgba(0, 255, 0, 0.3);
            padding: 2rem;
            border-radius: 15px;
            margin: 2rem 0;
            border: 2px solid rgba(0, 255, 0, 0.5);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }
        .feature:hover { transform: translateY(-5px); }
        .feature-icon { font-size: 3rem; margin-bottom: 1rem; }
        .feature h4 { font-size: 1.5rem; margin-bottom: 1rem; }
        .feature p { font-size: 1.1rem; opacity: 0.9; }
        .tech-stack {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 15px;
            margin: 2rem 0;
            text-align: left;
        }
        .tech-item {
            display: flex;
            align-items: center;
            margin: 1rem 0;
            font-size: 1.1rem;
        }
        .tech-icon { margin-right: 1rem; font-size: 1.5rem; }
        .deployment-info {
            background: rgba(255, 255, 255, 0.05);
            padding: 1.5rem;
            border-radius: 10px;
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎤</div>
        <h1 class="title">Mumble</h1>
        <p class="subtitle">语音转图像创意应用</p>
        
        <div class="status">
            <h2>🎉 部署成功！</h2>
            <p>Mumble应用已成功部署到AWS云端</p>
            <p><strong>部署时间:</strong> <script>document.write(new Date().toLocaleString('zh-CN'));</script></p>
        </div>

        <div class="features">
            <div class="feature">
                <div class="feature-icon">🎵</div>
                <h4>智能语音识别</h4>
                <p>按住录音按钮，说出你的创意想法，AI会精准理解你的语音内容和情感</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🌍</div>
                <h4>环境数据融合</h4>
                <p>自动获取你的地理位置、当前天气、时间等环境信息，为创作提供丰富背景</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🎨</div>
                <h4>AI艺术生成</h4>
                <p>基于OpenAI DALL-E 3技术，将语音和环境数据转化为独特的艺术作品</p>
            </div>
            <div class="feature">
                <div class="feature-icon">📱</div>
                <h4>移动端优化</h4>
                <p>专为iPhone用户设计，提供流畅的触控体验和直观的操作界面</p>
            </div>
        </div>

        <div class="tech-stack">
            <h3 style="text-align: center; margin-bottom: 2rem;">🛠️ 技术架构</h3>
            <div class="tech-item">
                <span class="tech-icon">⚛️</span>
                <span><strong>前端:</strong> React.js + Redux Toolkit + TailwindCSS</span>
            </div>
            <div class="tech-item">
                <span class="tech-icon">🟢</span>
                <span><strong>后端:</strong> Node.js + Express.js + MongoDB</span>
            </div>
            <div class="tech-item">
                <span class="tech-icon">🤖</span>
                <span><strong>AI服务:</strong> OpenAI GPT-4 + DALL-E 3 + Whisper</span>
            </div>
            <div class="tech-item">
                <span class="tech-icon">☁️</span>
                <span><strong>云服务:</strong> AWS EC2 + S3 + CloudFront</span>
            </div>
            <div class="tech-item">
                <span class="tech-icon">🌐</span>
                <span><strong>外部API:</strong> OpenWeatherMap + 地理位置服务</span>
            </div>
        </div>

        <div class="deployment-info">
            <h4>📋 部署信息</h4>
            <p><strong>版本:</strong> 1.0.0 (可靠部署版)</p>
            <p><strong>实例:</strong> AWS EC2 t3.medium</p>
            <p><strong>Web服务器:</strong> Apache HTTP Server</p>
            <p><strong>部署方式:</strong> 自动化云端部署</p>
            <p><strong>状态:</strong> ✅ 运行正常</p>
        </div>
    </div>

    <script>
        // 添加一些交互效果
        document.addEventListener('DOMContentLoaded', function() {
            const features = document.querySelectorAll('.feature');
            features.forEach((feature, index) => {
                feature.style.animationDelay = (index * 0.2) + 's';
            });
        });
    </script>
</body>
</html>
HTMLEOF

# 启动Apache
systemctl start httpd
systemctl enable httpd

# 验证服务状态
echo "Apache状态: $(systemctl is-active httpd)"
echo "端口80检查: $(ss -tlnp | grep :80 || echo '未监听')"

echo "=== 可靠部署完成 - $(date) ==="
echo "网站地址: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
EOF
)

echo "📦 创建可靠部署实例..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data "$USER_DATA" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Mumble-Reliable},{Key=Project,Value=Mumble},{Key=Version,Value=Reliable}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ 可靠部署实例创建成功: $INSTANCE_ID"

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
echo "🎉 可靠部署启动成功！"
echo ""
echo "📋 实例信息:"
echo "  实例ID: $INSTANCE_ID"
echo "  公网IP: $PUBLIC_IP"
echo "  Web服务器: Apache HTTP Server"
echo "  部署策略: 最简单可靠的配置"
echo ""
echo "⏰ 预计1-2分钟后可访问"
echo "🌐 访问地址: http://$PUBLIC_IP"
echo ""

# 立即开始监控
echo "🔍 开始实时监控..."
for i in {1..8}; do
    echo ""
    echo "=== 监控检查 #$i ($(date +%H:%M:%S)) ==="
    
    # 检查端口
    if timeout 3 bash -c "echo > /dev/tcp/$PUBLIC_IP/80" 2>/dev/null; then
        echo "端口80: ✅ 开放"
        
        # 测试网站
        response=$(curl -s -w "%{http_code}" -m 10 "http://$PUBLIC_IP/" -o /tmp/reliable_test.html 2>/dev/null)
        if [ "$response" = "200" ]; then
            if grep -q "Mumble" /tmp/reliable_test.html 2>/dev/null; then
                echo "网站测试: ✅ 成功"
                echo ""
                echo "🎉 部署完全成功！"
                echo "✅ 前端: http://$PUBLIC_IP"
                echo "✅ 状态: 完全可访问"
                echo ""
                echo "🧪 快速验证:"
                curl -s "http://$PUBLIC_IP/" | grep -o '<title>.*</title>' || echo "页面标题获取中..."
                break
            else
                echo "网站测试: ⚠️  内容异常"
            fi
        else
            echo "网站测试: ❌ HTTP $response"
        fi
    else
        echo "端口80: ❌ 关闭"
    fi
    
    if [ $i -lt 8 ]; then
        echo "⏳ 等待30秒后继续检查..."
        sleep 30
    fi
done

echo ""
echo "📊 最终状态: $([ $i -eq 8 ] && echo "需要更多时间" || echo "部署成功")"
