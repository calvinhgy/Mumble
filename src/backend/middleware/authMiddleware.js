const User = require('../models/User');

/**
 * 验证设备ID中间件
 * 从请求头中获取设备ID，并查找或创建对应的用户
 */
exports.validateDeviceId = async (req, res, next) => {
  try {
    const deviceId = req.headers['x-device-id'];
    
    if (!deviceId) {
      return res.status(401).json({
        error: {
          code: 'MISSING_DEVICE_ID',
          message: 'Device ID is required'
        }
      });
    }
    
    // 查找或创建用户
    const user = await User.findOrCreateByDeviceId(deviceId);
    
    // 将用户和设备ID添加到请求对象
    req.user = user;
    req.deviceId = deviceId;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(error);
  }
};

/**
 * 速率限制中间件
 * 限制特定端点的请求频率
 */
exports.rateLimit = (options) => {
  const { windowMs = 60000, max = 10, message = 'Too many requests' } = options;
  
  // 存储请求计数的简单内存存储
  const requests = new Map();
  
  return (req, res, next) => {
    const deviceId = req.deviceId || req.headers['x-device-id'] || req.ip;
    const now = Date.now();
    
    // 清理过期的请求记录
    if (requests.has(deviceId)) {
      const userRequests = requests.get(deviceId).filter(time => now - time < windowMs);
      requests.set(deviceId, userRequests);
      
      if (userRequests.length >= max) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message
          }
        });
      }
      
      userRequests.push(now);
    } else {
      requests.set(deviceId, [now]);
    }
    
    next();
  };
};
