#!/bin/bash

# Mumble 生产环境部署脚本

set -e

echo "🚀 开始部署 Mumble 到生产环境..."

# 检查当前目录
if [ ! -f "README.md" ] || [ ! -d "src" ]; then
    echo "❌ 错误：请在Mumble项目根目录运行此脚本"
    exit 1
fi

# 检查环境变量文件
echo "🔧 检查环境配置..."
if [ ! -f "src/backend/.env" ]; then
    echo "⚠️  创建后端环境变量文件..."
    cp src/backend/.env.example src/backend/.env 2>/dev/null || {
        echo "创建默认环境变量文件..."
        cat > src/backend/.env <<EOF
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/mumble

# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# 天气API配置
OPENWEATHER_API_KEY=your_openweather_api_key_here

# 服务器配置
PORT=5000
NODE_ENV=production

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# JWT配置
JWT_SECRET=your_jwt_secret_here
EOF
    }
    echo "⚠️  请编辑 src/backend/.env 配置必要的API密钥"
fi

if [ ! -f "src/frontend/.env" ]; then
    echo "⚠️  创建前端环境变量文件..."
    cat > src/frontend/.env <<EOF
# API配置
REACT_APP_API_BASE_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000/api/v1

# 功能开关
REACT_APP_DEBUG_MODE=false
REACT_APP_MOCK_API=false
EOF
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
cd src/backend
npm install --production

# 创建上传目录
mkdir -p uploads

# 安装前端依赖并构建
echo "📦 构建前端应用..."
cd ../frontend
npm install
npm run build

# 回到项目根目录
cd ../..

# 停止现有服务（如果存在）
echo "🛑 停止现有服务..."
sudo systemctl stop mumble-backend 2>/dev/null || true
pm2 stop all 2>/dev/null || true

# 使用PM2启动后端服务
echo "🔧 启动后端服务..."
cd src/backend
pm2 start ecosystem.config.js --env production 2>/dev/null || {
    echo "创建PM2配置文件..."
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'mumble-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF
    pm2 start ecosystem.config.js --env production
}

# 保存PM2配置
pm2 save
pm2 startup

# 配置Nginx（如果需要）
echo "🔧 配置Web服务器..."
if command -v nginx &> /dev/null; then
    echo "检测到Nginx，配置反向代理..."
    sudo tee /etc/nginx/conf.d/mumble.conf > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /opt/mumble/src/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    sudo nginx -t && sudo systemctl reload nginx
else
    echo "未检测到Nginx，使用简单HTTP服务器..."
    cd ../frontend
    pm2 serve build 3000 --name mumble-frontend --spa
fi

# 检查服务状态
echo "✅ 检查服务状态..."
sleep 3
pm2 status

# 测试API连接
echo "🧪 测试API连接..."
if curl -f http://localhost:5000/api/v1/health > /dev/null 2>&1; then
    echo "✅ 后端API正常运行"
else
    echo "⚠️  后端API可能未正常启动，请检查日志: pm2 logs mumble-backend"
fi

# 获取公网IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")

echo ""
echo "🎉 Mumble 部署完成！"
echo ""
echo "📱 访问地址:"
echo "  前端: http://$PUBLIC_IP"
echo "  API:  http://$PUBLIC_IP:5000/api/v1/health"
echo ""
echo "🔧 管理命令:"
echo "  查看日志: pm2 logs"
echo "  重启服务: pm2 restart all"
echo "  停止服务: pm2 stop all"
echo "  服务状态: pm2 status"
echo ""
echo "⚠️  重要提醒:"
echo "1. 请配置 src/backend/.env 中的API密钥"
echo "2. 确保AWS安全组允许相应端口访问"
echo "3. 考虑配置HTTPS证书用于生产环境"
