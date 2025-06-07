// API配置
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

// 音频录制配置
export const AUDIO_CONFIG = {
  MAX_DURATION: parseInt(process.env.REACT_APP_MAX_RECORDING_DURATION) || 30000, // 30秒
  SAMPLE_RATE: parseInt(process.env.REACT_APP_AUDIO_SAMPLE_RATE) || 44100,
  CHANNELS: parseInt(process.env.REACT_APP_AUDIO_CHANNELS) || 1,
  MIN_DURATION: 500, // 最小录音时长500ms
  CHUNK_SIZE: 1024,
  MIME_TYPE: 'audio/webm;codecs=opus'
};

// 地理位置配置
export const GEOLOCATION_CONFIG = {
  TIMEOUT: parseInt(process.env.REACT_APP_GEOLOCATION_TIMEOUT) || 10000,
  MAXIMUM_AGE: 300000, // 5分钟
  ENABLE_HIGH_ACCURACY: true
};

// 图片配置
export const IMAGE_CONFIG = {
  MAX_SIZE: parseInt(process.env.REACT_APP_MAX_IMAGE_SIZE) || 10485760, // 10MB
  SUPPORTED_FORMATS: (process.env.REACT_APP_SUPPORTED_IMAGE_FORMATS || 'jpg,jpeg,png,webp').split(','),
  THUMBNAIL_SIZE: 300,
  QUALITY: 0.8
};

// UI配置
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  LOADING_DELAY: 200
};

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  PERMISSION_DENIED: '权限被拒绝，请在设置中允许相关权限',
  AUDIO_NOT_SUPPORTED: '您的浏览器不支持音频录制功能',
  GEOLOCATION_NOT_SUPPORTED: '您的浏览器不支持地理位置功能',
  FILE_TOO_LARGE: '文件大小超出限制',
  INVALID_FILE_FORMAT: '不支持的文件格式',
  RECORDING_TOO_SHORT: '录音时间过短，请至少录制0.5秒',
  RECORDING_TOO_LONG: '录音时间过长，最多支持30秒',
  UNKNOWN_ERROR: '发生未知错误，请稍后重试'
};

// 成功消息
export const SUCCESS_MESSAGES = {
  IMAGE_GENERATED: '图片生成成功！',
  IMAGE_SAVED: '图片保存成功！',
  IMAGE_SHARED: '图片分享成功！',
  IMAGE_DELETED: '图片删除成功！',
  SETTINGS_SAVED: '设置保存成功！'
};

// 本地存储键名
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'mumble_user_preferences',
  DEVICE_ID: 'mumble_device_id',
  FIRST_TIME: 'mumble_first_time',
  CACHED_IMAGES: 'mumble_cached_images',
  ENVIRONMENT_DATA: 'mumble_environment_data'
};

// 风格选项
export const STYLE_OPTIONS = [
  { value: 'realistic', label: '写实风格', description: '真实感强，细节丰富' },
  { value: 'artistic', label: '艺术风格', description: '富有创意，表现力强' },
  { value: 'abstract', label: '抽象风格', description: '概念化，富有想象力' },
  { value: 'minimalist', label: '简约风格', description: '简洁明了，突出重点' },
  { value: 'vintage', label: '复古风格', description: '怀旧感，经典韵味' },
  { value: 'futuristic', label: '未来风格', description: '科技感，前卫设计' }
];

// 排序选项
export const SORT_OPTIONS = [
  { value: 'createdAt', label: '创建时间' },
  { value: 'updatedAt', label: '修改时间' },
  { value: 'size', label: '文件大小' }
];

// 时间格式
export const TIME_FORMATS = {
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  RELATIVE: 'relative'
};

// 调试模式
export const DEBUG_MODE = process.env.REACT_APP_DEBUG_MODE === 'true';
export const MOCK_API = process.env.REACT_APP_MOCK_API === 'true';
