const { OpenAI } = require('openai');
const fs = require('fs');
const Audio = require('../models/Audio');
const User = require('../models/User');

// 初始化OpenAI客户端
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 处理音频文件
 * @param {string} audioId - 音频记录ID
 */
exports.processAudio = async (audioId) => {
  try {
    const audio = await Audio.findById(audioId);
    
    if (!audio) {
      console.error(`Audio not found: ${audioId}`);
      return;
    }
    
    // 获取用户偏好
    const user = await User.findById(audio.userId);
    const saveAudioRecordings = user?.preferences?.privacySettings?.saveAudioRecordings || false;
    
    try {
      // 使用OpenAI转录音频
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audio.filePath),
        model: "whisper-1"
      });
      
      // 分析文本内容
      const analysis = await analyzeText(transcription.text);
      
      // 更新数据库记录
      audio.text = transcription.text;
      audio.analysis = analysis;
      audio.status = 'completed';
      
      // 如果用户不保存录音，设置较短的过期时间
      if (!saveAudioRecordings) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1); // 1天后过期
        audio.expiresAt = expiryDate;
      }
      
      await audio.save();
    } catch (error) {
      console.error('Audio processing failed:', error);
      
      audio.status = 'error';
      audio.error = error.message;
      await audio.save();
    }
  } catch (error) {
    console.error('Audio service error:', error);
  }
};

/**
 * 分析文本内容
 * @param {string} text - 要分析的文本
 * @returns {Object} 分析结果
 */
const analyzeText = async (text) => {
  try {
    // 使用OpenAI分析文本情感和关键词
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "分析以下文本的情感、主题和关键词。返回JSON格式，包含sentiment、themes和keywords字段。sentiment可以是positive、negative、neutral或excited、calm、sad等更具体的情感。"
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      sentiment: result.sentiment,
      keywords: result.keywords || [],
      themes: result.themes || []
    };
  } catch (error) {
    console.error('Text analysis failed:', error);
    return {
      sentiment: 'neutral',
      keywords: [],
      themes: []
    };
  }
};
