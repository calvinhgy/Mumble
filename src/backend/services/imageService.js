const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const Image = require('../models/Image');
const Audio = require('../models/Audio');
const Environment = require('../models/Environment');
const promptGenerator = require('../utils/promptGenerator');
const { v4: uuidv4 } = require('uuid');

// 初始化OpenAI客户端
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 生成图像
 * @param {string} requestId - 图像请求ID
 */
exports.generateImage = async (requestId) => {
  try {
    // 更新状态为处理中
    await Image.findByIdAndUpdate(requestId, { status: 'processing' });
    
    // 获取图像请求
    const imageRequest = await Image.findById(requestId);
    
    if (!imageRequest) {
      throw new Error('Image request not found');
    }
    
    // 获取音频和环境数据
    const audio = await Audio.findById(imageRequest.audioId);
    const environment = await Environment.findById(imageRequest.environmentId);
    
    if (!audio || !environment) {
      throw new Error('Required data not found');
    }
    
    // 生成提示词
    const prompt = promptGenerator.generatePrompt({
      text: audio.text,
      analysis: audio.analysis,
      environment: environment,
      stylePreference: imageRequest.stylePreference
    });
    
    console.log('Generated prompt:', prompt);
    
    // 调用DALL-E API生成图像
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });
    
    const imageUrl = response.data[0].url;
    
    // 下载图像
    const imageData = await downloadImage(imageUrl);
    
    // 保存图像和缩略图
    const { imagePath, thumbnailPath } = await saveImage(imageData, requestId);
    
    // 更新图像记录
    await Image.findByIdAndUpdate(requestId, {
      status: 'completed',
      fileName: path.basename(imagePath),
      imageUrl: `/uploads/images/${path.basename(imagePath)}`,
      thumbnailUrl: `/uploads/thumbnails/${path.basename(thumbnailPath)}`,
      promptText: prompt,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Image generation failed:', error);
    
    // 更新错误状态
    await Image.findByIdAndUpdate(requestId, {
      status: 'error',
      error: error.message
    });
  }
};

/**
 * 下载图像
 * @param {string} url - 图像URL
 * @returns {Promise<Buffer>} 图像数据
 */
const downloadImage = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Image download failed:', error);
    throw error;
  }
};

/**
 * 保存图像和缩略图
 * @param {Buffer} imageData - 图像数据
 * @param {string} requestId - 请求ID
 * @returns {Promise<Object>} 图像和缩略图路径
 */
const saveImage = async (imageData, requestId) => {
  try {
    // 确保目录存在
    const imagesDir = path.join(__dirname, '../uploads/images');
    const thumbnailsDir = path.join(__dirname, '../uploads/thumbnails');
    
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }
    
    // 生成文件名
    const fileName = `${requestId}_${uuidv4()}.jpg`;
    const imagePath = path.join(imagesDir, fileName);
    const thumbnailPath = path.join(thumbnailsDir, fileName);
    
    // 保存原始图像
    await fs.promises.writeFile(imagePath, imageData);
    
    // 创建缩略图
    await sharp(imageData)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return { imagePath, thumbnailPath };
  } catch (error) {
    console.error('Image save failed:', error);
    throw error;
  }
};
