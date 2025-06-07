# 🛠️ Mumble Serverless实现指南

## 🚀 快速开始

### 1. 项目初始化

```bash
# 创建Serverless项目
mkdir mumble-serverless
cd mumble-serverless

# 初始化Serverless框架
serverless create --template aws-nodejs --name mumble-serverless

# 安装依赖
npm init -y
npm install --save aws-sdk uuid moment
npm install --save-dev serverless-offline serverless-webpack
```

### 2. 项目结构

```
mumble-serverless/
├── functions/                 # Lambda函数
│   ├── auth/                 # 认证相关
│   ├── audio/                # 音频处理
│   ├── image/                # 图像生成
│   ├── weather/              # 天气数据
│   └── common/               # 共享代码
├── frontend/                 # React前端
├── infrastructure/           # IaC配置
├── tests/                    # 测试文件
├── serverless.yml           # Serverless配置
└── package.json
```

## 📝 核心配置文件

### serverless.yml

```yaml
service: mumble-serverless
frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  
  environment:
    STAGE: ${self:provider.stage}
    REGION: ${self:provider.region}
    DYNAMODB_TABLE: ${self:service}-${self:provider.stage}
    IMAGES_BUCKET: ${self:service}-images-${self:provider.stage}
    AUDIO_BUCKET: ${self:service}-audio-${self:provider.stage}
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}
    OPENWEATHER_API_KEY: ${env:OPENWEATHER_API_KEY}
  
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.DYNAMODB_TABLE}"
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
            - s3:DeleteObject
          Resource: 
            - "arn:aws:s3:::${self:provider.environment.IMAGES_BUCKET}/*"
            - "arn:aws:s3:::${self:provider.environment.AUDIO_BUCKET}/*"

functions:
  # 健康检查
  health:
    handler: functions/health/handler.main
    events:
      - http:
          path: /health
          method: get
          cors: true

  # 音频上传预签名URL
  getUploadUrl:
    handler: functions/audio/upload.getUploadUrl
    events:
      - http:
          path: /audio/upload-url
          method: post
          cors: true

  # 音频处理触发器
  processAudio:
    handler: functions/audio/process.main
    timeout: 300
    memorySize: 1024
    events:
      - s3:
          bucket: ${self:provider.environment.AUDIO_BUCKET}
          event: s3:ObjectCreated:*

  # 图像生成
  generateImage:
    handler: functions/image/generate.main
    timeout: 300
    memorySize: 1024
    events:
      - http:
          path: /generate
          method: post
          cors: true

  # 获取天气数据
  getWeather:
    handler: functions/weather/handler.main
    events:
      - http:
          path: /weather
          method: post
          cors: true

  # 图库管理
  getImages:
    handler: functions/image/gallery.getImages
    events:
      - http:
          path: /images
          method: get
          cors: true

  deleteImage:
    handler: functions/image/gallery.deleteImage
    events:
      - http:
          path: /images/{id}
          method: delete
          cors: true

resources:
  Resources:
    # DynamoDB表
    MumbleTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.DYNAMODB_TABLE}
        AttributeDefinitions:
          - AttributeName: PK
            AttributeType: S
          - AttributeName: SK
            AttributeType: S
          - AttributeName: GSI1PK
            AttributeType: S
          - AttributeName: GSI1SK
            AttributeType: S
        KeySchema:
          - AttributeName: PK
            KeyType: HASH
          - AttributeName: SK
            KeyType: RANGE
        GlobalSecondaryIndexes:
          - IndexName: GSI1
            KeySchema:
              - AttributeName: GSI1PK
                KeyType: HASH
              - AttributeName: GSI1SK
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
        BillingMode: PAY_PER_REQUEST
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES

    # S3存储桶 - 音频文件
    AudioBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:provider.environment.AUDIO_BUCKET}
        CorsConfiguration:
          CorsRules:
            - AllowedHeaders: ['*']
              AllowedMethods: [GET, PUT, POST, DELETE]
              AllowedOrigins: ['*']
              MaxAge: 3000

    # S3存储桶 - 图像文件
    ImagesBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:provider.environment.IMAGES_BUCKET}
        PublicAccessBlockConfiguration:
          BlockPublicAcls: false
          BlockPublicPolicy: false
          IgnorePublicAcls: false
          RestrictPublicBuckets: false

plugins:
  - serverless-offline
  - serverless-webpack
```

## 🔧 Lambda函数实现

### 1. 健康检查函数

```javascript
// functions/health/handler.js
const { success, failure } = require('../common/response');

exports.main = async (event) => {
  try {
    const response = {
      status: 'healthy',
      service: 'mumble-serverless',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      stage: process.env.STAGE,
      region: process.env.REGION
    };

    return success(response);
  } catch (error) {
    console.error('Health check failed:', error);
    return failure({ error: 'Health check failed' });
  }
};
```

### 2. 音频上传处理

```javascript
// functions/audio/upload.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { success, failure } = require('../common/response');

const s3 = new AWS.S3();

exports.getUploadUrl = async (event) => {
  try {
    const { fileName, fileType } = JSON.parse(event.body);
    const fileKey = `${uuidv4()}-${fileName}`;
    
    const params = {
      Bucket: process.env.AUDIO_BUCKET,
      Key: fileKey,
      ContentType: fileType,
      Expires: 300, // 5分钟有效期
      ACL: 'private'
    };

    const uploadUrl = s3.getSignedUrl('putObject', params);

    return success({
      uploadUrl,
      fileKey,
      message: 'Upload URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return failure({ error: 'Could not generate upload URL' });
  }
};
```

### 3. 音频处理函数

```javascript
// functions/audio/process.js
const AWS = require('aws-sdk');
const OpenAI = require('openai');
const { saveToDatabase } = require('../common/database');

const s3 = new AWS.S3();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.main = async (event) => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = record.s3.object.key;
      
      console.log(`Processing audio file: ${key}`);
      
      // 获取音频文件
      const audioObject = await s3.getObject({
        Bucket: bucket,
        Key: key
      }).promise();

      // 语音转文本
      const transcription = await openai.audio.transcriptions.create({
        file: audioObject.Body,
        model: "whisper-1",
        language: "zh"
      });

      // 保存转录结果
      await saveToDatabase({
        PK: `AUDIO#${key}`,
        SK: `TRANSCRIPTION`,
        transcription: transcription.text,
        audioKey: key,
        createdAt: new Date().toISOString(),
        status: 'completed'
      });

      console.log(`Audio processing completed for: ${key}`);
    }
  } catch (error) {
    console.error('Error processing audio:', error);
    throw error;
  }
};
```

### 4. 图像生成函数

```javascript
// functions/image/generate.js
const OpenAI = require('openai');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { success, failure } = require('../common/response');
const { saveToDatabase, getFromDatabase } = require('../common/database');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const s3 = new AWS.S3();

exports.main = async (event) => {
  try {
    const { audioKey, location, weather, mood } = JSON.parse(event.body);
    
    // 获取音频转录结果
    const transcriptionData = await getFromDatabase(
      `AUDIO#${audioKey}`,
      'TRANSCRIPTION'
    );

    if (!transcriptionData) {
      return failure({ error: 'Audio transcription not found' });
    }

    // 构建增强提示词
    const enhancedPrompt = buildPrompt(
      transcriptionData.transcription,
      { location, weather, mood }
    );

    // 生成图像
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      size: "1024x1024",
      quality: "standard",
      n: 1
    });

    const imageUrl = imageResponse.data[0].url;
    const imageId = uuidv4();

    // 下载并保存图像到S3
    const imageBuffer = await downloadImage(imageUrl);
    const s3Key = `images/${imageId}.png`;
    
    await s3.putObject({
      Bucket: process.env.IMAGES_BUCKET,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: 'image/png',
      ACL: 'public-read'
    }).promise();

    const publicImageUrl = `https://${process.env.IMAGES_BUCKET}.s3.amazonaws.com/${s3Key}`;

    // 保存图像元数据
    await saveToDatabase({
      PK: `IMAGE#${imageId}`,
      SK: `METADATA`,
      GSI1PK: `USER#${event.requestContext.identity.sourceIp}`,
      GSI1SK: new Date().toISOString(),
      imageId,
      imageUrl: publicImageUrl,
      prompt: enhancedPrompt,
      originalText: transcriptionData.transcription,
      audioKey,
      location,
      weather,
      mood,
      createdAt: new Date().toISOString()
    });

    return success({
      imageId,
      imageUrl: publicImageUrl,
      prompt: enhancedPrompt,
      message: 'Image generated successfully'
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return failure({ error: 'Could not generate image' });
  }
};

function buildPrompt(transcription, context) {
  const { location, weather, mood } = context;
  
  return `基于以下语音内容创作一幅艺术作品：
  
语音内容：${transcription}
地理位置：${location || '未知'}
天气状况：${weather || '未知'}
情感氛围：${mood || '中性'}

请创作一幅富有创意和艺术感的图像，融合语音内容的核心意境和环境背景信息。风格要求：现代艺术、色彩丰富、构图优美。`;
}

async function downloadImage(url) {
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
}
```

### 5. 天气数据获取

```javascript
// functions/weather/handler.js
const { success, failure } = require('../common/response');

exports.main = async (event) => {
  try {
    const { latitude, longitude } = JSON.parse(event.body);
    
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Weather API request failed');
    }
    
    const weatherData = await weatherResponse.json();
    
    const result = {
      weather: weatherData.weather[0].description,
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      location: weatherData.name,
      country: weatherData.sys.country,
      timestamp: new Date().toISOString()
    };

    return success(result);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return failure({ error: 'Could not fetch weather data' });
  }
};
```

## 🗄️ 数据库操作

### 共享数据库函数

```javascript
// functions/common/database.js
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;

exports.saveToDatabase = async (item) => {
  const params = {
    TableName: tableName,
    Item: item
  };

  try {
    await dynamodb.put(params).promise();
    return item;
  } catch (error) {
    console.error('Error saving to database:', error);
    throw error;
  }
};

exports.getFromDatabase = async (pk, sk) => {
  const params = {
    TableName: tableName,
    Key: {
      PK: pk,
      SK: sk
    }
  };

  try {
    const result = await dynamodb.get(params).promise();
    return result.Item;
  } catch (error) {
    console.error('Error getting from database:', error);
    throw error;
  }
};

exports.queryDatabase = async (pk, options = {}) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': pk
    },
    ...options
  };

  try {
    const result = await dynamodb.query(params).promise();
    return result.Items;
  } catch (error) {
    console.error('Error querying database:', error);
    throw error;
  }
};

exports.deleteFromDatabase = async (pk, sk) => {
  const params = {
    TableName: tableName,
    Key: {
      PK: pk,
      SK: sk
    }
  };

  try {
    await dynamodb.delete(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting from database:', error);
    throw error;
  }
};
```

### 响应处理函数

```javascript
// functions/common/response.js
exports.success = (body) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
};

exports.failure = (body) => {
  return {
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
};

exports.notFound = (body = { error: 'Not found' }) => {
  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
};
```

## 🎨 前端适配

### API服务类

```javascript
// frontend/src/services/MumbleServerlessAPI.js
class MumbleServerlessAPI {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_GATEWAY_URL;
  }

  async getUploadUrl(fileName, fileType) {
    const response = await fetch(`${this.baseURL}/audio/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName, fileType })
    });

    return response.json();
  }

  async uploadAudio(uploadUrl, audioBlob) {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: audioBlob,
      headers: {
        'Content-Type': audioBlob.type
      }
    });

    return response.ok;
  }

  async generateImage(audioKey, metadata) {
    const response = await fetch(`${this.baseURL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audioKey,
        ...metadata
      })
    });

    return response.json();
  }

  async getWeather(latitude, longitude) {
    const response = await fetch(`${this.baseURL}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ latitude, longitude })
    });

    return response.json();
  }

  async getImages() {
    const response = await fetch(`${this.baseURL}/images`);
    return response.json();
  }

  async deleteImage(imageId) {
    const response = await fetch(`${this.baseURL}/images/${imageId}`, {
      method: 'DELETE'
    });

    return response.ok;
  }
}

export default new MumbleServerlessAPI();
```

## 🚀 部署脚本

### 部署命令

```bash
# 开发环境部署
serverless deploy --stage dev

# 生产环境部署
serverless deploy --stage prod

# 部署单个函数
serverless deploy function --function generateImage --stage dev

# 查看日志
serverless logs --function generateImage --stage dev --tail

# 删除服务
serverless remove --stage dev
```

### 环境变量配置

```bash
# .env.dev
OPENAI_API_KEY=sk-your-openai-key
OPENWEATHER_API_KEY=your-weather-api-key

# .env.prod
OPENAI_API_KEY=sk-your-prod-openai-key
OPENWEATHER_API_KEY=your-prod-weather-api-key
```

## 📊 监控和调试

### CloudWatch日志查看

```javascript
// functions/common/logger.js
const log = (level, message, data = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    stage: process.env.STAGE,
    ...data
  };
  
  console.log(JSON.stringify(logEntry));
};

exports.info = (message, data) => log('INFO', message, data);
exports.error = (message, data) => log('ERROR', message, data);
exports.warn = (message, data) => log('WARN', message, data);
exports.debug = (message, data) => log('DEBUG', message, data);
```

### 性能监控

```javascript
// functions/common/metrics.js
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

exports.putMetric = async (metricName, value, unit = 'Count') => {
  const params = {
    Namespace: 'Mumble/Serverless',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  };

  try {
    await cloudwatch.putMetricData(params).promise();
  } catch (error) {
    console.error('Error putting metric:', error);
  }
};
```

---

**这个实现指南提供了完整的Serverless架构代码示例，可以直接用于开发和部署Mumble的无服务器版本。**
