const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

/**
 * API状态检查
 */
exports.checkHealth = async (req, res, next) => {
  try {
    // 检查数据库连接
    const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
    
    // 检查存储
    let storageStatus = 'healthy';
    try {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.accessSync(uploadDir, fs.constants.W_OK);
    } catch (error) {
      storageStatus = 'unhealthy';
    }
    
    // 检查AI服务
    let aiStatus = 'unknown';
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        await openai.models.list();
        aiStatus = 'healthy';
      } catch (error) {
        aiStatus = 'unhealthy';
      }
    }
    
    res.status(200).json({
      status: dbStatus === 'healthy' && storageStatus === 'healthy' ? 'ok' : 'degraded',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        storage: storageStatus,
        ai: aiStatus
      }
    });
  } catch (error) {
    next(error);
  }
};
