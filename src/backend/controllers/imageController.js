const Image = require('../models/Image');
const Audio = require('../models/Audio');
const Environment = require('../models/Environment');
const imageService = require('../services/imageService');
const { createError } = require('../utils/errorUtils');
const path = require('path');
const fs = require('fs');

/**
 * 请求生成图像
 */
exports.generateImage = async (req, res, next) => {
  try {
    const { audioId, environmentId, stylePreference } = req.body;
    
    if (!audioId || !environmentId) {
      throw createError(400, 'MISSING_PARAMETERS', 'Audio ID and Environment ID are required');
    }
    
    // 验证音频和环境数据存在
    const audio = await Audio.findById(audioId);
    if (!audio) {
      throw createError(404, 'AUDIO_NOT_FOUND', 'Audio not found');
    }
    
    const environment = await Environment.findById(environmentId);
    if (!environment) {
      throw createError(404, 'ENVIRONMENT_NOT_FOUND', 'Environment data not found');
    }
    
    // 创建图像生成请求
    const imageRequest = new Image({
      userId: req.user._id,
      deviceId: req.deviceId,
      audioId,
      environmentId,
      stylePreference: stylePreference || 'balanced',
      status: 'queued'
    });
    
    await imageRequest.save();
    
    // 异步生成图像
    imageService.generateImage(imageRequest._id);
    
    res.status(202).json({
      requestId: imageRequest._id,
      status: 'queued',
      estimatedTime: 15
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取图像生成状态
 */
exports.getImageStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    
    const image = await Image.findById(requestId);
    
    if (!image) {
      throw createError(404, 'REQUEST_NOT_FOUND', 'Image generation request not found');
    }
    
    const response = {
      requestId: image._id,
      status: image.status
    };
    
    if (image.status === 'completed') {
      response.imageId = image._id;
      response.imageUrl = image.imageUrl;
      response.thumbnailUrl = image.thumbnailUrl;
    } else if (image.status === 'error') {
      response.error = image.error;
    }
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取图库
 */
exports.getGallery = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // 构建查询
    const query = { deviceId: req.deviceId, status: 'completed' };
    
    // 构建排序
    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;
    
    // 执行查询
    const images = await Image.find(query)
      .sort(sort)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('environmentId', 'location.placeName');
    
    // 获取总数
    const total = await Image.countDocuments(query);
    
    // 格式化响应
    const formattedImages = images.map(image => ({
      imageId: image._id,
      thumbnailUrl: image.thumbnailUrl,
      createdAt: image.createdAt,
      location: image.environmentId?.location?.placeName || 'Unknown'
    }));
    
    res.status(200).json({
      images: formattedImages,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: total > parseInt(offset) + formattedImages.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取图像详情
 */
exports.getImageDetails = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    const image = await Image.findById(imageId)
      .populate('audioId', 'text')
      .populate('environmentId');
    
    if (!image) {
      throw createError(404, 'IMAGE_NOT_FOUND', 'Image not found');
    }
    
    if (image.status !== 'completed') {
      throw createError(400, 'IMAGE_NOT_READY', 'Image generation not completed');
    }
    
    // 格式化环境数据
    const environment = {
      location: {
        placeName: image.environmentId?.location?.placeName,
        country: image.environmentId?.location?.country
      },
      weather: {
        condition: image.environmentId?.weather?.condition,
        temperature: image.environmentId?.weather?.temperature
      },
      time: {
        timeOfDay: image.environmentId?.time?.timeOfDay
      }
    };
    
    res.status(200).json({
      imageId: image._id,
      imageUrl: image.imageUrl,
      thumbnailUrl: image.thumbnailUrl,
      prompt: image.promptText,
      audioText: image.audioId?.text,
      createdAt: image.createdAt,
      environment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 导出图像
 */
exports.exportImage = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const { format = 'jpg', quality = 90 } = req.query;
    
    const image = await Image.findById(imageId);
    
    if (!image) {
      throw createError(404, 'IMAGE_NOT_FOUND', 'Image not found');
    }
    
    if (image.status !== 'completed') {
      throw createError(400, 'IMAGE_NOT_READY', 'Image generation not completed');
    }
    
    // 获取图像文件路径
    const imagePath = path.join(__dirname, '..', image.imageUrl.replace(/^\/uploads/, 'uploads'));
    
    if (!fs.existsSync(imagePath)) {
      throw createError(404, 'FILE_NOT_FOUND', 'Image file not found');
    }
    
    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="mumble-${imageId}.${format}"`);
    res.setHeader('Content-Type', `image/${format}`);
    
    // 发送文件
    res.sendFile(imagePath);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除图像
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    const image = await Image.findOne({ _id: imageId, deviceId: req.deviceId });
    
    if (!image) {
      throw createError(404, 'IMAGE_NOT_FOUND', 'Image not found');
    }
    
    // 删除图像文件
    if (image.imageUrl) {
      const imagePath = path.join(__dirname, '..', image.imageUrl.replace(/^\/uploads/, 'uploads'));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    if (image.thumbnailUrl) {
      const thumbnailPath = path.join(__dirname, '..', image.thumbnailUrl.replace(/^\/uploads/, 'uploads'));
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
    
    // 删除数据库记录
    await image.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
