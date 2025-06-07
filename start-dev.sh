#!/bin/bash

# Mumble 开发环境启动脚本

echo "🚀 启动 Mumble 开发环境..."

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node_version=$(node -v)
echo "Node.js版本: $node_version"

# 检查npm版本
npm_version=$(npm -v)
echo "npm版本: $npm_version"

# 检查环境变量文件
echo "🔧 检查环境配置..."
if [ ! -f "src/backend/.env" ]; then
    echo "⚠️  后端环境变量文件不存在，从示例文件创建..."
    cp src/backend/.env.example src/backend/.env
    echo "✅ 已创建 src/backend/.env，请配置必要的API密钥"
fi

if [ ! -f "src/frontend/.env" ]; then
    echo "⚠️  前端环境变量文件不存在，从示例文件创建..."
    cp src/frontend/.env.example src/frontend/.env
    echo "✅ 已创建 src/frontend/.env"
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
cd src/backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ 后端依赖已存在"
fi

# 启动后端服务器
echo "🔧 启动后端服务器..."
npm run dev &
BACKEND_PID=$!
echo "后端服务器PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 安装前端依赖
echo "📦 安装前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ 前端依赖已存在"
fi

# 启动前端开发服务器
echo "🎨 启动前端开发服务器..."
npm start &
FRONTEND_PID=$!
echo "前端服务器PID: $FRONTEND_PID"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

echo "🎉 Mumble 开发环境启动完成！"
echo ""
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:5000"
echo "📚 API文档: http://localhost:5000/api/v1/health"
echo ""
echo "💡 提示："
echo "  - 按 Ctrl+C 停止所有服务"
echo "  - 查看日志请检查终端输出"
echo "  - 确保已配置必要的API密钥"
echo ""

# 等待用户中断
wait

# 清理进程
echo "🛑 停止服务..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "✅ 服务已停止"
