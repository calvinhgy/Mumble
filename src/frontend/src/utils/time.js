import { TIME_FORMATS } from '../config/constants';

/**
 * 格式化时间
 * @param {Date|string|number} date 时间
 * @param {string} format 格式
 * @returns {string} 格式化后的时间
 */
export const formatTime = (date, format = TIME_FORMATS.FULL) => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return '无效时间';
  }
  
  if (format === TIME_FORMATS.RELATIVE) {
    return getRelativeTime(d);
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case TIME_FORMATS.DATE:
      return `${year}-${month}-${day}`;
    case TIME_FORMATS.TIME:
      return `${hours}:${minutes}:${seconds}`;
    case TIME_FORMATS.FULL:
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
};

/**
 * 获取相对时间
 * @param {Date} date 时间
 * @returns {string} 相对时间描述
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else if (weeks < 4) {
    return `${weeks}周前`;
  } else if (months < 12) {
    return `${months}个月前`;
  } else {
    return `${years}年前`;
  }
};

/**
 * 获取时段
 * @param {Date} date 时间
 * @returns {string} 时段描述
 */
export const getTimeOfDay = (date = new Date()) => {
  const hour = new Date(date).getHours();
  
  if (hour >= 5 && hour < 8) {
    return 'early_morning'; // 清晨
  } else if (hour >= 8 && hour < 12) {
    return 'morning'; // 上午
  } else if (hour >= 12 && hour < 14) {
    return 'noon'; // 中午
  } else if (hour >= 14 && hour < 18) {
    return 'afternoon'; // 下午
  } else if (hour >= 18 && hour < 20) {
    return 'evening'; // 傍晚
  } else if (hour >= 20 && hour < 23) {
    return 'night'; // 晚上
  } else {
    return 'late_night'; // 深夜
  }
};

/**
 * 获取时段中文描述
 * @param {string} timeOfDay 时段
 * @returns {string} 中文描述
 */
export const getTimeOfDayLabel = (timeOfDay) => {
  const labels = {
    early_morning: '清晨',
    morning: '上午',
    noon: '中午',
    afternoon: '下午',
    evening: '傍晚',
    night: '晚上',
    late_night: '深夜'
  };
  
  return labels[timeOfDay] || '未知';
};

/**
 * 获取季节
 * @param {Date} date 时间
 * @returns {string} 季节
 */
export const getSeason = (date = new Date()) => {
  const month = new Date(date).getMonth() + 1;
  
  if (month >= 3 && month <= 5) {
    return 'spring'; // 春季
  } else if (month >= 6 && month <= 8) {
    return 'summer'; // 夏季
  } else if (month >= 9 && month <= 11) {
    return 'autumn'; // 秋季
  } else {
    return 'winter'; // 冬季
  }
};

/**
 * 获取季节中文描述
 * @param {string} season 季节
 * @returns {string} 中文描述
 */
export const getSeasonLabel = (season) => {
  const labels = {
    spring: '春季',
    summer: '夏季',
    autumn: '秋季',
    winter: '冬季'
  };
  
  return labels[season] || '未知';
};

/**
 * 获取星期
 * @param {Date} date 时间
 * @returns {string} 星期
 */
export const getDayOfWeek = (date = new Date()) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
};

/**
 * 获取星期中文描述
 * @param {string} dayOfWeek 星期
 * @returns {string} 中文描述
 */
export const getDayOfWeekLabel = (dayOfWeek) => {
  const labels = {
    sunday: '星期日',
    monday: '星期一',
    tuesday: '星期二',
    wednesday: '星期三',
    thursday: '星期四',
    friday: '星期五',
    saturday: '星期六'
  };
  
  return labels[dayOfWeek] || '未知';
};

/**
 * 检查是否为工作日
 * @param {Date} date 时间
 * @returns {boolean} 是否为工作日
 */
export const isWeekday = (date = new Date()) => {
  const day = new Date(date).getDay();
  return day >= 1 && day <= 5;
};

/**
 * 检查是否为周末
 * @param {Date} date 时间
 * @returns {boolean} 是否为周末
 */
export const isWeekend = (date = new Date()) => {
  return !isWeekday(date);
};

/**
 * 获取月份名称
 * @param {Date} date 时间
 * @returns {string} 月份名称
 */
export const getMonthName = (date = new Date()) => {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  return months[new Date(date).getMonth()];
};

/**
 * 获取月份中文名称
 * @param {string} month 月份
 * @returns {string} 中文名称
 */
export const getMonthLabel = (month) => {
  const labels = {
    january: '一月',
    february: '二月',
    march: '三月',
    april: '四月',
    may: '五月',
    june: '六月',
    july: '七月',
    august: '八月',
    september: '九月',
    october: '十月',
    november: '十一月',
    december: '十二月'
  };
  
  return labels[month] || '未知';
};

/**
 * 获取时间戳
 * @param {Date} date 时间
 * @returns {number} 时间戳
 */
export const getTimestamp = (date = new Date()) => {
  return new Date(date).getTime();
};

/**
 * 从时间戳创建日期
 * @param {number} timestamp 时间戳
 * @returns {Date} 日期对象
 */
export const fromTimestamp = (timestamp) => {
  return new Date(timestamp);
};

/**
 * 获取今天的开始时间
 * @returns {Date} 今天开始时间
 */
export const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * 获取今天的结束时间
 * @returns {Date} 今天结束时间
 */
export const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * 添加时间
 * @param {Date} date 基础时间
 * @param {number} amount 数量
 * @param {string} unit 单位 'seconds' | 'minutes' | 'hours' | 'days'
 * @returns {Date} 新时间
 */
export const addTime = (date, amount, unit) => {
  const d = new Date(date);
  
  switch (unit) {
    case 'seconds':
      d.setSeconds(d.getSeconds() + amount);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + amount);
      break;
    case 'hours':
      d.setHours(d.getHours() + amount);
      break;
    case 'days':
      d.setDate(d.getDate() + amount);
      break;
    default:
      throw new Error('不支持的时间单位');
  }
  
  return d;
};

/**
 * 获取时区偏移
 * @param {Date} date 时间
 * @returns {number} 时区偏移（分钟）
 */
export const getTimezoneOffset = (date = new Date()) => {
  return new Date(date).getTimezoneOffset();
};

/**
 * 获取本地时区名称
 * @returns {string} 时区名称
 */
export const getLocalTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
