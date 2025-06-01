const User = require('../models/User');
const { createError } = require('../utils/errorUtils');

/**
 * 获取用户偏好设置
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      ...user.preferences.toObject(),
      lastUpdated: user.lastActive
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户偏好设置
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const { imageStyle, privacySettings, notifications } = req.body;
    const user = req.user;
    
    // 更新图像风格
    if (imageStyle) {
      if (!['balanced', 'realistic', 'artistic', 'abstract'].includes(imageStyle)) {
        throw createError(400, 'INVALID_STYLE', 'Invalid image style');
      }
      user.preferences.imageStyle = imageStyle;
    }
    
    // 更新隐私设置
    if (privacySettings) {
      if (typeof privacySettings.saveAudioRecordings === 'boolean') {
        user.preferences.privacySettings.saveAudioRecordings = privacySettings.saveAudioRecordings;
      }
      
      if (privacySettings.locationPrecision) {
        if (!['exact', 'city', 'none'].includes(privacySettings.locationPrecision)) {
          throw createError(400, 'INVALID_LOCATION_PRECISION', 'Invalid location precision');
        }
        user.preferences.privacySettings.locationPrecision = privacySettings.locationPrecision;
      }
      
      if (typeof privacySettings.shareAnalyticsData === 'boolean') {
        user.preferences.privacySettings.shareAnalyticsData = privacySettings.shareAnalyticsData;
      }
    }
    
    // 更新通知设置
    if (notifications) {
      if (typeof notifications.imageGeneration === 'boolean') {
        user.preferences.notifications.imageGeneration = notifications.imageGeneration;
      }
      
      if (typeof notifications.newFeatures === 'boolean') {
        user.preferences.notifications.newFeatures = notifications.newFeatures;
      }
    }
    
    // 保存更新
    await user.save();
    
    res.status(200).json({
      success: true,
      preferences: {
        ...user.preferences.toObject(),
        lastUpdated: user.lastActive
      }
    });
  } catch (error) {
    next(error);
  }
};
