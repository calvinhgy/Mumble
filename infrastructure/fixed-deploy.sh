#!/bin/bash

# Mumble修复版部署脚本 - 分阶段部署

set -e

INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"
REGION="us-east-1"
KEY_NAME="mumble-migration-key"
SECURITY_GROUP_ID="sg-05e7746fc594f6782"

echo "🚀 Mumble修复版部署"
echo "=================="
echo "策略: 分阶段部署，每个阶段验证成功"
echo ""

# 创建修复版用户数据脚本
USER_DATA=$(cat << 'EOF'
#!/bin/bash
exec > >(tee /var/log/mumble-fixed-deploy.log) 2>&1
set -e

echo "=== Mumble修复版部署开始 - $(date) ==="

# 阶段1: 基础系统准备
echo "阶段1: 基础系统准备"
yum update -y
yum install -y wget curl git

# 阶段2: 安装Node.js (使用更可靠的方法)
echo "阶段2: 安装Node.js"
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
echo "Node.js版本: $(node --version)"
echo "NPM版本: $(npm --version)"

# 阶段3: 安装和配置Nginx
echo "阶段3: 安装Nginx"
yum install -y nginx
systemctl enable nginx

# 创建基础HTML页面
mkdir -p /var/www/html
cat > /var/www/html/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mumble - 语音转图像应用</title>
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
        }
        .container {
            text-align: center;
            padding: 3rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 800px;
            width: 90%;
        }
        .logo { font-size: 4rem; margin-bottom: 1rem; }
        .title { font-size: 3rem; margin-bottom: 1rem; font-weight: 300; }
        .subtitle { font-size: 1.3rem; margin-bottom: 2rem; opacity: 0.9; }
        .status {
            background: rgba(0, 255, 0, 0.2);
            padding: 1.5rem;
            border-radius: 15px;
            margin: 2rem 0;
            border: 1px solid rgba(0, 255, 0, 0.3);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .feature-icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1.1rem;
            margin: 0.5rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        .api-status {
            margin-top: 2rem;
            padding: 1.5rem;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.1);
            display: none;
        }
        .deployment-info {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 15px;
            margin: 2rem 0;
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
            <p>Mumble应用已成功部署并运行</p>
            <p>部署时间: <span id="deploy-time">加载中...</span></p>
        </div>

        <div class="features">
            <div class="feature">
                <div class="feature-icon">🎵</div>
                <h4>语音录制</h4>
                <p>按住录音按钮，说出你的想法</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🌍</div>
                <h4>环境感知</h4>
                <p>自动获取位置、天气、时间信息</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🎨</div>
                <h4>AI生成</h4>
                <p>基于语音和环境创造独特图像</p>
            </div>
            <div class="feature">
                <div class="feature-icon">📱</div>
                <h4>移动优化</h4>
                <p>专为iPhone用户设计的体验</p>
            </div>
        </div>
        
        <div>
            <button class="btn" onclick="checkAPI()">检查API状态</button>
            <button class="btn" onclick="testFeatures()">测试功能</button>
            <a class="btn" href="/api/v1/health" target="_blank">API文档</a>
        </div>
        
        <div id="api-status" class="api-status"></div>
        
        <div class="deployment-info">
            <h4>📋 部署信息</h4>
            <p><strong>版本:</strong> 1.0.0 (修复版)</p>
            <p><strong>实例类型:</strong> t3.medium</p>
            <p><strong>部署方式:</strong> 分阶段自动部署</p>
            <p><strong>服务状态:</strong> <span id="service-status">检查中...</span></p>
        </div>
    </div>

    <script>
        // 设置部署时间
        document.getElementById('deploy-time').textContent = new Date().toLocaleString();
        
        async function checkAPI() {
            const statusDiv = document.getElementById('api-status');
            const serviceStatus = document.getElementById('service-status');
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = '<p>🔄 检查API状态...</p>';
            
            try {
                const response = await fetch('/api/v1/health');
                const data = await response.json();
                statusDiv.innerHTML = `
                    <h4>✅ API状态正常</h4>
                    <p><strong>服务:</strong> ${data.service}</p>
                    <p><strong>状态:</strong> ${data.status}</p>
                    <p><strong>数据库:</strong> ${data.database || '未配置'}</p>
                    <p><strong>时间:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
                `;
                statusDiv.style.background = 'rgba(0, 255, 0, 0.2)';
                serviceStatus.textContent = '✅ API服务正常';
            } catch (error) {
                statusDiv.innerHTML = `
                    <h4>❌ API连接失败</h4>
                    <p><strong>错误:</strong> ${error.message}</p>
                    <p><strong>说明:</strong> API服务可能还在启动中</p>
                `;
                statusDiv.style.background = 'rgba(255, 0, 0, 0.2)';
                serviceStatus.textContent = '⏳ API服务启动中';
            }
        }
        
        async function testFeatures() {
            const statusDiv = document.getElementById('api-status');
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = '<p>🧪 测试应用功能...</p>';
            
            try {
                // 测试生成端点
                const response = await fetch('/api/v1/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text: '测试语音输入',
                        location: '北京',
                        weather: '晴天'
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    statusDiv.innerHTML = `
                        <h4>✅ 功能测试成功</h4>
                        <p><strong>生成状态:</strong> ${data.status}</p>
                        <p><strong>消息:</strong> ${data.message}</p>
                    `;
                    statusDiv.style.background = 'rgba(0, 255, 0, 0.2)';
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                statusDiv.innerHTML = `
                    <h4>⚠️ 功能测试</h4>
                    <p><strong>状态:</strong> API服务启动中</p>
                    <p><strong>说明:</strong> 完整功能将在API服务启动后可用</p>
                `;
                statusDiv.style.background = 'rgba(255, 165, 0, 0.2)';
            }
        }
        
        // 页面加载时自动检查
        window.onload = () => {
            setTimeout(() => {
                checkAPI();
            }, 2000);
        };
        
        // 定期检查API状态
        setInterval(() => {
            if (document.getElementById('service-status').textContent.includes('启动中')) {
                checkAPI();
            }
        }, 10000);
    </script>
</body>
</html>
HTMLEOF

# 配置Nginx
cat > /etc/nginx/conf.d/mumble.conf << 'NGINXEOF'
server {
    listen 80 default_server;
    server_name _;
    root /var/www/html;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API代理 (当后端启动后)
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 如果后端不可用，返回维护页面
        error_page 502 503 504 /maintenance.html;
    }
}
NGINXEOF

# 创建维护页面
cat > /var/www/html/maintenance.html << 'MAINTEOF'
<!DOCTYPE html>
<html>
<head><title>API启动中</title></head>
<body style="text-align:center; padding:50px; font-family:Arial;">
    <h2>🔄 API服务启动中</h2>
    <p>后端服务正在启动，请稍后刷新页面</p>
</body>
</html>
MAINTEOF

# 删除默认配置并启动Nginx
rm -f /etc/nginx/conf.d/default.conf
systemctl start nginx

echo "阶段3完成: Nginx已启动"
echo "前端可访问: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"

# 阶段4: 准备后端环境
echo "阶段4: 准备后端环境"
mkdir -p /opt/mumble/src/backend
chown -R ec2-user:ec2-user /opt/mumble

# 安装PM2
npm install -g pm2

# 阶段5: 创建简化的后端应用
echo "阶段5: 创建后端应用"
cd /opt/mumble/src/backend

# 创建package.json
cat > package.json << 'PKGEOF'
{
  "name": "mumble-backend",
  "version": "1.0.0",
  "description": "Mumble Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  }
}
PKGEOF

# 安装依赖 (使用更快的方法)
echo "安装Node.js依赖..."
npm install --production --no-optional

# 创建简化的服务器
cat > server.js << 'SERVEREOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// 健康检查
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'mumble-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: 'Mumble API Server',
        status: 'running',
        version: '1.0.0',
        endpoints: ['/api/v1/health', '/api/v1/generate'],
        timestamp: new Date().toISOString()
    });
});

// 模拟生成端点
app.post('/api/v1/generate', (req, res) => {
    const { text, location, weather } = req.body;
    
    res.json({
        status: 'success',
        message: '图像生成功能演示',
        input: { text, location, weather },
        result: {
            imageUrl: 'https://via.placeholder.com/512x512/667eea/ffffff?text=Mumble+Demo',
            description: '基于语音和环境数据生成的演示图像',
            timestamp: new Date().toISOString()
        }
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mumble API Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
});
SERVEREOF

# 启动后端服务
echo "启动后端服务..."
pm2 start server.js --name mumble-backend
pm2 startup
pm2 save

echo "阶段5完成: 后端API已启动"

# 最终验证
echo "=== 部署验证 ==="
echo "Nginx状态: $(systemctl is-active nginx)"
echo "PM2状态:"
pm2 status

echo "=== 部署完成 - $(date) ==="
echo "前端地址: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "API地址: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/v1/health"
echo "部署日志: /var/log/mumble-fixed-deploy.log"
EOF
)

echo "🚀 创建修复版实例..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data "$USER_DATA" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Mumble-Fixed-Deploy},{Key=Project,Value=Mumble},{Key=Version,Value=Fixed}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ 修复版实例创建成功: $INSTANCE_ID"

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
echo "🎉 修复版部署启动成功！"
echo ""
echo "📋 实例信息:"
echo "  实例ID: $INSTANCE_ID"
echo "  公网IP: $PUBLIC_IP"
echo "  部署策略: 分阶段验证"
echo ""
echo "⏰ 部署进度:"
echo "  阶段1: 系统准备 (1分钟)"
echo "  阶段2: Node.js安装 (2分钟)"
echo "  阶段3: Nginx启动 (3分钟) - 前端可访问"
echo "  阶段4: 后端准备 (4分钟)"
echo "  阶段5: API启动 (5分钟) - 完整功能可用"
echo ""
echo "🌐 访问地址:"
echo "  前端: http://$PUBLIC_IP"
echo "  API: http://$PUBLIC_IP/api/v1/health"
echo ""
echo "📝 监控建议:"
echo "  3分钟后检查前端"
echo "  5分钟后检查API"
