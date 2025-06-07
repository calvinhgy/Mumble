const { OpenAI } = require('openai');

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60秒超时
  maxRetries: 3, // 最大重试次数
});

/**
 * 检查OpenAI API连接
 */
const checkOpenAIConnection = async () => {
  try {
    const response = await openai.models.list();
    return {
      status: 'connected',
      models: response.data.length
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

/**
 * 文本分析配置
 */
const TEXT_ANALYSIS_CONFIG = {
  model: 'gpt-4',
  temperature: 0.3,
  max_tokens: 500,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0
};

/**
 * 图像生成配置
 */
const IMAGE_GENERATION_CONFIG = {
  model: 'dall-e-3',
  size: '1024x1024',
  quality: 'standard',
  n: 1,
  response_format: 'url'
};

/**
 * 语音转文本配置
 */
const SPEECH_TO_TEXT_CONFIG = {
  model: 'whisper-1',
  language: 'zh',
  temperature: 0.2,
  response_format: 'json'
};

/**
 * 分析文本内容
 * @param {string} text 要分析的文本
 * @returns {Promise<Object>} 分析结果
 */
const analyzeText = async (text) => {
  try {
    const prompt = `请分析以下文本的情感、主题和关键词：

文本: "${text}"

请以JSON格式返回分析结果，包含以下字段：
- sentiment: 情感倾向 (positive/negative/neutral/excited/calm/sad)
- themes: 主要主题数组
- keywords: 关键词数组
- mood: 情绪描述
- tone: 语调描述
- imagery: 可能的视觉元素数组

示例格式：
{
  "sentiment": "positive",
  "themes": ["nature", "freedom"],
  "keywords": ["sky", "bird", "fly"],
  "mood": "joyful",
  "tone": "enthusiastic",
  "imagery": ["blue sky", "flying bird", "open landscape"]
}`;

    const response = await openai.chat.completions.create({
      ...TEXT_ANALYSIS_CONFIG,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文本分析师，擅长分析文本的情感、主题和视觉元素。请始终以JSON格式返回结果。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      // 如果JSON解析失败，返回基础分析
      return {
        sentiment: 'neutral',
        themes: [text.substring(0, 20)],
        keywords: text.split(' ').slice(0, 5),
        mood: 'neutral',
        tone: 'conversational',
        imagery: ['abstract concept']
      };
    }
  } catch (error) {
    console.error('Text analysis failed:', error);
    throw new Error(`Text analysis failed: ${error.message}`);
  }
};

/**
 * 生成图像
 * @param {string} prompt 图像提示词
 * @returns {Promise<string>} 图像URL
 */
const generateImage = async (prompt) => {
  try {
    const response = await openai.images.generate({
      ...IMAGE_GENERATION_CONFIG,
      prompt: prompt
    });

    return response.data[0].url;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
};

/**
 * 语音转文本
 * @param {Buffer} audioBuffer 音频数据
 * @param {string} filename 文件名
 * @returns {Promise<Object>} 转录结果
 */
const transcribeAudio = async (audioBuffer, filename = 'audio.webm') => {
  try {
    const file = new File([audioBuffer], filename, { type: 'audio/webm' });
    
    const response = await openai.audio.transcriptions.create({
      ...SPEECH_TO_TEXT_CONFIG,
      file: file
    });

    return {
      text: response.text,
      language: response.language || 'zh',
      duration: response.duration
    };
  } catch (error) {
    console.error('Audio transcription failed:', error);
    throw new Error(`Audio transcription failed: ${error.message}`);
  }
};

/**
 * 获取可用模型列表
 */
const getAvailableModels = async () => {
  try {
    const response = await openai.models.list();
    return response.data.map(model => ({
      id: model.id,
      created: model.created,
      owned_by: model.owned_by
    }));
  } catch (error) {
    console.error('Failed to get models:', error);
    throw new Error(`Failed to get models: ${error.message}`);
  }
};

/**
 * 检查API使用情况
 */
const checkAPIUsage = async () => {
  try {
    // OpenAI API 目前不提供使用情况查询接口
    // 这里可以实现自定义的使用统计
    return {
      status: 'available',
      message: 'API usage tracking not available'
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

module.exports = {
  openai,
  checkOpenAIConnection,
  analyzeText,
  generateImage,
  transcribeAudio,
  getAvailableModels,
  checkAPIUsage,
  TEXT_ANALYSIS_CONFIG,
  IMAGE_GENERATION_CONFIG,
  SPEECH_TO_TEXT_CONFIG
};
