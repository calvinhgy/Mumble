# 🚀 Mumble Serverless架构改造开发计划

## 📋 项目概述

**目标**: 将当前基于EC2的Mumble应用改造为完全Serverless架构  
**当前状态**: 传统Web应用 (EC2 + Apache + Node.js)  
**目标架构**: AWS Serverless生态系统  
**预期收益**: 成本优化、自动扩展、高可用性、零运维  

## 🏗️ 目标架构设计

### 当前架构 vs Serverless架构

```
当前架构:
用户 → CloudFront → EC2(Apache) → Node.js API → MongoDB

Serverless目标架构:
用户 → CloudFront → S3(静态网站) → API Gateway → Lambda函数 → DynamoDB/S3
                                              ↓
                                         OpenAI API
                                         OpenWeather API
```

### 核心组件映射

| 当前组件 | Serverless替代方案 | 优势 |
|---------|-------------------|------|
| EC2 + Apache | S3 + CloudFront | 成本降低90%，全球CDN |
| Node.js API | API Gateway + Lambda | 按需付费，自动扩展 |
| MongoDB | DynamoDB | 完全托管，无服务器 |
| 文件存储 | S3 | 无限容量，高可用 |
| 定时任务 | EventBridge + Lambda | 事件驱动，精确调度 |

## 📅 开发计划时间线

### 阶段1: 基础设施准备 (第1-2周)

#### 1.1 AWS服务配置
- [ ] **S3存储桶设置**
  - 静态网站托管配置
  - CORS策略配置
  - 版本控制启用
  - 生命周期策略设置

- [ ] **CloudFront CDN配置**
  - 分发配置优化
  - 缓存策略设置
  - SSL证书配置
  - 自定义域名绑定

- [ ] **DynamoDB数据库设计**
  - 表结构设计
  - 索引策略规划
  - 读写容量配置
  - 备份策略设置

#### 1.2 开发环境准备
- [ ] **Serverless Framework安装**
  ```bash
  npm install -g serverless
  serverless create --template aws-nodejs --path mumble-serverless
  ```

- [ ] **AWS CLI配置**
  ```bash
  aws configure
  serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET
  ```

- [ ] **项目结构初始化**
  ```
  mumble-serverless/
  ├── frontend/              # React前端应用
  ├── backend/               # Lambda函数
  ├── infrastructure/        # IaC配置
  ├── shared/               # 共享代码
  └── deployment/           # 部署脚本
  ```

### 阶段2: 后端API重构 (第3-5周)

#### 2.1 Lambda函数开发

**核心API函数**:

```javascript
// functions/health/handler.js
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'healthy',
      service: 'mumble-serverless',
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    })
  };
};
```

**主要Lambda函数列表**:
- [ ] `health` - 健康检查
- [ ] `audioUpload` - 音频文件上传处理
- [ ] `speechToText` - Whisper API集成
- [ ] `generateImage` - DALL-E图像生成
- [ ] `weatherData` - 天气数据获取
- [ ] `imageGallery` - 图库管理
- [ ] `userProfile` - 用户管理

#### 2.2 API Gateway配置

```yaml
# serverless.yml
service: mumble-serverless

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DYNAMODB_TABLE: ${self:service}-${opt:stage, self:provider.stage}
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}
    OPENWEATHER_API_KEY: ${env:OPENWEATHER_API_KEY}

functions:
  health:
    handler: functions/health/handler.handler
    events:
      - http:
          path: /api/v1/health
          method: get
          cors: true
  
  audioUpload:
    handler: functions/audio/upload.handler
    events:
      - http:
          path: /api/v1/audio/upload
          method: post
          cors: true
    timeout: 30
    memorySize: 512

resources:
  Resources:
    MumbleTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.DYNAMODB_TABLE}
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST
```

#### 2.3 数据层重构

**DynamoDB表设计**:

```javascript
// 用户数据表
const UserTable = {
  TableName: 'mumble-users',
  KeySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' }
  ]
};

// 图像数据表
const ImageTable = {
  TableName: 'mumble-images',
  KeySchema: [
    { AttributeName: 'imageId', KeyType: 'HASH' },
    { AttributeName: 'createdAt', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'imageId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' },
    { AttributeName: 'userId', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [{
    IndexName: 'UserIndex',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'createdAt', KeyType: 'RANGE' }
    ]
  }]
};
```

### 阶段3: 前端应用改造 (第6-8周)

#### 3.1 React应用Serverless适配

**主要改造点**:
- [ ] **API调用重构** - 适配API Gateway端点
- [ ] **认证集成** - AWS Cognito用户认证
- [ ] **文件上传** - 直接上传到S3
- [ ] **实时功能** - WebSocket API集成

```javascript
// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL;

class MumbleAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async uploadAudio(audioBlob) {
    // 获取预签名URL
    const presignedUrl = await this.getPresignedUrl();
    
    // 直接上传到S3
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: audioBlob,
      headers: {
        'Content-Type': 'audio/webm'
      }
    });

    return uploadResponse;
  }

  async generateImage(audioKey, metadata) {
    const response = await fetch(`${this.baseURL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({
        audioKey,
        metadata
      })
    });

    return response.json();
  }
}
```

#### 3.2 静态网站部署配置

```javascript
// deployment/deploy-frontend.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

const deployFrontend = async () => {
  // 1. 构建React应用
  console.log('Building React app...');
  execSync('npm run build', { cwd: './frontend' });

  // 2. 上传到S3
  console.log('Uploading to S3...');
  await uploadToS3('./frontend/build', 'mumble-frontend-bucket');

  // 3. 清除CloudFront缓存
  console.log('Invalidating CloudFront cache...');
  await invalidateCloudFront('E1234567890ABC');

  console.log('Frontend deployment completed!');
};
```

### 阶段4: AI服务集成 (第9-11周)

#### 4.1 OpenAI API集成

```javascript
// functions/ai/speechToText.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event) => {
  try {
    const { audioKey } = JSON.parse(event.body);
    
    // 从S3获取音频文件
    const audioBuffer = await getAudioFromS3(audioKey);
    
    // Whisper API调用
    const transcription = await openai.audio.transcriptions.create({
      file: audioBuffer,
      model: "whisper-1",
      language: "zh"
    });

    // DALL-E图像生成
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancePrompt(transcription.text),
      size: "1024x1024",
      quality: "standard",
      n: 1
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        transcription: transcription.text,
        imageUrl: imageResponse.data[0].url,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

#### 4.2 环境数据服务

```javascript
// functions/environment/weather.js
exports.handler = async (event) => {
  const { latitude, longitude } = JSON.parse(event.body);
  
  const weatherResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`
  );
  
  const weatherData = await weatherResponse.json();
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      weather: weatherData.weather[0].description,
      temperature: weatherData.main.temp,
      location: weatherData.name,
      timestamp: new Date().toISOString()
    })
  };
};
```

### 阶段5: 高级功能开发 (第12-14周)

#### 5.1 用户认证系统 (AWS Cognito)

```javascript
// functions/auth/cognito-config.js
const cognitoConfig = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID,
  region: 'us-east-1'
};

// 前端认证集成
import { Auth } from 'aws-amplify';

const signUp = async (email, password) => {
  try {
    const { user } = await Auth.signUp({
      username: email,
      password,
      attributes: {
        email
      }
    });
    return user;
  } catch (error) {
    console.error('Sign up error:', error);
  }
};
```

#### 5.2 实时功能 (WebSocket API)

```yaml
# WebSocket API配置
websocketApi:
  handler: functions/websocket/handler.handler
  events:
    - websocket:
        route: $connect
    - websocket:
        route: $disconnect
    - websocket:
        route: generateImage
```

#### 5.3 图像处理管道

```javascript
// functions/image/processor.js
exports.handler = async (event) => {
  // S3事件触发的图像处理
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    
    // 生成缩略图
    await generateThumbnail(bucket, key);
    
    // 图像分析
    const analysis = await analyzeImage(bucket, key);
    
    // 保存元数据到DynamoDB
    await saveImageMetadata(key, analysis);
  }
};
```

### 阶段6: 性能优化与监控 (第15-16周)

#### 6.1 性能优化

- [ ] **Lambda冷启动优化**
  ```javascript
  // 连接池复用
  let dynamoClient;
  
  exports.handler = async (event) => {
    if (!dynamoClient) {
      dynamoClient = new AWS.DynamoDB.DocumentClient();
    }
    // 处理逻辑
  };
  ```

- [ ] **缓存策略**
  ```javascript
  // ElastiCache Redis集成
  const redis = require('redis');
  const client = redis.createClient({
    host: process.env.REDIS_ENDPOINT
  });
  ```

#### 6.2 监控和日志

```yaml
# CloudWatch监控配置
custom:
  alerts:
    - functionErrors
    - functionDuration
    - functionThrottles
  
plugins:
  - serverless-plugin-aws-alerts
```

## 💰 成本分析

### 当前EC2架构成本 (月)
- EC2 t3.medium: $30
- EBS存储: $10
- 数据传输: $5
- **总计: ~$45/月**

### Serverless架构预估成本 (月)
- Lambda执行: $5-15 (基于使用量)
- API Gateway: $3-10
- DynamoDB: $5-20
- S3存储: $2-5
- CloudFront: $1-3
- **总计: ~$16-53/月**

**成本优势**: 低使用量时节省60%+，高使用量时自动扩展

## 🚀 部署策略

### 自动化部署管道

```yaml
# .github/workflows/deploy.yml
name: Deploy Mumble Serverless

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Deploy to AWS
        run: |
          serverless deploy --stage prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### 环境管理

```javascript
// config/environments.js
const environments = {
  dev: {
    stage: 'dev',
    region: 'us-east-1',
    domainName: 'dev.mumble.app'
  },
  staging: {
    stage: 'staging',
    region: 'us-east-1',
    domainName: 'staging.mumble.app'
  },
  prod: {
    stage: 'prod',
    region: 'us-east-1',
    domainName: 'mumble.app'
  }
};
```

## 📊 迁移风险评估

### 高风险项
- [ ] **数据迁移** - MongoDB到DynamoDB
- [ ] **API兼容性** - 前端调用适配
- [ ] **性能差异** - Lambda冷启动延迟

### 中风险项
- [ ] **成本控制** - 使用量激增风险
- [ ] **监控盲区** - 分布式系统复杂性
- [ ] **调试困难** - 本地开发环境差异

### 风险缓解策略
1. **渐进式迁移** - 功能模块逐步迁移
2. **A/B测试** - 新旧系统并行运行
3. **回滚计划** - 快速回退机制
4. **全面测试** - 自动化测试覆盖

## 🎯 成功指标

### 技术指标
- [ ] **响应时间** < 500ms (P95)
- [ ] **可用性** > 99.9%
- [ ] **成本降低** > 30%
- [ ] **部署时间** < 5分钟

### 业务指标
- [ ] **用户体验** 无明显差异
- [ ] **功能完整性** 100%保持
- [ ] **扩展性** 支持10x流量增长
- [ ] **维护成本** 降低50%

## 📋 行动计划

### 立即开始 (本周)
1. [ ] 创建Serverless项目结构
2. [ ] 配置AWS服务账户和权限
3. [ ] 设置开发环境和工具链
4. [ ] 开始第一个Lambda函数开发

### 第一个里程碑 (2周内)
1. [ ] 完成基础设施配置
2. [ ] 部署第一个API端点
3. [ ] 验证基本功能可用性
4. [ ] 建立CI/CD管道

### 项目完成 (16周内)
1. [ ] 所有功能迁移完成
2. [ ] 性能优化达标
3. [ ] 监控系统完善
4. [ ] 文档和培训完成

---

**这个Serverless改造计划将使Mumble应用具备现代化的云原生架构，实现更好的可扩展性、可维护性和成本效益。**
