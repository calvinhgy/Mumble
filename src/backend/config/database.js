const mongoose = require('mongoose');

/**
 * 数据库连接配置
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumble';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // 连接池最大连接数
      serverSelectionTimeoutMS: 5000, // 服务器选择超时时间
      socketTimeoutMS: 45000, // Socket超时时间
      bufferMaxEntries: 0, // 禁用mongoose缓冲
      bufferCommands: false, // 禁用mongoose缓冲命令
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // 监听连接事件
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });
    
    // 优雅关闭
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

/**
 * 数据库健康检查
 */
const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: states[state] || 'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

/**
 * 获取数据库统计信息
 */
const getDBStats = async () => {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  checkDBHealth,
  getDBStats
};
