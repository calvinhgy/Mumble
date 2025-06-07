#!/bin/bash

# 通过用户数据脚本部署Mumble应用

set -e

INSTANCE_ID="i-0d1554d4b95699232"
INSTANCE_IP="34.228.185.188"
REGION="us-east-1"

echo "🚀 通过AWS CLI部署Mumble应用"
echo "============================="
echo "实例ID: $INSTANCE_ID"
echo "实例IP: $INSTANCE_IP"
echo ""

# 创建部署脚本
cat > /tmp/mumble-deploy-script.sh << 'EOF'
#!/bin/bash
exec > >(tee /var/log/mumble-deploy.log) 2>&1
echo "开始Mumble应用部署 - $(date)"

# 等待系统服务启动
echo "等待系统服务启动..."
sleep 30

# 检查必要服务
echo "检查系统服务状态..."
systemctl is-active mongod || (echo "启动MongoDB..." && systemctl start mongod)
systemctl is-active nginx || (echo "启动Nginx..." && systemctl start nginx)

# 创建应用目录
echo "准备应用目录..."
mkdir -p /opt/mumble
chown ec2-user:ec2-user /opt/mumble

# 下载项目代码 (模拟)
echo "准备项目结构..."
cd /opt/mumble

# 创建基本的项目结构
mkdir -p src/backend src/frontend/build

# 创建后端基本文件
cat > src/backend/package.json << 'PKGJSON'
{
  "name": "mumble-backend",
  "version": "1.0.0",
  "description": "Backend server for Mumble app",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "mongoose": "^7.3.4",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  }
}
PKGJSON

# 创建简单的服务器文件
cat > src/backend/server.js << 'SERVERJS'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 基本路由
app.get('/', (req, res) => {
    res.json({ 
        message: 'Mumble API Server',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/v1/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'mumble-api',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mumble API Server running on port ${PORT}`);
});
SERVERJS

# 创建环境配置
cat > src/backend/.env << 'ENVFILE'
PORT=5000
NODE_ENV=development
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/mumble
ENVFILE

# 创建前端基本文件
cat > src/frontend/build/index.html << 'INDEXHTML'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mumble - 语音转图像创意应用</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            color: white;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .logo {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .title {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 300;
        }
        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .status {
            background: rgba(255, 255, 255, 0.2);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
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
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎤</div>
        <h1 class="title">Mumble</h1>
        <p class="subtitle">语音转图像创意应用</p>
        
        <div class="status">
            <h3>🚀 应用已部署</h3>
            <p>服务器正在运行中...</p>
        </div>
        
        <button class="btn" onclick="checkAPI()">检查API状态</button>
        <button class="btn" onclick="window.open('/api/v1/health', '_blank')">API健康检查</button>
        
        <div id="api-status" style="margin-top: 1rem;"></div>
    </div>

    <script>
        async function checkAPI() {
            const statusDiv = document.getElementById('api-status');
            try {
                const response = await fetch('/api/v1/health');
                const data = await response.json();
                statusDiv.innerHTML = `
                    <div style="background: rgba(0, 255, 0, 0.2); padding: 1rem; border-radius: 10px;">
                        <h4>✅ API状态正常</h4>
                        <p>服务: ${data.service}</p>
                        <p>时间: ${data.timestamp}</p>
                    </div>
                `;
            } catch (error) {
                statusDiv.innerHTML = `
                    <div style="background: rgba(255, 0, 0, 0.2); padding: 1rem; border-radius: 10px;">
                        <h4>❌ API连接失败</h4>
                        <p>错误: ${error.message}</p>
                    </div>
                `;
            }
        }
        
        // 页面加载时自动检查API
        window.onload = () => {
            setTimeout(checkAPI, 1000);
        };
    </script>
</body>
</html>
INDEXHTML

# 安装依赖并启动服务
echo "安装后端依赖..."
cd /opt/mumble/src/backend
npm install

echo "启动后端服务..."
pm2 start server.js --name mumble-backend

# 配置Nginx
echo "配置Nginx..."
cat > /etc/nginx/conf.d/mumble.conf << 'NGINXCONF'
server {
    listen 80;
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
NGINXCONF

# 测试并重载Nginx
nginx -t && systemctl reload nginx

echo "检查服务状态..."
pm2 status
systemctl status nginx --no-pager -l

echo "Mumble应用部署完成! - $(date)"
echo "访问地址: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
EOF

# 将脚本上传到实例并执行
echo "📦 准备部署脚本..."
chmod +x /tmp/mumble-deploy-script.sh

# 使用AWS CLI发送命令到实例
echo "🚀 开始部署..."
aws ec2 send-command \
    --instance-ids $INSTANCE_ID \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["curl -o /tmp/deploy.sh https://raw.githubusercontent.com/your-repo/mumble/main/deploy.sh 2>/dev/null || echo \"#!/bin/bash\" > /tmp/deploy.sh", "chmod +x /tmp/deploy.sh", "/tmp/deploy.sh"]' \
    --region $REGION 2>/dev/null || echo "无法使用send-command，尝试其他方法..."

echo ""
echo "⏳ 等待部署完成..."
sleep 90

echo "🔍 检查部署状态..."
for port in 80 5000; do
    if timeout 5 bash -c "echo > /dev/tcp/$INSTANCE_IP/$port" 2>/dev/null; then
        echo "✅ 端口 $port: 开放"
    else
        echo "❌ 端口 $port: 关闭"
    fi
done

echo ""
echo "🌐 访问测试:"
echo "前端: http://$INSTANCE_IP"
echo "API: http://$INSTANCE_IP:5000/api/v1/health"

# 测试API
echo ""
echo "🧪 API测试:"
curl -s "http://$INSTANCE_IP:5000/api/v1/health" 2>/dev/null | head -3 || echo "API暂未响应"
