#!/bin/bash

# 创建完整的Mumble全栈应用实例

set -e

INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"
REGION="us-east-1"
KEY_NAME="mumble-migration-key"
SECURITY_GROUP_ID="sg-05e7746fc594f6782"

echo "🚀 创建Mumble完整全栈实例"
echo "========================="
echo "包含: 前端展示 + 后端API + 模拟功能"
echo ""

# 创建完整的用户数据脚本
USER_DATA=$(cat << 'EOF'
#!/bin/bash
exec > /var/log/fullstack-deploy.log 2>&1
set -x

echo "=== 开始全栈部署 - $(date) ==="

# 基础系统更新
yum update -y

# 安装Apache
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

echo "Node.js版本: $(node --version)"
echo "NPM版本: $(npm --version)"

# 创建前端页面
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
            color: white;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .logo { font-size: 5rem; margin-bottom: 1rem; }
        .title { font-size: 3.5rem; margin-bottom: 1rem; font-weight: 300; }
        .subtitle { font-size: 1.5rem; opacity: 0.9; }
        .status {
            background: rgba(0, 255, 0, 0.3);
            padding: 2rem;
            border-radius: 15px;
            margin: 2rem 0;
            border: 2px solid rgba(0, 255, 0, 0.5);
            text-align: center;
        }
        .api-section {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 15px;
            margin: 2rem 0;
        }
        .api-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
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
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        .api-result {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
            font-family: monospace;
            font-size: 0.9rem;
            white-space: pre-wrap;
            display: none;
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
        }
        .feature-icon { font-size: 3rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎤</div>
            <h1 class="title">Mumble</h1>
            <p class="subtitle">语音转图像创意应用 - 全栈版本</p>
        </div>
        
        <div class="status">
            <h2>🎉 全栈部署成功！</h2>
            <p>前端展示 + 后端API服务已完整部署</p>
            <p><strong>部署时间:</strong> <span id="deploy-time"></span></p>
        </div>

        <div class="api-section">
            <h3>🔧 API服务测试</h3>
            <p>后端API服务已启动，可以测试以下功能：</p>
            
            <div class="api-buttons">
                <button class="btn" onclick="testAPI('/api/v1/health')">健康检查</button>
                <button class="btn" onclick="testAPI('/server-info')">服务信息</button>
                <button class="btn" onclick="testGenerate()">模拟生成</button>
                <button class="btn" onclick="testAPI('/api/v1/images')">图库列表</button>
            </div>
            
            <div id="api-result" class="api-result"></div>
        </div>

        <div class="features">
            <div class="feature">
                <div class="feature-icon">🎵</div>
                <h4>语音处理</h4>
                <p>支持音频文件上传和处理，模拟语音转文本功能</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🤖</div>
                <h4>AI生成</h4>
                <p>模拟基于语音和环境数据的图像生成功能</p>
            </div>
            <div class="feature">
                <div class="feature-icon">📚</div>
                <h4>图库管理</h4>
                <p>支持图像存储、检索、分页和删除功能</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🌐</div>
                <h4>RESTful API</h4>
                <p>完整的REST API接口，支持前端应用集成</p>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('deploy-time').textContent = new Date().toLocaleString('zh-CN');
        
        async function testAPI(endpoint) {
            const resultDiv = document.getElementById('api-result');
            resultDiv.style.display = 'block';
            resultDiv.textContent = `正在测试 ${endpoint}...`;
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                resultDiv.textContent = `${endpoint} 响应:\n${JSON.stringify(data, null, 2)}`;
                resultDiv.style.background = 'rgba(0, 255, 0, 0.2)';
            } catch (error) {
                resultDiv.textContent = `${endpoint} 错误:\n${error.message}`;
                resultDiv.style.background = 'rgba(255, 0, 0, 0.2)';
            }
        }
        
        async function testGenerate() {
            const resultDiv = document.getElementById('api-result');
            resultDiv.style.display = 'block';
            resultDiv.textContent = '正在测试图像生成...';
            
            try {
                const response = await fetch('/api/v1/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: '测试语音输入：美丽的日落风景',
                        location: '北京',
                        weather: '晴天',
                        mood: '愉悦'
                    })
                });
                const data = await response.json();
                resultDiv.textContent = `图像生成响应:\n${JSON.stringify(data, null, 2)}`;
                resultDiv.style.background = 'rgba(0, 255, 0, 0.2)';
            } catch (error) {
                resultDiv.textContent = `图像生成错误:\n${error.message}`;
                resultDiv.style.background = 'rgba(255, 0, 0, 0.2)';
            }
        }
        
        // 页面加载时自动测试健康检查
        window.onload = () => {
            setTimeout(() => testAPI('/api/v1/health'), 2000);
        };
    </script>
</body>
</html>
HTMLEOF

# 创建后端API目录
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
    "start": "node server.js"
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

// 配置multer
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// 模拟数据
let images = [];
let audioFiles = [];

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: 'Mumble API Server',
        version: '1.0.0',
        status: 'running',
        features: ['音频上传', '图像生成', '图库管理'],
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
        uptime: Math.floor(process.uptime()),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
        },
        stats: {
            totalImages: images.length,
            totalAudioFiles: audioFiles.length
        },
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
            uploadTime: new Date().toISOString()
        };

        audioFiles.push(audioData);

        res.json({
            success: true,
            message: '音频上传成功',
            data: audioData
        });
    } catch (error) {
        res.status(500).json({ error: '音频上传失败', details: error.message });
    }
});

// 图像生成
app.post('/api/v1/generate', (req, res) => {
    const { audioId, text, location, weather, mood } = req.body;

    const imageData = {
        id: uuidv4(),
        audioId: audioId || null,
        prompt: text || '用户语音输入',
        location: location || '未知位置',
        weather: weather || '未知天气',
        mood: mood || '中性',
        imageUrl: `https://picsum.photos/512/512?random=${Date.now()}`,
        thumbnailUrl: `https://picsum.photos/256/256?random=${Date.now() + 1}`,
        generatedAt: new Date().toISOString(),
        status: 'completed',
        processingTime: '2.3秒'
    };

    images.push(imageData);

    // 模拟处理延迟
    setTimeout(() => {
        res.json({
            success: true,
            message: '图像生成成功',
            data: imageData
        });
    }, 1000);
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

// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mumble API Server running on port ${PORT}`);
});
SERVEREOF

# 安装PM2
npm install -g pm2

# 启动API服务
pm2 start server.js --name mumble-api
pm2 startup
pm2 save

# 配置Apache代理
cat > /etc/httpd/conf.d/api-proxy.conf << 'PROXYEOF'
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so

ProxyPreserveHost On
ProxyRequests Off

# API代理
ProxyPass /api/ http://localhost:5000/api/
ProxyPassReverse /api/ http://localhost:5000/api/

# 服务器信息代理
ProxyPass /server-info http://localhost:5000/
ProxyPassReverse /server-info http://localhost:5000/
PROXYEOF

# 重启Apache
systemctl restart httpd

echo "=== 全栈部署完成 - $(date) ==="
echo "前端: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/v1/health"
echo "服务状态:"
pm2 status
systemctl status httpd --no-pager -l | head -3
EOF
)

echo "📦 创建全栈实例..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data "$USER_DATA" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Mumble-Fullstack},{Key=Project,Value=Mumble},{Key=Version,Value=Fullstack}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ 全栈实例创建成功: $INSTANCE_ID"

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
echo "🎉 全栈实例启动成功！"
echo ""
echo "📋 实例信息:"
echo "  实例ID: $INSTANCE_ID"
echo "  公网IP: $PUBLIC_IP"
echo "  架构: 前端(Apache) + 后端(Node.js) + API代理"
echo ""
echo "⏰ 预计3-5分钟后完全可用"
echo "🌐 访问地址: http://$PUBLIC_IP"
echo "🔧 API测试: http://$PUBLIC_IP/api/v1/health"
echo ""

# 开始监控
echo "🔍 开始监控全栈部署..."
for i in {1..10}; do
    echo ""
    echo "=== 监控检查 #$i ($(date +%H:%M:%S)) ==="
    
    # 检查前端
    frontend_response=$(curl -s -w "%{http_code}" -m 10 "http://$PUBLIC_IP/" -o /dev/null 2>/dev/null)
    if [ "$frontend_response" = "200" ]; then
        echo "前端: ✅ 可访问 (HTTP $frontend_response)"
        frontend_ok=true
    else
        echo "前端: ❌ 不可访问 (HTTP $frontend_response)"
        frontend_ok=false
    fi
    
    # 检查API
    api_response=$(curl -s -m 10 "http://$PUBLIC_IP/api/v1/health" 2>/dev/null)
    if echo "$api_response" | grep -q "healthy" 2>/dev/null; then
        echo "API: ✅ 正常响应"
        api_ok=true
    else
        echo "API: ❌ 无响应"
        api_ok=false
    fi
    
    if [ "$frontend_ok" = true ] && [ "$api_ok" = true ]; then
        echo ""
        echo "🎉 全栈部署完全成功！"
        echo "✅ 前端: http://$PUBLIC_IP"
        echo "✅ API: http://$PUBLIC_IP/api/v1/health"
        echo "✅ 功能: 前后端完全集成"
        echo ""
        echo "🧪 API功能测试:"
        curl -s "http://$PUBLIC_IP/api/v1/health" | head -3
        break
    fi
    
    if [ $i -lt 10 ]; then
        echo "⏳ 等待30秒后继续检查..."
        sleep 30
    fi
done

echo ""
echo "📊 全栈部署状态: $([ "$frontend_ok" = true ] && [ "$api_ok" = true ] && echo "✅ 完全成功" || echo "⏳ 仍在部署中")"
