#!/bin/bash
# EC2实例初始化脚本

# 更新系统
yum update -y

# 安装必要的软件包
yum install -y git curl wget unzip

# 安装Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装PM2进程管理器
npm install -g pm2

# 安装Nginx
yum install -y nginx

# 创建应用目录
mkdir -p /opt/mumble
cd /opt/mumble

# 克隆项目代码
git clone https://github.com/calvinhgy/Mumble.git .

# 设置环境变量
cat > /opt/mumble/.env << EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas Connection (需要手动配置)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mumble?retryWrites=true&w=majority

# OpenAI API (需要手动配置)
OPENAI_API_KEY=your_openai_api_key

# Weather API (需要手动配置)
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)

# AWS S3 Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=${s3_bucket}
STORAGE_TYPE=s3

# Application URLs
FRONTEND_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000
BACKEND_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000
EOF

# 安装后端依赖
cd /opt/mumble/src/backend
npm install --production

# 安装前端依赖并构建
cd /opt/mumble/src/frontend
npm install
npm run build

# 配置Nginx
cat > /etc/nginx/conf.d/mumble.conf << 'EOF'
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /opt/mumble/src/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        
        # 增加超时时间（用于AI API调用）
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 文件上传大小限制
    client_max_body_size 10M;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# 创建PM2配置文件
cat > /opt/mumble/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mumble-backend',
    script: './src/backend/server.js',
    cwd: '/opt/mumble',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/mumble/error.log',
    out_file: '/var/log/mumble/out.log',
    log_file: '/var/log/mumble/combined.log',
    time: true
  }]
};
EOF

# 创建日志目录
mkdir -p /var/log/mumble
chown -R ec2-user:ec2-user /var/log/mumble

# 设置文件权限
chown -R ec2-user:ec2-user /opt/mumble

# 启动服务
systemctl enable nginx
systemctl start nginx

# 使用PM2启动应用
cd /opt/mumble
sudo -u ec2-user pm2 start ecosystem.config.js
sudo -u ec2-user pm2 save
sudo -u ec2-user pm2 startup

# 配置防火墙
systemctl enable firewalld
systemctl start firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --reload

# 创建健康检查脚本
cat > /opt/mumble/health-check.sh << 'EOF'
#!/bin/bash
# 健康检查脚本

# 检查Nginx状态
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is not running, restarting..."
    systemctl restart nginx
fi

# 检查PM2应用状态
if ! pm2 list | grep -q "mumble-backend.*online"; then
    echo "Backend application is not running, restarting..."
    cd /opt/mumble
    pm2 restart mumble-backend
fi

# 检查磁盘空间
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Warning: Disk usage is ${DISK_USAGE}%"
    # 清理日志文件
    find /var/log -name "*.log" -type f -mtime +7 -delete
    pm2 flush
fi

# 检查内存使用
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
    echo "Warning: Memory usage is ${MEMORY_USAGE}%"
    pm2 restart mumble-backend
fi
EOF

chmod +x /opt/mumble/health-check.sh

# 添加定时任务
echo "*/5 * * * * /opt/mumble/health-check.sh >> /var/log/mumble/health-check.log 2>&1" | crontab -

# 安装CloudWatch代理（可选）
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

echo "EC2 instance setup completed!"
