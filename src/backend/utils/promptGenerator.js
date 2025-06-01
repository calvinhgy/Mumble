const styleLibrary = require('./styleLibrary');
const emotionMapping = require('./emotionMapping');
const environmentElements = require('./environmentElements');

/**
 * 生成图像提示词
 * @param {Object} data - 提示词生成数据
 * @param {string} data.text - 用户语音文本
 * @param {Object} data.analysis - 文本分析结果
 * @param {Object} data.environment - 环境数据
 * @param {string} data.stylePreference - 风格偏好
 * @returns {string} 生成的提示词
 */
exports.generatePrompt = (data) => {
  const { text, analysis, environment, stylePreference } = data;
  
  // 提取关键信息
  const sentiment = analysis?.sentiment || 'neutral';
  const keywords = analysis?.keywords || [];
  const themes = analysis?.themes || [];
  
  // 获取环境数据
  const location = environment.location.placeName || 'Unknown';
  const weather = environment.weather?.condition || 'Clear';
  const timeOfDay = environment.time?.timeOfDay || 'day';
  
  // 选择风格
  const style = selectStyle(sentiment, weather, timeOfDay, stylePreference);
  
  // 构建场景描述
  const subject = extractSubject(text, keywords);
  const action = extractAction(text, keywords);
  const environmentDesc = buildEnvironmentDescription(location, weather, timeOfDay);
  
  // 选择情感描述
  const emotion = emotionMapping[sentiment] || emotionMapping.neutral;
  
  // 构建天气和时间描述
  const weatherAndTime = buildWeatherAndTimeDescription(weather, timeOfDay);
  
  // 选择技术参数
  const technicalParams = selectTechnicalParams(style);
  
  // 根据情感选择模板
  let template;
  if (sentiment === 'positive' || sentiment === 'excited' || sentiment === 'happy') {
    template = `一幅充满活力的${style}作品，以明亮的色彩和动态构图捕捉${subject}${action}的瞬间，在${environmentDesc}中洋溢着欢乐的氛围，${weatherAndTime}增强了场景的喜悦感，${technicalParams}。`;
  } else if (sentiment === 'negative' || sentiment === 'sad') {
    template = `一幅情感深沉的${style}作品，通过低饱和度的色彩和强烈的明暗对比，描绘${subject}在${environmentDesc}中${action}的场景，${weatherAndTime}强化了忧郁的氛围，${technicalParams}。`;
  } else if (sentiment === 'calm' || sentiment === 'peaceful') {
    template = `一幅平静的${style}作品，以柔和的色调和和谐的构图展现${subject}在${environmentDesc}中${action}的场景，${weatherAndTime}营造出宁静的氛围，整体透露出沉思的情绪，${technicalParams}。`;
  } else if (sentiment === 'surprised' || sentiment === 'amazed') {
    template = `一幅令人惊叹的${style}作品，通过戏剧性的光影和鲜明的对比，展现${subject}在${environmentDesc}中${action}的瞬间，${weatherAndTime}增强了场景的震撼感，整体氛围充满惊奇和意外，${technicalParams}。`;
  } else if (sentiment === 'angry' || sentiment === 'frustrated') {
    template = `一幅情绪强烈的${style}作品，通过动态的线条和强烈的红色调，表现${subject}在${environmentDesc}中${action}的紧张状态，${weatherAndTime}与情绪形成呼应，整体氛围充满力量和冲突，${technicalParams}。`;
  } else {
    // 默认中性情感模板
    template = `一幅精致的${style}作品，展现${subject}在${environmentDesc}中${action}的场景，${weatherAndTime}创造出独特的氛围，整体画面平衡而和谐，${technicalParams}。`;
  }
  
  // 添加安全提示，确保生成适当内容
  const safetyPrompt = "请确保生成适合所有年龄段的安全内容，不包含任何暴力、血腥或不适当的元素。";
  
  // 添加质量提示，确保高质量输出
  const qualityPrompt = "创作一幅高质量、美观且具有艺术价值的图像，注重细节和整体美感。";
  
  // 组合最终提示词
  return `${template} ${safetyPrompt} ${qualityPrompt}`;
};

/**
 * 选择艺术风格
 * @param {string} sentiment - 情感
 * @param {string} weather - 天气
 * @param {string} timeOfDay - 时间
 * @param {string} preference - 用户偏好
 * @returns {string} 艺术风格
 */
const selectStyle = (sentiment, weather, timeOfDay, preference) => {
  // 根据用户偏好选择风格
  if (preference) {
    switch (preference) {
      case 'realistic':
        return styleLibrary.realistic[Math.floor(Math.random() * styleLibrary.realistic.length)];
      case 'artistic':
        return styleLibrary.impressionist[Math.floor(Math.random() * styleLibrary.impressionist.length)];
      case 'abstract':
        return styleLibrary.abstract[Math.floor(Math.random() * styleLibrary.abstract.length)];
    }
  }
  
  // 根据情感、天气和时间选择风格
  if (weather === 'Rain' || weather === 'Drizzle') {
    return styleLibrary.watercolor[Math.floor(Math.random() * styleLibrary.watercolor.length)];
  } else if (timeOfDay === 'night') {
    return styleLibrary.cyberpunk[Math.floor(Math.random() * styleLibrary.cyberpunk.length)];
  } else if (sentiment === 'positive' || sentiment === 'excited' || sentiment === 'happy') {
    return styleLibrary.impressionist[Math.floor(Math.random() * styleLibrary.impressionist.length)];
  } else if (sentiment === 'negative' || sentiment === 'sad') {
    return styleLibrary.expressionist[Math.floor(Math.random() * styleLibrary.expressionist.length)];
  } else if (sentiment === 'calm' || sentiment === 'peaceful') {
    return styleLibrary.minimalist[Math.floor(Math.random() * styleLibrary.minimalist.length)];
  }
  
  // 默认风格
  const allStyles = [
    ...styleLibrary.realistic,
    ...styleLibrary.impressionist,
    ...styleLibrary.watercolor,
    ...styleLibrary.minimalist
  ];
  
  return allStyles[Math.floor(Math.random() * allStyles.length)];
};

/**
 * 提取主体
 * @param {string} text - 用户语音文本
 * @param {Array} keywords - 关键词
 * @returns {string} 主体描述
 */
const extractSubject = (text, keywords) => {
  if (!text || text.trim() === '') {
    return '一个人';
  }
  
  // 尝试从关键词中提取主体
  if (keywords && keywords.length > 0) {
    const subjectKeywords = keywords.filter(keyword => 
      !keyword.includes('天气') && 
      !keyword.includes('时间') && 
      !keyword.includes('感觉')
    );
    
    if (subjectKeywords.length > 0) {
      return subjectKeywords[0];
    }
  }
  
  // 常见主体词汇
  const commonSubjects = ['人', '女孩', '男孩', '风景', '城市', '树', '花', '山', '海', '动物', '建筑'];
  
  // 检查文本中是否包含常见主体
  for (const subject of commonSubjects) {
    if (text.includes(subject)) {
      // 为主体添加修饰词
      const modifiers = ['年轻的', '美丽的', '壮观的', '宁静的', '繁忙的', '古老的', '现代的', '神秘的'];
      const randomModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      
      return `${randomModifier}${subject}`;
    }
  }
  
  // 如果文本很短，可能是简单的感叹词
  if (text.length < 10) {
    return '一个人';
  }
  
  // 默认返回一个通用主体
  return '场景';
};

/**
 * 提取动作
 * @param {string} text - 用户语音文本
 * @param {Array} keywords - 关键词
 * @returns {string} 动作描述
 */
const extractAction = (text, keywords) => {
  if (!text || text.trim() === '') {
    return '沉思';
  }
  
  // 尝试从文本中提取动词
  const actionWords = [
    { word: '走', action: '行走' },
    { word: '看', action: '观察' },
    { word: '听', action: '聆听' },
    { word: '感受', action: '感受' },
    { word: '思考', action: '思考' },
    { word: '想象', action: '想象' },
    { word: '体验', action: '体验' },
    { word: '享受', action: '享受' },
    { word: '微笑', action: '微笑' },
    { word: '奔跑', action: '奔跑' },
    { word: '跳舞', action: '跳舞' },
    { word: '唱歌', action: '唱歌' },
    { word: '哭', action: '哭泣' },
    { word: '笑', action: '欢笑' }
  ];
  
  for (const { word, action } of actionWords) {
    if (text.includes(word)) {
      return `${action}着`;
    }
  }
  
  // 从关键词中提取动作
  if (keywords && keywords.length > 1) {
    for (const keyword of keywords) {
      for (const { word, action } of actionWords) {
        if (keyword.includes(word)) {
          return `${action}着`;
        }
      }
    }
  }
  
  // 根据文本长度和内容选择默认动作
  if (text.length < 15) {
    return '沉思着';
  } else if (text.includes('喜欢') || text.includes('爱') || text.includes('开心')) {
    return '享受着';
  } else if (text.includes('想') || text.includes('认为') || text.includes('觉得')) {
    return '思考着';
  }
  
  // 默认动作
  const defaultActions = ['体验着', '感受着', '观察着', '沉浸在', '置身于'];
  return defaultActions[Math.floor(Math.random() * defaultActions.length)];
};

/**
 * 构建环境描述
 * @param {string} location - 位置
 * @param {string} weather - 天气
 * @param {string} timeOfDay - 时间
 * @returns {string} 环境描述
 */
const buildEnvironmentDescription = (location, weather, timeOfDay) => {
  // 获取位置描述
  const locationDesc = location !== 'Unknown' ? location : '一个地方';
  
  // 获取环境元素
  const weatherElement = environmentElements.weather[weather] || environmentElements.weather.Clear;
  const timeElement = environmentElements.time[timeOfDay] || environmentElements.time.day;
  
  // 随机选择描述变体
  const weatherDesc = weatherElement[Math.floor(Math.random() * weatherElement.length)];
  const timeDesc = timeElement[Math.floor(Math.random() * timeElement.length)];
  
  // 组合环境描述
  return `${locationDesc}的${weatherDesc}${timeDesc}环境中`;
};

/**
 * 构建天气和时间描述
 * @param {string} weather - 天气
 * @param {string} timeOfDay - 时间
 * @returns {string} 天气和时间描述
 */
const buildWeatherAndTimeDescription = (weather, timeOfDay) => {
  // 获取环境元素
  const weatherElement = environmentElements.weather[weather] || environmentElements.weather.Clear;
  const timeElement = environmentElements.time[timeOfDay] || environmentElements.time.day;
  
  // 随机选择描述变体
  const weatherDesc = weatherElement[Math.floor(Math.random() * weatherElement.length)];
  const timeDesc = timeElement[Math.floor(Math.random() * timeElement.length)];
  
  // 组合描述
  const descriptions = [
    `${weatherDesc}和${timeDesc}`,
    `${timeDesc}的光线和${weatherDesc}的氛围`,
    `${weatherDesc}的环境和${timeDesc}的光影`,
    `${timeDesc}特有的光线照射在${weatherDesc}的场景中`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

/**
 * 选择技术参数
 * @param {string} style - 艺术风格
 * @returns {string} 技术参数
 */
const selectTechnicalParams = (style) => {
  const params = [];
  
  // 基础参数
  params.push('高质量');
  
  // 风格特定参数
  if (style.includes('写实')) {
    params.push(...['精细细节', '自然光影', '逼真质感']);
  } else if (style.includes('印象派') || style.includes('水彩')) {
    params.push(...['富有表现力的笔触', '和谐的色彩平衡', '强调情感表达']);
  } else if (style.includes('赛博朋克')) {
    params.push(...['戏剧性光影', '高对比度', '未来感细节']);
  } else if (style.includes('极简')) {
    params.push(...['简洁线条', '留白设计', '精准构图']);
  } else {
    params.push(...['平衡构图', '细腻质感']);
  }
  
  // 随机添加一些额外参数
  const extraParams = [
    '精心构图',
    '丰富细节',
    '和谐色调',
    '完美光影',
    '艺术性构图',
    '专业级别',
    '引人入胜',
    '视觉震撼',
    '精致呈现'
  ];
  
  // 随机选择1-2个额外参数
  const extraCount = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < extraCount; i++) {
    const randomIndex = Math.floor(Math.random() * extraParams.length);
    const param = extraParams[randomIndex];
    if (!params.includes(param)) {
      params.push(param);
    }
  }
  
  // 随机打乱参数顺序
  return params.sort(() => Math.random() - 0.5).join('，');
};
