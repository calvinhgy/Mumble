#!/bin/bash

# Mumble 应用上传和部署脚本

set -e

# 配置
INSTANCE_IP="34.228.185.188"
KEY_NAME="mumble-migration-key"
PROJECT_DIR="/home/ec2-user/hgy/Mumble"

echo "🚀 Mumble 应用部署"
echo "=================="
echo "目标实例: $INSTANCE_IP"
echo "项目目录: $PROJECT_DIR"
echo ""

# 检查SSH连接
echo "🔍 检查SSH连接..."
if timeout 10 ssh -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 ec2-user@$INSTANCE_IP "echo 'SSH连接成功'" 2>/dev/null; then
    echo "✅ SSH连接正常"
else
    echo "❌ SSH连接失败，请检查："
    echo "  1. 实例是否完全启动"
    echo "  2. 安全组是否允许SSH(22端口)"
    echo "  3. 密钥文件是否存在: ~/.ssh/$KEY_NAME.pem"
    exit 1
fi

# 等待系统初始化完成
echo "⏳ 等待系统初始化完成..."
sleep 30

# 检查系统初始化状态
echo "🔍 检查系统初始化状态..."
ssh -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no ec2-user@$INSTANCE_IP << 'EOF'
echo "检查系统服务状态..."
sudo systemctl is-active mongod || echo "MongoDB未启动"
sudo systemctl is-active nginx || echo "Nginx未启动"
which node || echo "Node.js未安装"
which pm2 || echo "PM2未安装"
ls -la /opt/mumble || echo "应用目录不存在"
EOF

# 上传项目文件
echo "📦 上传项目文件..."
echo "正在压缩项目文件..."
cd $PROJECT_DIR
tar -czf /tmp/mumble-project.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=uploads \
    --exclude='*.log' \
    .

echo "正在上传到服务器..."
scp -i ~/.ssh/$KEY_NAME.pem /tmp/mumble-project.tar.gz ec2-user@$INSTANCE_IP:/tmp/

# 在服务器上解压和配置
echo "🔧 在服务器上配置应用..."
ssh -i ~/.ssh/$KEY_NAME.pem -o StrictHostKeyChecking=no ec2-user@$INSTANCE_IP << 'EOF'
set -e

echo "解压项目文件..."
cd /opt/mumble
sudo tar -xzf /tmp/mumble-project.tar.gz
sudo chown -R ec2-user:ec2-user /opt/mumble

echo "安装后端依赖..."
cd /opt/mumble/src/backend
npm install

echo "安装前端依赖..."
cd /opt/mumble/src/frontend
npm install

echo "创建环境配置文件..."
cd /opt/mumble/src/backend
cp .env.example .env

# 基本配置
cat > .env << 'ENVEOF'
# 基本配置
PORT=5000
NODE_ENV=development
HOST=0.0.0.0

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/mumble

# OpenAI API配置 (需要用户提供)
OPENAI_API_KEY=your_openai_api_key_here

# 天气API配置 (需要用户提供)
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# 创建上传目录
mkdir -p uploads
ENVEOF

echo "创建前端环境配置..."
cd /opt/mumble/src/frontend
cat > .env << 'ENVEOF'
REACT_APP_API_BASE_URL=http://34.228.185.188:5000/api/v1
REACT_APP_DEBUG_MODE=true
ENVEOF

echo "构建前端应用..."
npm run build

echo "启动后端服务..."
cd /opt/mumble/src/backend
pm2 start server.js --name mumble-backend

echo "配置Nginx..."
sudo tee /etc/nginx/conf.d/mumble.conf > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /opt/mumble/src/frontend/build;
        try_files $uri $uri/ /index.html;
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

sudo nginx -t && sudo systemctl reload nginx

echo "检查服务状态..."
pm2 status
sudo systemctl status nginx --no-pager -l

echo "应用部署完成！"
EOF

# 清理临时文件
rm -f /tmp/mumble-project.tar.gz

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 服务信息:"
echo "  实例IP: $INSTANCE_IP"
echo "  前端地址: http://$INSTANCE_IP"
echo "  API地址: http://$INSTANCE_IP:5000/api/v1/health"
echo ""
echo "⚠️  重要提醒:"
echo "1. 需要配置OpenAI API密钥"
echo "2. 需要配置OpenWeatherMap API密钥"
echo "3. 在生产环境中需要配置HTTPS"
echo ""
echo "🔧 配置API密钥:"
echo "  ssh -i ~/.ssh/$KEY_NAME.pem ec2-user@$INSTANCE_IP"
echo "  cd /opt/mumble/src/backend"
echo "  nano .env  # 编辑API密钥"
echo "  pm2 restart mumble-backend"
echo ""
echo "📝 查看日志:"
echo "  pm2 logs mumble-backend"
echo "  sudo tail -f /var/log/nginx/error.log"
