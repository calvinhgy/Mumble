#!/bin/bash

# 简单的Mumble部署脚本 - 创建一个新实例并自动部署

set -e

INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"
REGION="us-east-1"
KEY_NAME="mumble-migration-key"
SECURITY_GROUP_ID="sg-05e7746fc594f6782"

echo "🚀 创建新的Mumble实例并自动部署"
echo "================================="

# 创建包含完整部署逻辑的用户数据脚本
USER_DATA=$(cat << 'EOF'
#!/bin/bash
exec > >(tee /var/log/mumble-auto-deploy.log) 2>&1
echo "开始Mumble自动部署 - $(date)"

# 更新系统
yum update -y
yum install -y git

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_lts.x | bash -
yum install -y nodejs

# 安装MongoDB
cat > /etc/yum.repos.d/mongodb-org-7.0.repo << 'MONGOEOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
MONGOEOF

yum install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 安装PM2
npm install -g pm2

# 安装Nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# 创建应用目录
mkdir -p /opt/mumble/src/backend
mkdir -p /opt/mumble/src/frontend/build
chown -R ec2-user:ec2-user /opt/mumble

# 创建后端应用
cd /opt/mumble/src/backend

# package.json
cat > package.json << 'PKGEOF'
{
  "name": "mumble-backend",
  "version": "1.0.0",
  "description": "Backend server for Mumble app",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "mongoose": "^7.3.4",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1"
  }
}
PKGEOF

# server.js
cat > server.js << 'SERVEREOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mumble', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// 基本路由
app.get('/', (req, res) => {
    res.json({ 
        message: 'Mumble API Server',
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/api/v1/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'mumble-api',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// 模拟音频上传端点
app.post('/api/v1/audio/upload', (req, res) => {
    res.json({
        message: 'Audio upload endpoint (demo)',
        status: 'success',
        timestamp: new Date().toISOString()
    });
});

// 模拟图像生成端点
app.post('/api/v1/generate', (req, res) => {
    res.json({
        message: 'Image generation endpoint (demo)',
        status: 'success',
        imageUrl: 'https://via.placeholder.com/512x512/667eea/ffffff?text=Mumble+Generated',
        timestamp: new Date().toISOString()
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mumble API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
SERVEREOF

# .env文件
cat > .env << 'ENVEOF'
PORT=5000
NODE_ENV=production
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/mumble
ENVEOF

# 安装依赖
npm install

# 创建前端文件
cd /opt/mumble/src/frontend/build

cat > index.html << 'HTMLEOF'
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
        }
        .container {
            text-align: center;
            padding: 3rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 90%;
        }
        .logo { font-size: 4rem; margin-bottom: 1rem; }
        .title { font-size: 3rem; margin-bottom: 1rem; font-weight: 300; }
        .subtitle { font-size: 1.3rem; margin-bottom: 2rem; opacity: 0.9; }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .feature-icon { font-size: 2rem; margin-bottom: 0.5rem; }
        .status {
            background: rgba(0, 255, 0, 0.2);
            padding: 1rem;
            border-radius: 10px;
            margin: 2rem 0;
            border: 1px solid rgba(0, 255, 0, 0.3);
        }
        .btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1rem;
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
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎤</div>
        <h1 class="title">Mumble</h1>
        <p class="subtitle">语音转图像创意应用</p>
        
        <div class="status">
            <h3>🚀 应用已成功部署</h3>
            <p>服务器正在运行中，所有服务已启动</p>
        </div>

        <div class="features">
            <div class="feature">
                <div class="feature-icon">🎵</div>
                <h4>语音录制</h4>
                <p>按住录音，释放创意</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🌍</div>
                <h4>环境感知</h4>
                <p>位置、天气、时间</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🎨</div>
                <h4>AI生成</h4>
                <p>独特的艺术作品</p>
            </div>
        </div>
        
        <div>
            <button class="btn" onclick="checkAPI()">检查API状态</button>
            <a class="btn" href="/api/v1/health" target="_blank">API文档</a>
            <button class="btn" onclick="testGenerate()">测试生成</button>
        </div>
        
        <div id="api-status" class="api-status" style="display: none;"></div>
    </div>

    <script>
        async function checkAPI() {
            const statusDiv = document.getElementById('api-status');
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = '<p>🔄 检查中...</p>';
            
            try {
                const response = await fetch('/api/v1/health');
                const data = await response.json();
                statusDiv.innerHTML = `
                    <h4>✅ API状态正常</h4>
                    <p><strong>服务:</strong> ${data.service}</p>
                    <p><strong>数据库:</strong> ${data.database}</p>
                    <p><strong>时间:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
                `;
                statusDiv.style.background = 'rgba(0, 255, 0, 0.2)';
            } catch (error) {
                statusDiv.innerHTML = `
                    <h4>❌ API连接失败</h4>
                    <p><strong>错误:</strong> ${error.message}</p>
                `;
                statusDiv.style.background = 'rgba(255, 0, 0, 0.2)';
            }
        }
        
        async function testGenerate() {
            const statusDiv = document.getElementById('api-status');
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = '<p>🎨 测试图像生成...</p>';
            
            try {
                const response = await fetch('/api/v1/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: 'test generation' })
                });
                const data = await response.json();
                statusDiv.innerHTML = `
                    <h4>✅ 生成测试成功</h4>
                    <p><strong>状态:</strong> ${data.status}</p>
                    <p><strong>消息:</strong> ${data.message}</p>
                    <img src="${data.imageUrl}" alt="Generated" style="max-width: 200px; margin-top: 1rem; border-radius: 10px;">
                `;
                statusDiv.style.background = 'rgba(0, 255, 0, 0.2)';
            } catch (error) {
                statusDiv.innerHTML = `
                    <h4>❌ 生成测试失败</h4>
                    <p><strong>错误:</strong> ${error.message}</p>
                `;
                statusDiv.style.background = 'rgba(255, 0, 0, 0.2)';
            }
        }
        
        // 页面加载时自动检查API
        window.onload = () => {
            setTimeout(checkAPI, 2000);
        };
    </script>
</body>
</html>
HTMLEOF

# 启动后端服务
cd /opt/mumble/src/backend
pm2 start server.js --name mumble-backend

# 配置Nginx
cat > /etc/nginx/conf.d/mumble.conf << 'NGINXEOF'
server {
    listen 80 default_server;
    server_name _;

    # 前端静态文件
    location / {
        root /opt/mumble/src/frontend/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API代理
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
    }
}
NGINXEOF

# 删除默认配置
rm -f /etc/nginx/conf.d/default.conf

# 测试并重载Nginx
nginx -t && systemctl reload nginx

# 设置开机自启
systemctl enable mongod nginx
pm2 startup
pm2 save

echo "==================================="
echo "Mumble应用部署完成! - $(date)"
echo "==================================="
echo "访问地址: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "API地址: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/v1/health"
echo "==================================="

# 最终状态检查
echo "服务状态检查:"
pm2 status
systemctl status nginx --no-pager -l | head -5
systemctl status mongod --no-pager -l | head -5

echo "部署日志已保存到: /var/log/mumble-auto-deploy.log"
EOF
)

# 终止之前的实例
echo "🛑 终止之前的实例..."
aws ec2 terminate-instances --instance-ids i-0d1554d4b95699232 --region $REGION

# 等待实例终止
echo "⏳ 等待实例终止..."
sleep 30

# 创建新实例
echo "🚀 创建新的自动部署实例..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data "$USER_DATA" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Mumble-Auto-Deploy},{Key=Project,Value=Mumble}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ 新实例创建成功: $INSTANCE_ID"

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
echo "🎉 Mumble自动部署启动成功！"
echo ""
echo "📋 实例信息:"
echo "  实例ID: $INSTANCE_ID"
echo "  公网IP: $PUBLIC_IP"
echo ""
echo "⏰ 部署进度:"
echo "  预计完成时间: 5-8分钟"
echo "  当前状态: 系统初始化中..."
echo ""
echo "🌐 访问地址:"
echo "  前端应用: http://$PUBLIC_IP"
echo "  API接口: http://$PUBLIC_IP/api/v1/health"
echo ""
echo "📝 监控部署:"
echo "  等待5分钟后访问应用"
echo "  如需查看部署日志，请连接实例查看 /var/log/mumble-auto-deploy.log"
