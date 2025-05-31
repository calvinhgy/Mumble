# API规范文档

## 1. API概述

Mumble API采用RESTful设计原则，提供以下主要功能：

- 音频处理和分析
- 环境数据收集和处理
- 图像生成和管理
- 用户偏好设置

所有API端点使用HTTPS，并采用JSON作为数据交换格式。API版本通过URL路径前缀（如`/api/v1/`）进行管理。

## 2. 认证与授权

### 2.1 认证方式

API使用基于令牌的认证机制：

```
Authorization: Bearer {token}
```

设备首次使用时会自动创建匿名用户账号，并生成设备令牌。

### 2.2 错误响应格式

所有API错误响应遵循统一格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* 可选的错误详情 */ }
  }
}
```

## 3. 音频处理API

### 3.1 上传音频

**请求**:

```
POST /api/v1/audio
Content-Type: multipart/form-data
```

**参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| audioFile | File | 是 | 音频文件（WAV或MP3格式） |
| duration | Number | 是 | 音频时长（秒） |
| format | String | 是 | 音频格式（"wav"或"mp3"） |
| sampleRate | Number | 否 | 采样率 |

**响应**:

```json
{
  "audioId": "a1b2c3d4",
  "status": "processing",
  "estimatedProcessingTime": 2
}
```

### 3.2 获取音频处理状态

**请求**:

```
GET /api/v1/audio/{audioId}/status
```

**响应**:

```json
{
  "audioId": "a1b2c3d4",
  "status": "completed",
  "text": "这是转换后的音频文本内容",
  "analysis": {
    "sentiment": "positive",
    "keywords": ["sunny", "happy", "beach"],
    "confidence": 0.92
  }
}
```

### 3.3 获取音频文本

**请求**:

```
GET /api/v1/audio/{audioId}/text
```

**响应**:

```json
{
  "audioId": "a1b2c3d4",
  "text": "这是转换后的音频文本内容",
  "createdAt": "2023-05-15T14:30:00Z"
}
```

## 4. 环境数据API

### 4.1 提交环境数据

**请求**:

```
POST /api/v1/environment
Content-Type: application/json
```

**请求体**:

```json
{
  "location": {
    "latitude": 31.2304,
    "longitude": 121.4737,
    "accuracy": 10.5
  },
  "device": {
    "orientation": "portrait",
    "screenBrightness": 0.75,
    "batteryLevel": 0.65
  },
  "timestamp": "2023-05-15T14:30:00Z"
}
```

**响应**:

```json
{
  "environmentId": "e1f2g3h4",
  "status": "processing"
}
```

### 4.2 获取环境数据

**请求**:

```
GET /api/v1/environment/{environmentId}
```

**响应**:

```json
{
  "environmentId": "e1f2g3h4",
  "location": {
    "latitude": 31.2304,
    "longitude": 121.4737,
    "placeName": "上海市",
    "country": "中国"
  },
  "weather": {
    "condition": "晴",
    "temperature": 26,
    "humidity": 65,
    "windSpeed": 10,
    "windDirection": "东北"
  },
  "time": {
    "localTime": "2023-05-15T22:30:00+08:00",
    "timeOfDay": "night",
    "isDaylight": false,
    "specialDate": null
  },
  "createdAt": "2023-05-15T14:30:00Z"
}
```

## 5. 图像生成API

### 5.1 请求生成图像

**请求**:

```
POST /api/v1/images/generate
Content-Type: application/json
```

**请求体**:

```json
{
  "audioId": "a1b2c3d4",
  "environmentId": "e1f2g3h4",
  "preferences": {
    "style": "watercolor",
    "aspectRatio": "1:1"
  }
}
```

**响应**:

```json
{
  "requestId": "r1s2t3u4",
  "status": "queued",
  "estimatedTime": 15
}
```

### 5.2 获取图像生成状态

**请求**:

```
GET /api/v1/images/generate/{requestId}
```

**响应**:

```json
{
  "requestId": "r1s2t3u4",
  "status": "completed",
  "imageId": "i1j2k3l4",
  "thumbnailUrl": "https://api.mumble.app/images/i1j2k3l4/thumbnail",
  "imageUrl": "https://api.mumble.app/images/i1j2k3l4/full"
}
```

### 5.3 获取图像详情

**请求**:

```
GET /api/v1/images/{imageId}
```

**响应**:

```json
{
  "imageId": "i1j2k3l4",
  "imageUrl": "https://api.mumble.app/images/i1j2k3l4/full",
  "thumbnailUrl": "https://api.mumble.app/images/i1j2k3l4/thumbnail",
  "prompt": "A serene beach scene with gentle waves under a starry night sky in Shanghai",
  "audioText": "今晚的海滩真美，波浪轻轻拍打着沙滩，天空中繁星点点",
  "createdAt": "2023-05-15T14:35:00Z",
  "environment": {
    "location": {
      "placeName": "上海市",
      "country": "中国"
    },
    "weather": {
      "condition": "晴",
      "temperature": 26
    },
    "time": {
      "timeOfDay": "night"
    }
  }
}
```

## 6. 图库管理API

### 6.1 获取用户图库

**请求**:

```
GET /api/v1/images
```

**查询参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| limit | Number | 否 | 每页结果数量，默认20 |
| offset | Number | 否 | 结果偏移量，默认0 |
| sortBy | String | 否 | 排序字段，可选值："createdAt"（默认）、"location" |
| order | String | 否 | 排序方向，可选值："desc"（默认）、"asc" |

**响应**:

```json
{
  "images": [
    {
      "imageId": "i1j2k3l4",
      "thumbnailUrl": "https://api.mumble.app/images/i1j2k3l4/thumbnail",
      "createdAt": "2023-05-15T14:35:00Z",
      "location": "上海市"
    },
    {
      "imageId": "i5j6k7l8",
      "thumbnailUrl": "https://api.mumble.app/images/i5j6k7l8/thumbnail",
      "createdAt": "2023-05-14T10:22:00Z",
      "location": "北京市"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

### 6.2 删除图像

**请求**:

```
DELETE /api/v1/images/{imageId}
```

**响应**:

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### 6.3 导出图像

**请求**:

```
GET /api/v1/images/{imageId}/export
```

**查询参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| format | String | 否 | 导出格式，可选值："jpg"（默认）、"png" |
| quality | Number | 否 | 图像质量，范围1-100，默认90 |

**响应**:

二进制图像数据，带有适当的Content-Type和Content-Disposition头。

## 7. 用户偏好API

### 7.1 获取用户偏好

**请求**:

```
GET /api/v1/preferences
```

**响应**:

```json
{
  "imageStyle": "watercolor",
  "privacySettings": {
    "saveAudioRecordings": false,
    "locationPrecision": "city",
    "shareAnalyticsData": true
  },
  "notifications": {
    "imageGeneration": true,
    "newFeatures": false
  },
  "lastUpdated": "2023-05-10T08:15:00Z"
}
```

### 7.2 更新用户偏好

**请求**:

```
PATCH /api/v1/preferences
Content-Type: application/json
```

**请求体**:

```json
{
  "imageStyle": "abstract",
  "privacySettings": {
    "locationPrecision": "exact"
  }
}
```

**响应**:

```json
{
  "success": true,
  "preferences": {
    "imageStyle": "abstract",
    "privacySettings": {
      "saveAudioRecordings": false,
      "locationPrecision": "exact",
      "shareAnalyticsData": true
    },
    "notifications": {
      "imageGeneration": true,
      "newFeatures": false
    },
    "lastUpdated": "2023-05-15T14:40:00Z"
  }
}
```

## 8. 健康检查API

### 8.1 API状态检查

**请求**:

```
GET /api/v1/health
```

**响应**:

```json
{
  "status": "ok",
  "version": "1.0.5",
  "timestamp": "2023-05-15T14:45:00Z",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "ai": "healthy"
  }
}
```

## 9. 速率限制

API实施以下速率限制：

- 音频上传：每分钟10次
- 图像生成：每小时20次
- 其他API调用：每分钟60次

超出限制时，API将返回429状态码（Too Many Requests）。

## 10. 版本控制

当前API版本为v1。未来版本更新将通过URL路径前缀（如`/api/v2/`）进行管理。API版本生命周期为：

- 活跃：完全支持
- 弃用：仍然可用，但不再添加新功能
- 停用：不再可用

API版本状态变更将提前90天通知。
