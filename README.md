# Mumble

Mumble是一个创意Web应用，专为iPhone用户设计。用户只需按下"M"按钮并开始喃喃自语，当松开按钮时，应用会根据用户的语音、语调、背景声音以及环境数据（如地理位置、天气、时间等）动态生成一幅独特的图片。

## 🌟 核心功能

- **语音捕捉**：通过按住"M"按钮录制用户的喃喃自语
- **环境数据收集**：获取用户位置、天气、时间等上下文信息
- **AI图像生成**：基于语音和环境数据创建独特图像
- **图库管理**：浏览、查看和导出生成的图片

## 🛠 技术栈

### 前端
- **React.js** - 用户界面框架
- **Redux Toolkit** - 状态管理
- **TailwindCSS** - 样式框架
- **React Router** - 路由管理
- **Axios** - HTTP客户端
- **Web Audio API** - 音频处理

### 后端
- **Node.js** - 运行时环境
- **Express.js** - Web框架
- **MongoDB** - 数据库
- **Mongoose** - ODM
- **Multer** - 文件上传
- **Sharp** - 图像处理

### AI服务
- **OpenAI API** - GPT-4 + DALL-E 3
- **Whisper** - 语音转文本

### 外部API
- **OpenWeatherMap API** - 天气和地理位置数据

## 📁 项目结构

```
/
├── docs/                    # 项目文档
│   ├── requirements/        # 需求文档
│   ├── design/             # 设计文档和UI/UX规范
│   ├── architecture/       # 系统架构文档
│   ├── api/                # API规范和文档
│   ├── prompts/            # AI提示工程文档
│   └── testing/            # 测试策略和计划
├── src/                    # 源代码
│   ├── frontend/           # 前端代码
│   │   ├── public/         # 静态资源
│   │   └── src/            # React源码
│   │       ├── components/ # React组件
│   │       ├── pages/      # 页面组件
│   │       ├── hooks/      # 自定义钩子
│   │       ├── services/   # API服务
│   │       ├── store/      # Redux状态管理
│   │       ├── utils/      # 工具函数
│   │       ├── config/     # 配置文件
│   │       └── styles/     # 样式文件
│   └── backend/            # 后端代码
│       ├── config/         # 配置文件
│       ├── controllers/    # 控制器
│       ├── models/         # 数据模型
│       ├── routes/         # 路由
│       ├── services/       # 业务服务
│       ├── middleware/     # 中间件
│       ├── utils/          # 工具函数
│       └── uploads/        # 上传文件存储
├── start-dev.sh           # 开发环境启动脚本
└── README.md              # 项目说明
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB >= 5.0.0

### 1. 克隆项目

```bash
git clone <repository-url>
cd Mumble
```

### 2. 配置环境变量

#### 后端环境变量 (`src/backend/.env`)

```env
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/mumble

# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# 天气API配置
OPENWEATHER_API_KEY=your_openweather_api_key_here

# 服务器配置
PORT=5000
NODE_ENV=development

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# JWT配置（如果需要）
JWT_SECRET=your_jwt_secret_here
```

#### 前端环境变量 (`src/frontend/.env`)

```env
# API配置
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1

# 功能开关
REACT_APP_DEBUG_MODE=true
REACT_APP_MOCK_API=false
```

### 3. 启动开发环境

使用提供的启动脚本：

```bash
./start-dev.sh
```

或者手动启动：

```bash
# 启动后端
cd src/backend
npm install
npm run dev

# 启动前端（新终端）
cd src/frontend
npm install
npm start
```

### 4. 访问应用

- 前端应用：http://localhost:3000
- 后端API：http://localhost:5000
- API健康检查：http://localhost:5000/api/v1/health

## 📱 使用说明

1. **首次使用**：应用会请求麦克风和位置权限
2. **录音创作**：按住中央的"M"按钮开始录音，松开结束
3. **等待生成**：AI会分析你的语音和环境数据生成图片
4. **查看结果**：生成的图片会显示在屏幕上
5. **图库管理**：点击右上角图库按钮查看所有创作

## 🔧 开发指南

### 开发方法

本项目采用**Prompt Driven Development (PDD)**方法进行开发，详细文档位于`/docs`目录。

### 代码规范

- 使用ESLint和Prettier进行代码格式化
- 遵循React Hooks最佳实践
- 使用TypeScript类型注释（逐步迁移）
- 编写单元测试和集成测试

### 提交规范

使用Conventional Commits规范：

```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

## 🧪 测试

```bash
# 运行前端测试
cd src/frontend
npm test

# 运行后端测试
cd src/backend
npm test

# 运行端到端测试
npm run test:e2e
```

## 📦 构建和部署

### 构建生产版本

```bash
# 构建前端
cd src/frontend
npm run build

# 构建后端（如果需要）
cd src/backend
npm run build
```

### 部署

详细的部署指南请参考 `docs/deployment.md`

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👥 开发团队

- **产品经理** - 产品规划和需求管理
- **UI/UX设计师** - 用户界面和体验设计
- **前端开发工程师** - React应用开发
- **后端开发工程师** - Node.js API开发
- **AI工程师** - AI服务集成和优化
- **QA工程师** - 质量保证和测试

## 📞 支持

如果你遇到任何问题或有建议，请：

1. 查看 [FAQ](docs/faq.md)
2. 搜索现有的 [Issues](../../issues)
3. 创建新的 Issue
4. 联系开发团队

## 🔄 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史。

---

**Mumble** - 让你的声音变成艺术 🎨
