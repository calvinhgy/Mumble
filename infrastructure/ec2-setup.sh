#!/bin/bash

# Mumble EC2 t3.medium 实例设置脚本
# 用于在新的EC2实例上快速部署Mumble应用

set -e

echo "🚀 开始设置 Mumble EC2 t3.medium 实例..."

# 更新系统
echo "📦 更新系统包..."
sudo yum update -y

# 安装基础工具
echo "🔧 安装基础工具..."
sudo yum install -y git curl wget vim htop

# 安装Node.js (使用NodeSource仓库安装最新LTS版本)
echo "📦 安装 Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs

# 验证Node.js和npm版本
echo "✅ 验证安装版本..."
node_version=$(node -v)
npm_version=$(npm -v)
echo "Node.js版本: $node_version"
echo "npm版本: $npm_version"

# 安装MongoDB
echo "📦 安装 MongoDB..."
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo > /dev/null <<EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF

sudo yum install -y mongodb-org

# 启动并启用MongoDB
echo "🔧 配置 MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装PM2用于生产环境进程管理
echo "📦 安装 PM2..."
sudo npm install -g pm2

# 创建应用目录
echo "📁 创建应用目录..."
sudo mkdir -p /opt/mumble
sudo chown ec2-user:ec2-user /opt/mumble

# 配置防火墙（如果需要）
echo "🔒 配置安全组..."
echo "请确保在AWS控制台中配置以下安全组规则："
echo "- HTTP (80): 0.0.0.0/0"
echo "- HTTPS (443): 0.0.0.0/0"
echo "- Custom TCP (3000): 0.0.0.0/0 (开发环境)"
echo "- Custom TCP (5000): 0.0.0.0/0 (API)"
echo "- SSH (22): 你的IP地址"

# 创建系统服务文件
echo "🔧 创建系统服务..."
sudo tee /etc/systemd/system/mumble-backend.service > /dev/null <<EOF
[Unit]
Description=Mumble Backend Service
After=network.target mongod.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/mumble/src/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo "✅ EC2实例基础设置完成！"
echo ""
echo "📋 下一步："
echo "1. 克隆你的Mumble项目到 /opt/mumble"
echo "2. 配置环境变量"
echo "3. 安装依赖并启动服务"
echo ""
echo "💡 使用以下命令完成部署："
echo "cd /opt/mumble && ./infrastructure/deploy.sh"
