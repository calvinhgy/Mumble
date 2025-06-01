const Audio = require('../models/Audio');
const audioService = require('../services/audioService');
const { createError } = require('../utils/errorUtils');

/**
 * 上传音频文件
 */
exports.uploadAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, 'MISSING_FILE', 'Audio file is required');
    }
    
    const { duration } = req.body;
    
    if (!duration) {
      throw createError(400, 'MISSING_DURATION', 'Audio duration is required');
    }
    
    // 创建音频记录
    const audio = new Audio({
      userId: req.user._id,
      deviceId: req.deviceId,
      fileName: req.file.filename,
      filePath: req.file.path,
      duration: parseFloat(duration),
      status: 'processing'
    });
    
    await audio.save();
    
    // 异步处理音频
    audioService.processAudio(audio._id);
    
    // 返回响应
    res.status(200).json({
      audioId: audio._id,
      status: 'processing',
      estimatedProcessingTime: Math.min(5, audio.duration / 6)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取音频处理状态
 */
exports.getAudioStatus = async (req, res, next) => {
  try {
    const { audioId } = req.params;
    
    const audio = await Audio.findById(audioId);
    
    if (!audio) {
      throw createError(404, 'AUDIO_NOT_FOUND', 'Audio not found');
    }
    
    const response = {
      audioId: audio._id,
      status: audio.status
    };
    
    if (audio.status === 'completed') {
      response.text = audio.text;
      response.analysis = audio.analysis;
    } else if (audio.status === 'error') {
      response.error = audio.error;
    }
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取音频文本
 */
exports.getAudioText = async (req, res, next) => {
  try {
    const { audioId } = req.params;
    
    const audio = await Audio.findById(audioId);
    
    if (!audio) {
      throw createError(404, 'AUDIO_NOT_FOUND', 'Audio not found');
    }
    
    if (audio.status !== 'completed') {
      throw createError(400, 'AUDIO_NOT_PROCESSED', 'Audio processing not completed');
    }
    
    res.status(200).json({
      audioId: audio._id,
      text: audio.text,
      createdAt: audio.createdAt
    });
  } catch (error) {
    next(error);
  }
};
