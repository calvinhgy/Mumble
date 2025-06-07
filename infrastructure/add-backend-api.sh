#!/bin/bash

# 在当前实例上添加Node.js后端API服务

set -e

INSTANCE_IP="100.24.37.4"
INSTANCE_ID="i-0d00f36e59c0bb47e"
KEY_NAME="mumble-migration-key"

echo "🚀 为Mumble添加后端API服务"
echo "=========================="
echo "目标实例: $INSTANCE_IP"
echo "策略: 在现有Apache基础上添加Node.js API"
echo ""

# 由于没有SSH密钥，我们需要通过用户数据更新来添加后端
# 创建一个新的用户数据脚本来安装Node.js和API

echo "📦 创建后端安装脚本..."

# 创建后端安装脚本内容
cat > /tmp/install-backend.sh << 'EOF'
#!/bin/bash
exec >> /var/log/backend-install.log 2>&1
set -x

echo "=== 开始安装后端API - $(date) ==="

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

echo "Node.js版本: $(node --version)"
echo "NPM版本: $(npm --version)"

# 创建后端目录
mkdir -p /opt/mumble-api
cd /opt/mumble-api

# 创建package.json
cat > package.json << 'PKGEOF'
{
  "name": "mumble-api",
  "version": "1.0.0",
  "description": "Mumble Backend API Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0"
  }
}
PKGEOF

# 安装依赖
npm install

# 创建API服务器
cat > server.js << 'SERVEREOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 创建上传目录
const uploadDir = '/opt/mumble-api/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许音频文件'));
        }
    }
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 模拟数据存储
let images = [];
let audioFiles = [];

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: 'Mumble API Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/v1/health',
            upload: '/api/v1/audio/upload',
            generate: '/api/v1/generate',
            images: '/api/v1/images'
        },
        timestamp: new Date().toISOString()
    });
});

// 健康检查
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'mumble-api',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// 音频上传
app.post('/api/v1/audio/upload', upload.single('audio'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传音频文件' });
        }

        const audioData = {
            id: uuidv4(),
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadTime: new Date().toISOString(),
            path: req.file.path
        };

        audioFiles.push(audioData);

        res.json({
            success: true,
            message: '音频上传成功',
            data: {
                id: audioData.id,
                filename: audioData.filename,
                size: audioData.size,
                uploadTime: audioData.uploadTime
            }
        });
    } catch (error) {
        res.status(500).json({ error: '音频上传失败', details: error.message });
    }
});

// 图像生成
app.post('/api/v1/generate', (req, res) => {
    try {
        const { audioId, text, location, weather, mood } = req.body;

        // 模拟AI处理延迟
        setTimeout(() => {
            const imageData = {
                id: uuidv4(),
                audioId: audioId,
                prompt: text || '用户语音输入',
                location: location || '未知位置',
                weather: weather || '未知天气',
                mood: mood || '中性',
                imageUrl: `https://picsum.photos/512/512?random=${Date.now()}`,
                thumbnailUrl: `https://picsum.photos/256/256?random=${Date.now()}`,
                generatedAt: new Date().toISOString(),
                status: 'completed'
            };

            images.push(imageData);

            res.json({
                success: true,
                message: '图像生成成功',
                data: imageData
            });
        }, 2000); // 模拟2秒处理时间

    } catch (error) {
        res.status(500).json({ error: '图像生成失败', details: error.message });
    }
});

// 获取图库
app.get('/api/v1/images', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedImages = images
        .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
        .slice(startIndex, endIndex);

    res.json({
        success: true,
        data: paginatedImages,
        pagination: {
            page: page,
            limit: limit,
            total: images.length,
            pages: Math.ceil(images.length / limit)
        }
    });
});

// 获取单个图像
app.get('/api/v1/images/:id', (req, res) => {
    const image = images.find(img => img.id === req.params.id);
    if (!image) {
        return res.status(404).json({ error: '图像不存在' });
    }
    res.json({ success: true, data: image });
});

// 删除图像
app.delete('/api/v1/images/:id', (req, res) => {
    const index = images.findIndex(img => img.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: '图像不存在' });
    }
    
    const deletedImage = images.splice(index, 1)[0];
    res.json({ 
        success: true, 
        message: '图像删除成功',
        data: deletedImage 
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `路径 ${req.path} 不存在` 
    });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mumble API Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`API docs: http://localhost:${PORT}/`);
});
SERVEREOF

# 安装PM2进程管理器
npm install -g pm2

# 启动API服务
pm2 start server.js --name mumble-api
pm2 startup
pm2 save

echo "API服务状态:"
pm2 status

# 配置Apache代理到Node.js API
cat > /etc/httpd/conf.d/api-proxy.conf << 'PROXYEOF'
# API代理配置
ProxyPreserveHost On
ProxyRequests Off

# 代理API请求到Node.js
ProxyPass /api/ http://localhost:5000/api/
ProxyPassReverse /api/ http://localhost:5000/api/

# 代理根API请求
ProxyPass /server-info http://localhost:5000/
ProxyPassReverse /server-info http://localhost:5000/
PROXYEOF

# 启用Apache代理模块
echo "LoadModule proxy_module modules/mod_proxy.so" >> /etc/httpd/conf/httpd.conf
echo "LoadModule proxy_http_module modules/mod_proxy_http.so" >> /etc/httpd/conf/httpd.conf

# 重启Apache
systemctl restart httpd

echo "=== 后端API安装完成 - $(date) ==="
echo "API地址: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/v1/health"
echo "服务状态: $(pm2 list | grep mumble-api)"
EOF

echo "📤 由于无法直接SSH连接，我将创建一个新实例来部署完整的前后端"
echo "这样可以确保所有服务正确配置和运行"
echo ""

read -p "是否创建新的完整实例？(y/n): " choice
if [[ $choice == [Yy]* ]]; then
    echo "✅ 将创建包含前后端的完整实例"
    ./infrastructure/create-fullstack-instance.sh
else
    echo "ℹ️  保持当前前端展示页面，稍后可手动添加后端"
fi
