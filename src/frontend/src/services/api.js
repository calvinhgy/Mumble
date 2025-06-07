import axios from 'axios';
import { API_BASE_URL, DEBUG_MODE } from '../config/constants';
import { getDeviceId } from '../utils/device';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加设备ID
    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers['X-Device-ID'] = deviceId;
    }
    
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    if (DEBUG_MODE) {
      console.log('API Request:', config);
    }
    
    return config;
  },
  (error) => {
    if (DEBUG_MODE) {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    if (DEBUG_MODE) {
      console.log('API Response:', response);
    }
    return response;
  },
  (error) => {
    if (DEBUG_MODE) {
      console.error('API Response Error:', error);
    }
    
    // 处理网络错误
    if (!error.response) {
      error.message = '网络连接失败，请检查网络设置';
    } else {
      // 处理HTTP错误
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          error.message = data?.error?.message || '请求参数错误';
          break;
        case 401:
          error.message = '未授权访问';
          break;
        case 403:
          error.message = '访问被拒绝';
          break;
        case 404:
          error.message = '请求的资源不存在';
          break;
        case 429:
          error.message = '请求过于频繁，请稍后重试';
          break;
        case 500:
          error.message = '服务器内部错误';
          break;
        default:
          error.message = data?.error?.message || '发生未知错误';
      }
    }
    
    return Promise.reject(error);
  }
);

// 音频相关API
export const audioAPI = {
  // 上传音频文件
  uploadAudio: (audioBlob, metadata = {}) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('metadata', JSON.stringify(metadata));
    
    return api.post('/audio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // 获取音频分析结果
  getAnalysis: (audioId) => {
    return api.get(`/audio/${audioId}/analysis`);
  }
};

// 环境数据相关API
export const environmentAPI = {
  // 提交环境数据
  submitEnvironmentData: (data) => {
    return api.post('/environment', data);
  },
  
  // 获取天气数据
  getWeatherData: (lat, lon) => {
    return api.get('/environment/weather', {
      params: { lat, lon }
    });
  }
};

// 图像相关API
export const imageAPI = {
  // 请求生成图像
  generateImage: (audioId, environmentId, stylePreference = 'balanced') => {
    return api.post('/images/generate', {
      audioId,
      environmentId,
      stylePreference
    });
  },
  
  // 获取图像生成状态
  getImageStatus: (requestId) => {
    return api.get(`/images/status/${requestId}`);
  },
  
  // 获取图库
  getGallery: (params = {}) => {
    return api.get('/images/gallery', { params });
  },
  
  // 获取图像详情
  getImageDetails: (imageId) => {
    return api.get(`/images/${imageId}`);
  },
  
  // 导出图像
  exportImage: (imageId, format = 'jpg', quality = 90) => {
    return api.get(`/images/${imageId}/export`, {
      params: { format, quality },
      responseType: 'blob'
    });
  },
  
  // 删除图像
  deleteImage: (imageId) => {
    return api.delete(`/images/${imageId}`);
  }
};

// 用户偏好相关API
export const preferenceAPI = {
  // 获取用户偏好
  getPreferences: () => {
    return api.get('/preferences');
  },
  
  // 更新用户偏好
  updatePreferences: (preferences) => {
    return api.put('/preferences', preferences);
  }
};

// 健康检查API
export const healthAPI = {
  // 检查服务状态
  checkHealth: () => {
    return api.get('/health');
  },
  
  // 获取系统信息
  getSystemInfo: () => {
    return api.get('/health/system');
  }
};

export default api;
