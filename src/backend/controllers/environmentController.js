const Environment = require('../models/Environment');
const environmentService = require('../services/environmentService');
const { createError } = require('../utils/errorUtils');

/**
 * 提交环境数据
 */
exports.submitEnvironmentData = async (req, res, next) => {
  try {
    const { location, device, timestamp } = req.body;
    
    if (!location || !location.latitude || !location.longitude) {
      throw createError(400, 'INVALID_LOCATION', 'Valid location data is required');
    }
    
    // 处理环境数据
    const environmentData = await environmentService.processEnvironmentData({
      userId: req.user._id,
      deviceId: req.deviceId,
      location,
      device,
      timestamp: timestamp || new Date()
    });
    
    res.status(200).json({
      environmentId: environmentData._id,
      enrichedData: {
        location: environmentData.location,
        weather: environmentData.weather,
        time: environmentData.time
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取环境数据
 */
exports.getEnvironmentData = async (req, res, next) => {
  try {
    const { environmentId } = req.params;
    
    const environment = await Environment.findById(environmentId);
    
    if (!environment) {
      throw createError(404, 'ENVIRONMENT_NOT_FOUND', 'Environment data not found');
    }
    
    res.status(200).json({
      environmentId: environment._id,
      location: environment.location,
      weather: environment.weather,
      time: environment.time,
      createdAt: environment.createdAt
    });
  } catch (error) {
    next(error);
  }
};
