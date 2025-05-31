# Mumble

Mumble是一个创意Web应用，专为iPhone用户设计。用户只需按下"M"按钮并开始喃喃自语，当松开按钮时，应用会根据用户的语音、语调、背景声音以及环境数据（如地理位置、天气、时间等）动态生成一幅独特的图片。

## 核心功能

- 语音捕捉：通过按住"M"按钮录制用户的喃喃自语
- 环境数据收集：获取用户位置、天气、时间等上下文信息
- AI图像生成：基于语音和环境数据创建独特图像
- 图库管理：浏览、查看和导出生成的图片

## 技术栈

- 前端：React.js, TailwindCSS
- 后端：Node.js, Express
- 数据库：MongoDB
- AI服务：OpenAI API (GPT-4 + DALL-E 3)
- 地理位置和天气API：OpenWeatherMap API
- 音频处理：Web Audio API

## 开发方法

本项目采用Prompt Driven Development (PDD)方法进行开发，详细文档位于`/docs`目录。

## 目录结构

```
/docs
  /requirements - 需求文档
  /design - 设计文档和UI/UX规范
  /architecture - 系统架构文档
  /api - API规范和文档
  /prompts - AI提示工程文档
  /testing - 测试策略和计划
/src - 源代码
/public - 静态资源
```

## 开发团队

- 产品经理
- UI/UX设计师
- 前端开发工程师
- 后端开发工程师
- AI工程师
- QA工程师
# Mumble
