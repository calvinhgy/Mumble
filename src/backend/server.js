const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// 导入配置
const { connectDB } = require('./config/database');
const { checkOpenAIConnection } = require('./config/openai');
const { checkWeatherAPIConnection } = require('./config/weather');

// 导入路由
const audioRoutes = require('./routes/audioRoutes');
const environmentRoutes = require('./routes/environmentRoutes');
const imageRoutes = require('./routes/imageRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const healthRoutes = require('./routes/healthRoutes');

// 创建Express应用
const app = express();

// 连接数据库
connectDB();

// 中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析
app.use(morgan('dev')); // 日志

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API路由
app.use('/api/v1/audio', audioRoutes);
app.use('/api/v1/environment', environmentRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/preferences', preferenceRoutes);
app.use('/api/v1/health', healthRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.details || err.stack : undefined
    }
  };
  
  res.status(statusCode).json(errorResponse);
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  
  // 检查外部服务连接
  console.log('Checking external services...');
  
  // 检查OpenAI连接
  const openaiStatus = await checkOpenAIConnection();
  console.log(`OpenAI API: ${openaiStatus.status}`);
  if (openaiStatus.error) {
    console.warn(`OpenAI API Warning: ${openaiStatus.error}`);
  }
  
  // 检查天气API连接
  const weatherStatus = await checkWeatherAPIConnection();
  console.log(`Weather API: ${weatherStatus.status}`);
  if (weatherStatus.error) {
    console.warn(`Weather API Warning: ${weatherStatus.error}`);
  }
  
  console.log('Server startup complete!');
});
