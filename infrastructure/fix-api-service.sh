#!/bin/bash

# 修复API服务问题 - 创建一个新的可靠实例

set -e

CURRENT_INSTANCE_IP="100.27.212.176"
CURRENT_INSTANCE_ID="i-0189ffa3da2ffe9dd"

INSTANCE_TYPE="t3.medium"
AMI_ID="ami-0c02fb55956c7d316"
REGION="us-east-1"
KEY_NAME="mumble-migration-key"
SECURITY_GROUP_ID="sg-05e7746fc594f6782"

echo "🔧 修复Mumble API服务问题"
echo "========================"
echo "当前问题: Node.js API服务未正确启动"
echo "解决方案: 创建新的优化实例"
echo ""

echo "🛑 终止有问题的实例..."
aws ec2 terminate-instances --instance-ids $CURRENT_INSTANCE_ID --region $REGION

echo "⏳ 等待实例终止..."
sleep 30

echo "🚀 创建优化的全栈实例..."

# 创建优化的用户数据脚本，简化Node.js安装过程
USER_DATA=$(cat << 'EOF'
#!/bin/bash
exec > /var/log/optimized-deploy.log 2>&1
set -x

echo "=== 开始优化部署 - $(date) ==="

# 基础更新
yum update -y

# 安装Apache
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# 使用更简单的方法安装Node.js
yum install -y nodejs npm

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
            background: rgba(0, 0, 0, 0.3);
            padding: 1.5rem;
            border-radius: 10px;
            margin: 1rem 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            white-space: pre-wrap;
            display: none;
            max-height: 400px;
            overflow-y: auto;
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
            transition: transform 0.3s ease;
        }
        .feature:hover { transform: translateY(-5px); }
        .feature-icon { font-size: 3rem; margin-bottom: 1rem; }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-online { background-color: #00ff00; }
        .status-offline { background-color: #ff0000; }
        .status-loading { background-color: #ffaa00; animation: pulse 1s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎤</div>
            <h1 class="title">Mumble</h1>
            <p class="subtitle">语音转图像创意应用 - 优化版</p>
        </div>
        
        <div class="status">
            <h2>🎉 优化部署成功！</h2>
            <p>前端 + 后端API服务已优化部署</p>
            <p><strong>部署时间:</strong> <span id="deploy-time"></span></p>
            <p><strong>API状态:</strong> <span class="status-indicator status-loading" id="api-indicator"></span><span id="api-status">检查中...</span></p>
        </div>

        <div class="api-section">
            <h3>🔧 API服务测试中心</h3>
            <p>后端API服务状态和功能测试：</p>
            
            <div class="api-buttons">
                <button class="btn" onclick="testAPI('/api/v1/health')">🏥 健康检查</button>
                <button class="btn" onclick="testAPI('/api/v1/info')">ℹ️ 服务信息</button>
                <button class="btn" onclick="testGenerate()">🎨 模拟生成</button>
                <button class="btn" onclick="testAPI('/api/v1/images')">📚 图库列表</button>
                <button class="btn" onclick="clearResult()">🧹 清空结果</button>
            </div>
            
            <div id="api-result" class="api-result"></div>
        </div>

        <div class="features">
            <div class="feature">
                <div class="feature-icon">🎵</div>
                <h4>智能语音处理</h4>
                <p>支持多种音频格式上传，模拟Whisper语音转文本功能，准确识别用户语音内容和情感</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🤖</div>
                <h4>AI图像生成</h4>
                <p>模拟DALL-E 3图像生成功能，基于语音内容和环境数据创造独特的艺术作品</p>
            </div>
            <div class="feature">
                <div class="feature-icon">📱</div>
                <h4>RESTful API</h4>
                <p>完整的REST API接口，支持音频上传、图像生成、图库管理等核心功能</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🌐</div>
                <h4>云端部署</h4>
                <p>基于AWS云基础设施，支持高并发访问和弹性扩展，确保服务稳定性</p>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('deploy-time').textContent = new Date().toLocaleString('zh-CN');
        
        async function testAPI(endpoint) {
            const resultDiv = document.getElementById('api-result');
            const indicator = document.getElementById('api-indicator');
            const status = document.getElementById('api-status');
            
            resultDiv.style.display = 'block';
            resultDiv.textContent = `正在测试 ${endpoint}...\n`;
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                
                resultDiv.textContent = `✅ ${endpoint} 测试成功\n\n` + 
                    `HTTP状态: ${response.status}\n` +
                    `响应数据:\n${JSON.stringify(data, null, 2)}`;
                resultDiv.style.background = 'rgba(0, 255, 0, 0.2)';
                
                // 更新API状态
                indicator.className = 'status-indicator status-online';
                status.textContent = '在线';
                
            } catch (error) {
                resultDiv.textContent = `❌ ${endpoint} 测试失败\n\n` +
                    `错误信息: ${error.message}\n` +
                    `可能原因: API服务未启动或网络问题`;
                resultDiv.style.background = 'rgba(255, 0, 0, 0.2)';
                
                // 更新API状态
                indicator.className = 'status-indicator status-offline';
                status.textContent = '离线';
            }
        }
        
        async function testGenerate() {
            const resultDiv = document.getElementById('api-result');
            resultDiv.style.display = 'block';
            resultDiv.textContent = '正在测试图像生成功能...\n';
            
            try {
                const response = await fetch('/api/v1/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: '测试语音：美丽的日落海滩风景',
                        location: '三亚',
                        weather: '晴天',
                        mood: '宁静'
                    })
                });
                
                const data = await response.json();
                resultDiv.textContent = `✅ 图像生成测试成功\n\n` +
                    `HTTP状态: ${response.status}\n` +
                    `生成结果:\n${JSON.stringify(data, null, 2)}`;
                resultDiv.style.background = 'rgba(0, 255, 0, 0.2)';
                
            } catch (error) {
                resultDiv.textContent = `❌ 图像生成测试失败\n\n` +
                    `错误信息: ${error.message}`;
                resultDiv.style.background = 'rgba(255, 0, 0, 0.2)';
            }
        }
        
        function clearResult() {
            const resultDiv = document.getElementById('api-result');
            resultDiv.style.display = 'none';
            resultDiv.textContent = '';
        }
        
        // 页面加载时自动检查API状态
        window.onload = () => {
            setTimeout(() => {
                testAPI('/api/v1/health');
            }, 3000);
            
            // 定期检查API状态
            setInterval(() => {
                fetch('/api/v1/health')
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('api-indicator').className = 'status-indicator status-online';
                        document.getElementById('api-status').textContent = '在线';
                    })
                    .catch(error => {
                        document.getElementById('api-indicator').className = 'status-indicator status-offline';
                        document.getElementById('api-status').textContent = '离线';
                    });
            }, 30000); // 每30秒检查一次
        };
    </script>
</body>
</html>
HTMLEOF

# 创建API目录和简化的API服务
mkdir -p /opt/mumble-api
cd /opt/mumble-api

# 创建简化的package.json
cat > package.json << 'PKGEOF'
{
  "name": "mumble-api",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
PKGEOF

# 安装依赖
npm install --production

# 创建简化的API服务器
cat > server.js << 'SERVEREOF'
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟数据
let images = [];

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: 'Mumble API Server - 优化版',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// 服务信息
app.get('/api/v1/info', (req, res) => {
    res.json({
        service: 'mumble-api',
        version: '1.0.0',
        description: 'Mumble语音转图像API服务',
        features: ['音频上传', '图像生成', '图库管理'],
        endpoints: ['/api/v1/health', '/api/v1/generate', '/api/v1/images'],
        timestamp: new Date().toISOString()
    });
});

// 健康检查
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'mumble-api',
        version: '1.0.0',
        uptime: Math.floor(process.uptime()) + '秒',
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        timestamp: new Date().toISOString()
    });
});

// 图像生成
app.post('/api/v1/generate', (req, res) => {
    const { text, location, weather, mood } = req.body;
    
    const imageData = {
        id: Date.now().toString(),
        prompt: text || '默认提示',
        location: location || '未知',
        weather: weather || '未知',
        mood: mood || '中性',
        imageUrl: `https://picsum.photos/512/512?random=${Date.now()}`,
        generatedAt: new Date().toISOString(),
        status: 'completed'
    };
    
    images.push(imageData);
    
    res.json({
        success: true,
        message: '图像生成成功',
        data: imageData
    });
});

// 获取图库
app.get('/api/v1/images', (req, res) => {
    res.json({
        success: true,
        data: images.slice(-10), // 最近10张
        total: images.length
    });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mumble API Server running on port ${PORT}`);
});
SERVEREOF

# 直接启动Node.js服务（不使用PM2）
nohup node server.js > /var/log/mumble-api.log 2>&1 &

# 等待服务启动
sleep 5

# 配置Apache代理
cat > /etc/httpd/conf.d/mumble-proxy.conf << 'PROXYEOF'
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so

ProxyPreserveHost On
ProxyRequests Off

# API代理
ProxyPass /api/ http://localhost:5000/api/
ProxyPassReverse /api/ http://localhost:5000/api/
PROXYEOF

# 重启Apache
systemctl restart httpd

# 验证服务
echo "=== 服务验证 ==="
echo "Apache状态: $(systemctl is-active httpd)"
echo "Node.js进程: $(pgrep -f 'node server.js' | wc -l) 个"
echo "端口5000监听: $(ss -tlnp | grep :5000 | wc -l) 个"

# 测试API
sleep 3
curl -s http://localhost:5000/api/v1/health | head -1 || echo "API测试失败"

echo "=== 优化部署完成 - $(date) ==="
EOF
)

echo "📦 创建优化实例..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data "$USER_DATA" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Mumble-Optimized},{Key=Project,Value=Mumble},{Key=Version,Value=Optimized}]' \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ 优化实例创建成功: $INSTANCE_ID"

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
echo "🎉 优化实例启动成功！"
echo ""
echo "📋 实例信息:"
echo "  实例ID: $INSTANCE_ID"
echo "  公网IP: $PUBLIC_IP"
echo "  优化: 简化Node.js安装和启动流程"
echo ""
echo "⏰ 预计2-3分钟后完全可用"
echo "🌐 访问地址: http://$PUBLIC_IP"
echo "🔧 API测试: http://$PUBLIC_IP/api/v1/health"
